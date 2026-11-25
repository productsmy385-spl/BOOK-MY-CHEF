package com.marketplace.event;

import com.marketplace.catalog.ServiceCatalog;
import com.marketplace.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Customer events: a checklist of needed services, the bookings made for the
 * event, and a budget tracked against real booking amounts. Every query is
 * scoped to the authenticated customer.
 */
@Service
@RequiredArgsConstructor
public class EventService {

    /** Booking statuses whose amount is committed (provider agreed). */
    static final String COMMITTED = "'PENDING_PAYMENT','CONFIRMED','IN_PROGRESS','COMPLETED'";
    /** Booking statuses still waiting for the provider or the customer. */
    static final String OPEN = "'PENDING_PROVIDER_CONFIRMATION','QUOTATION_SENT'";

    private final NamedParameterJdbcTemplate jdbc;

    // ================================================================== reads

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(UUID customerId) {
        return jdbc.queryForList("""
                SELECT e.id, e.title, e.event_type AS "eventType", e.event_date::text AS "eventDate",
                       to_char(e.event_time, 'HH24:MI') AS "eventTime", e.city, e.guest_count AS "guests", e.budget, e.status,
                       (SELECT COUNT(*) FROM customer_event_needs n WHERE n.event_id = e.id) AS "needsTotal",
                       (SELECT COUNT(*) FROM customer_event_needs n WHERE n.event_id = e.id AND EXISTS (
                            SELECT 1 FROM bookings b WHERE b.event_id = e.id AND b.service_category = n.category
                              AND b.booking_status IN (%s))) AS "needsBooked",
                       (SELECT COALESCE(SUM(COALESCE(b.final_amount, b.estimated_total)), 0) FROM bookings b
                          WHERE b.event_id = e.id AND b.booking_status IN (%s)) AS "committed"
                FROM customer_events e WHERE e.customer_id = :cid
                ORDER BY (e.status = 'PLANNING') DESC, e.event_date""".formatted(COMMITTED, COMMITTED), Map.of("cid", customerId));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> get(UUID customerId, UUID eventId) {
        Map<String, Object> e = new LinkedHashMap<>(loadOwned(customerId, eventId, """
                id, title, event_type AS "eventType", event_date::text AS "eventDate", to_char(event_time, 'HH24:MI') AS "eventTime",
                city, venue, guest_count AS "guests", budget, notes, status, created_at::text AS "createdAt\""""));

        List<Map<String, Object>> bookings = jdbc.queryForList("""
                SELECT b.id, b.booking_reference AS "reference", b.booking_status AS "status", b.payment_status AS "paymentStatus",
                       b.service_category AS "category", b.service_title AS "serviceTitle",
                       b.event_date::text AS "eventDate", to_char(b.event_time, 'HH24:MI') AS "eventTime", b.guest_count AS "guests",
                       b.estimated_total AS "estimatedTotal", b.final_amount AS "finalAmount",
                       pp.id AS "providerId", pp.professional_name AS "providerName", pp.business_name AS "businessName",
                       pp.avatar_url AS "providerAvatarUrl"
                FROM bookings b JOIN provider_profiles pp ON pp.id = b.provider_id
                WHERE b.event_id = :id AND b.customer_id = :cid
                ORDER BY b.event_date, b.event_time NULLS LAST, b.created_at""", Map.of("id", eventId, "cid", customerId));

        List<Map<String, Object>> needs = new ArrayList<>();
        Set<String> needCategories = new HashSet<>();
        for (Map<String, Object> n : jdbc.queryForList("""
                SELECT id, category, budget_allocation AS "budgetAllocation", notes FROM customer_event_needs
                WHERE event_id = :id ORDER BY sort_order, created_at""", Map.of("id", eventId))) {
            Map<String, Object> need = new LinkedHashMap<>(n);
            String cat = (String) need.get("category");
            needCategories.add(cat);
            List<Map<String, Object>> mine = bookings.stream().filter(b -> cat.equals(b.get("category"))).toList();
            need.put("bookings", mine);
            need.put("state", needState(mine));
            needs.add(need);
        }
        e.put("needs", needs);
        e.put("otherBookings", bookings.stream().filter(b -> !needCategories.contains((String) b.get("category"))).toList());
        e.put("budgetSummary", budgetSummary(eventId, (BigDecimal) e.get("budget"),
                needs.stream().map(n -> (BigDecimal) n.get("budgetAllocation")).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add)));
        e.put("bookingCount", bookings.size());
        return e;
    }

    /** NOT_STARTED, REQUESTED (only open requests), BOOKED (at least one committed booking). */
    static String needState(List<Map<String, Object>> bookings) {
        if (bookings.stream().anyMatch(b -> COMMITTED.contains("'" + b.get("status") + "'"))) return "BOOKED";
        if (bookings.stream().anyMatch(b -> OPEN.contains("'" + b.get("status") + "'"))) return "REQUESTED";
        return "NOT_STARTED";
    }

    private Map<String, Object> budgetSummary(UUID eventId, BigDecimal budget, BigDecimal allocated) {
        Map<String, Object> s = new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT
                  COALESCE(SUM(COALESCE(final_amount, estimated_total)) FILTER (WHERE booking_status IN (%s)), 0) AS "committed",
                  COALESCE(SUM(COALESCE(final_amount, estimated_total)) FILTER (WHERE booking_status IN (%s)), 0) AS "pending",
                  COUNT(*) FILTER (WHERE booking_status IN (%s) AND COALESCE(final_amount, estimated_total) IS NULL) AS "awaitingPrice",
                  COALESCE(SUM(final_amount) FILTER (WHERE payment_status IN ('CAPTURED', 'ESCROW_HELD')), 0) AS "paidOnline"
                FROM bookings WHERE event_id = :id""".formatted(COMMITTED, OPEN, OPEN), Map.of("id", eventId)));
        BigDecimal committed = (BigDecimal) s.get("committed");
        BigDecimal pending = (BigDecimal) s.get("pending");
        s.put("budget", budget);
        s.put("allocated", allocated);
        s.put("remaining", budget == null ? null : budget.subtract(committed).subtract(pending));
        return s;
    }

    // ================================================================== writes

    @Transactional
    public UUID create(UUID customerId, EventRequests.Upsert r) {
        validate(r);
        if (r.eventDate().isBefore(LocalDate.now())) throw ApiException.invalid("Choose today or a future date.");
        Integer active = jdbc.queryForObject("SELECT COUNT(*) FROM customer_events WHERE customer_id = :cid AND status = 'PLANNING'",
                Map.of("cid", customerId), Integer.class);
        if (active != null && active >= 50) throw ApiException.invalid("You can plan up to 50 events at a time.");
        UUID id = jdbc.queryForObject("""
                INSERT INTO customer_events (customer_id, title, event_type, event_date, event_time, city, venue, guest_count, budget, notes)
                VALUES (:cid, :title, :type, :date, :time, :city, :venue, :guests, :budget, :notes) RETURNING id""",
                params(r).addValue("cid", customerId), UUID.class);
        List<String> needs = r.needs() != null ? r.needs() : EventCatalog.find(r.eventType()).map(EventCatalog.EventType::suggested).orElse(List.of());
        List<String> clean = needs.stream().distinct().toList();
        if (clean.stream().anyMatch(c -> !ServiceCatalog.isCategory(c))) throw ApiException.invalid("Unknown service.");
        for (int i = 0; i < clean.size(); i++) {
            jdbc.update("INSERT INTO customer_event_needs (event_id, category, sort_order) VALUES (:id, :cat, :sort)",
                    Map.of("id", id, "cat", clean.get(i), "sort", i));
        }
        return id;
    }

    @Transactional
    public void update(UUID customerId, UUID eventId, EventRequests.Upsert r) {
        validate(r);
        loadOwned(customerId, eventId, "id");
        jdbc.update("""
                UPDATE customer_events SET title = :title, event_type = :type, event_date = :date, event_time = :time, city = :city,
                    venue = :venue, guest_count = :guests, budget = :budget, notes = :notes, updated_at = now()
                WHERE id = :id AND customer_id = :cid""", params(r).addValue("id", eventId).addValue("cid", customerId));
    }

    @Transactional
    public void setStatus(UUID customerId, UUID eventId, String status) {
        loadOwned(customerId, eventId, "id");
        jdbc.update("UPDATE customer_events SET status = :s, updated_at = now() WHERE id = :id",
                Map.of("s", status, "id", eventId));
    }

    @Transactional
    public void delete(UUID customerId, UUID eventId) {
        loadOwned(customerId, eventId, "id");
        Integer open = jdbc.queryForObject("""
                SELECT COUNT(*) FROM bookings WHERE event_id = :id AND booking_status IN (%s, %s)""".formatted(OPEN, COMMITTED),
                Map.of("id", eventId), Integer.class);
        if (open != null && open > 0) {
            throw ApiException.conflict("This event has active bookings. Cancel them or mark the event cancelled instead.");
        }
        jdbc.update("DELETE FROM customer_events WHERE id = :id AND customer_id = :cid", Map.of("id", eventId, "cid", customerId));
    }

    @Transactional
    public void addNeed(UUID customerId, UUID eventId, EventRequests.Need r) {
        loadOwned(customerId, eventId, "id");
        if (!ServiceCatalog.isCategory(r.category())) throw ApiException.invalid("Unknown service.");
        Integer next = jdbc.queryForObject("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM customer_event_needs WHERE event_id = :id",
                Map.of("id", eventId), Integer.class);
        int n = jdbc.update("""
                INSERT INTO customer_event_needs (event_id, category, budget_allocation, notes, sort_order)
                VALUES (:id, :cat, :alloc, :notes, :sort) ON CONFLICT (event_id, category) DO NOTHING""",
                new MapSqlParameterSource().addValue("id", eventId).addValue("cat", r.category())
                        .addValue("alloc", r.budgetAllocation()).addValue("notes", blankToNull(r.notes())).addValue("sort", next));
        if (n == 0) throw ApiException.conflict("This service is already on your checklist.");
    }

    @Transactional
    public void updateNeed(UUID customerId, UUID eventId, UUID needId, EventRequests.Need r) {
        loadOwned(customerId, eventId, "id");
        int n = jdbc.update("""
                UPDATE customer_event_needs SET budget_allocation = :alloc, notes = :notes WHERE id = :nid AND event_id = :id""",
                new MapSqlParameterSource().addValue("alloc", r.budgetAllocation()).addValue("notes", blankToNull(r.notes()))
                        .addValue("nid", needId).addValue("id", eventId));
        if (n == 0) throw ApiException.notFound("Checklist item");
    }

    @Transactional
    public void removeNeed(UUID customerId, UUID eventId, UUID needId) {
        loadOwned(customerId, eventId, "id");
        if (jdbc.update("DELETE FROM customer_event_needs WHERE id = :nid AND event_id = :id", Map.of("nid", needId, "id", eventId)) == 0) {
            throw ApiException.notFound("Checklist item");
        }
    }

    /** Attaches one of the customer's own bookings to the event, or detaches it (eventId null). */
    @Transactional
    public void linkBooking(UUID customerId, UUID eventId, UUID bookingId, boolean attach) {
        loadOwned(customerId, eventId, "id");
        int n = attach
                ? jdbc.update("UPDATE bookings SET event_id = :eid, updated_at = now() WHERE id = :bid AND customer_id = :cid",
                        Map.of("eid", eventId, "bid", bookingId, "cid", customerId))
                : jdbc.update("UPDATE bookings SET event_id = NULL, updated_at = now() WHERE id = :bid AND customer_id = :cid AND event_id = :eid",
                        Map.of("eid", eventId, "bid", bookingId, "cid", customerId));
        if (n == 0) throw ApiException.notFound("Booking");
    }

    /** Used by booking creation: the event must be the customer's own and still being planned. */
    public void assertBookable(UUID customerId, UUID eventId) {
        Map<String, Object> e = loadOwned(customerId, eventId, "status");
        if (!"PLANNING".equals(e.get("status"))) throw ApiException.conflict("This event is no longer being planned.");
    }

    // ================================================================== helpers

    private Map<String, Object> loadOwned(UUID customerId, UUID eventId, String columns) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + columns + " FROM customer_events WHERE id = :id AND customer_id = :cid",
                Map.of("id", eventId, "cid", customerId));
        if (rows.isEmpty()) throw ApiException.notFound("Event");
        return rows.get(0);
    }

    private static void validate(EventRequests.Upsert r) {
        if (EventCatalog.find(r.eventType()).isEmpty()) throw ApiException.invalid("Unknown event type.");
    }

    private static MapSqlParameterSource params(EventRequests.Upsert r) {
        return new MapSqlParameterSource()
                .addValue("title", r.title().trim())
                .addValue("type", r.eventType())
                .addValue("date", r.eventDate())
                .addValue("time", r.eventTime())
                .addValue("city", r.city().trim())
                .addValue("venue", blankToNull(r.venue()))
                .addValue("guests", r.guestCount())
                .addValue("budget", r.budget())
                .addValue("notes", blankToNull(r.notes()));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
