package com.marketplace.booking;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.catalog.ServiceCatalog;
import com.marketplace.common.ApiException;
import com.marketplace.common.PageResponse;
import com.marketplace.common.SettingsService;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.notification.NotificationService;
import com.marketplace.provider.ProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Booking lifecycle with server-enforced transitions (see {@link BookingStatus}).
 *
 * Double booking is prevented by taking a row lock on the provider
 * (SELECT ... FOR UPDATE) before counting the provider's occupied bookings for
 * the date, in the same transaction that occupies a slot. Concurrent accepts
 * for the same provider therefore serialize and the second one sees the first.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final NamedParameterJdbcTemplate jdbc;
    private final ProviderRepository providers;
    private final NotificationService notifications;
    private final SettingsService settings;
    private final ObjectMapper objectMapper;

    // ================================================================== create

    @Transactional
    public Map<String, Object> create(UUID customerId, BookingRequests.Create r) {
        if (!providers.isPubliclyListed(r.providerId())) {
            throw ApiException.notFound("Provider");
        }
        Map<String, Object> provider = lockProvider(r.providerId());
        if (!Boolean.TRUE.equals(provider.get("is_accepting_bookings"))) {
            throw ApiException.conflict("This provider is not accepting new bookings right now.");
        }

        List<Map<String, Object>> svcRows = jdbc.queryForList("""
                SELECT s.id, s.title, s.role_type, s.service_delivery_mode, s.min_guests, s.max_guests, s.is_active,
                       spm.code AS pricing_model, sp.amount
                FROM services s
                JOIN service_prices sp ON sp.service_id = s.id
                JOIN service_pricing_models spm ON spm.id = sp.pricing_model_id
                WHERE s.id = :sid AND s.provider_id = :pid""", Map.of("sid", r.serviceId(), "pid", r.providerId()));
        if (svcRows.isEmpty() || !Boolean.TRUE.equals(svcRows.get(0).get("is_active"))) {
            throw ApiException.notFound("Service");
        }
        Map<String, Object> svc = svcRows.get(0);
        Integer minGuests = (Integer) svc.get("min_guests");
        Integer maxGuests = (Integer) svc.get("max_guests");
        if (minGuests != null && r.guestCount() < minGuests) {
            throw ApiException.invalid("This service needs at least " + minGuests + " guests.");
        }
        if (maxGuests != null && r.guestCount() > maxGuests) {
            throw ApiException.invalid("This service can serve at most " + maxGuests + " guests.");
        }

        assertDateBookable(r.providerId(), r.eventDate(), r.eventTime());

        Integer duplicate = jdbc.queryForObject("""
                SELECT COUNT(*) FROM bookings WHERE customer_id = :cid AND provider_id = :pid AND event_date = :d
                  AND booking_status IN (%s)""".formatted(BookingStatus.sqlList(BookingStatus.OPEN)),
                Map.of("cid", customerId, "pid", r.providerId(), "d", r.eventDate()), Integer.class);
        if (duplicate != null && duplicate > 0) {
            throw ApiException.conflict("You already have an open request with this provider for that date.");
        }

        String pricingModel = (String) svc.get("pricing_model");
        BigDecimal estimate = ServiceCatalog.estimate(pricingModel, (BigDecimal) svc.get("amount"),
                r.guestCount(), r.hours(), r.days());

        Map<String, Object> details = new LinkedHashMap<>();
        if (r.details() != null) details.putAll(r.details());
        if (r.hours() != null) details.put("hours", String.valueOf(r.hours()));
        if (r.days() != null) details.put("days", String.valueOf(r.days()));

        String reference = newReference();
        UUID bookingId = jdbc.queryForObject("""
                INSERT INTO bookings (booking_reference, customer_id, provider_id, service_id, booking_status, payment_status,
                    event_date, event_time, time_slot, guest_count, service_delivery_mode, estimated_total,
                    event_address, event_city, budget_amount, cuisine_preference, service_category, pricing_model,
                    service_title, host_special_instructions, details)
                VALUES (:ref, :cid, :pid, :sid, 'PENDING_PROVIDER_CONFIRMATION', 'PENDING',
                    :date, :time, :slot, :guests, :mode, :estimate,
                    :address, :city, :budget, :cuisine, :category, :pricing,
                    :title, :instructions, CAST(:details AS jsonb))
                RETURNING id""",
                new MapSqlParameterSource()
                        .addValue("ref", reference).addValue("cid", customerId).addValue("pid", r.providerId())
                        .addValue("sid", r.serviceId()).addValue("date", r.eventDate()).addValue("time", r.eventTime())
                        .addValue("slot", timeSlot(r.eventTime())).addValue("guests", r.guestCount())
                        .addValue("mode", svc.get("service_delivery_mode")).addValue("estimate", estimate)
                        .addValue("address", r.eventAddress().trim()).addValue("city", r.eventCity().trim())
                        .addValue("budget", r.budget()).addValue("cuisine", blankToNull(r.cuisinePreference()))
                        .addValue("category", svc.get("role_type")).addValue("pricing", pricingModel)
                        .addValue("title", svc.get("title")).addValue("instructions", blankToNull(r.specialInstructions()))
                        .addValue("details", toJson(details)),
                UUID.class);

        recordHistory(bookingId, "NONE", BookingStatus.PENDING_PROVIDER_CONFIRMATION, customerId, null);
        notifications.notify((UUID) provider.get("user_id"), "BOOKING_REQUEST", "New booking request " + reference,
                r.guestCount() + " guests on " + r.eventDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) + " for " + svc.get("title") + ".",
                "/provider/bookings/" + bookingId);
        log.info("Booking {} requested by {} for provider {}", reference, customerId, r.providerId());
        return get(bookingId, customerId, "CUSTOMER");
    }

    // ================================================================== provider actions

    @Transactional
    public Map<String, Object> accept(AuthenticatedUserPrincipal u, UUID bookingId, String message) {
        Map<String, Object> b = loadForProvider(u, bookingId);
        BookingStatus current = status(b);
        if (current != BookingStatus.PENDING_PROVIDER_CONFIRMATION) {
            throw invalidTransition(current, "accept");
        }
        if (b.get("estimated_total") == null) {
            throw ApiException.invalid("This service is priced on request. Send a quotation instead of accepting directly.");
        }
        lockProvider((UUID) b.get("provider_id"));
        assertCapacity((UUID) b.get("provider_id"), (LocalDate) date(b), bookingId);

        BookingStatus next = settings.getBoolean(SettingsService.PAYMENT_REQUIRED, false)
                ? BookingStatus.PENDING_PAYMENT : BookingStatus.CONFIRMED;
        jdbc.update("""
                UPDATE bookings SET booking_status = :s, final_amount = estimated_total,
                    payment_status = :pay, provider_message = COALESCE(:msg, provider_message), updated_at = now()
                WHERE id = :id""", new MapSqlParameterSource().addValue("s", next.name()).addValue("id", bookingId)
                .addValue("pay", next == BookingStatus.CONFIRMED ? "NOT_REQUIRED" : "PENDING")
                .addValue("msg", blankToNull(message)));
        recordHistory(bookingId, current.name(), next, u.getUserId(), "Accepted by provider");
        notifyCustomer(b, "BOOKING_ACCEPTED", "Booking accepted",
                next == BookingStatus.CONFIRMED
                        ? "Your booking " + b.get("booking_reference") + " is confirmed."
                        : "Your booking " + b.get("booking_reference") + " was accepted. Complete payment to confirm it.");
        return get(bookingId, u.getUserId(), "PROVIDER");
    }

    @Transactional
    public Map<String, Object> reject(AuthenticatedUserPrincipal u, UUID bookingId, String reason) {
        Map<String, Object> b = loadForProvider(u, bookingId);
        BookingStatus current = status(b);
        if (current != BookingStatus.PENDING_PROVIDER_CONFIRMATION) throw invalidTransition(current, "decline");
        transition(bookingId, current, BookingStatus.PROVIDER_REJECTED, u.getUserId(), reason);
        jdbc.update("UPDATE bookings SET provider_message = COALESCE(:msg, provider_message) WHERE id = :id",
                new MapSqlParameterSource().addValue("id", bookingId).addValue("msg", blankToNull(reason)));
        notifyCustomer(b, "BOOKING_REJECTED", "Booking declined",
                "The provider could not take booking " + b.get("booking_reference") + (reason == null || reason.isBlank() ? "." : ": " + reason));
        return get(bookingId, u.getUserId(), "PROVIDER");
    }

    /** "Request clarification": message to the customer, status unchanged. */
    @Transactional
    public Map<String, Object> askClarification(AuthenticatedUserPrincipal u, UUID bookingId, String message) {
        Map<String, Object> b = loadForProvider(u, bookingId);
        BookingStatus current = status(b);
        if (current != BookingStatus.PENDING_PROVIDER_CONFIRMATION && current != BookingStatus.QUOTATION_SENT) {
            throw ApiException.conflict("Clarifications can only be requested on open requests.");
        }
        jdbc.update("UPDATE bookings SET provider_message = :msg, updated_at = now() WHERE id = :id",
                Map.of("msg", message.trim(), "id", bookingId));
        notifyCustomer(b, "BOOKING_CLARIFICATION", "The provider has a question", message.trim());
        return get(bookingId, u.getUserId(), "PROVIDER");
    }

    @Transactional
    public Map<String, Object> quote(AuthenticatedUserPrincipal u, UUID bookingId, BookingRequests.Quote q) {
        Map<String, Object> b = loadForProvider(u, bookingId);
        BookingStatus current = status(b);
        if (current != BookingStatus.PENDING_PROVIDER_CONFIRMATION && current != BookingStatus.QUOTATION_SENT) {
            throw invalidTransition(current, "send a quotation for");
        }
        BigDecimal subtotal = q.items().stream()
                .map(i -> i.unitPrice().multiply(BigDecimal.valueOf(i.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal travel = nz(q.travelCharges());
        BigDecimal ingredients = nz(q.ingredientCharges());
        BigDecimal staff = nz(q.staffCharges());
        BigDecimal total = subtotal.add(travel).add(ingredients).add(staff);
        if (total.signum() <= 0) throw ApiException.invalid("The quotation total must be more than zero.");

        jdbc.update("UPDATE booking_quotations SET quotation_status = 'REVISED' WHERE booking_id = :id AND quotation_status = 'SENT'",
                Map.of("id", bookingId));
        Integer version = jdbc.queryForObject("SELECT COALESCE(MAX(quotation_version), 0) + 1 FROM booking_quotations WHERE booking_id = :id",
                Map.of("id", bookingId), Integer.class);
        UUID quotationId = jdbc.queryForObject("""
                INSERT INTO booking_quotations (booking_id, quotation_version, subtotal_amount, travel_charges, ingredient_charges,
                    additional_staff_charges, platform_service_fee, tax_amount, total_amount, quotation_status, provider_notes)
                VALUES (:bid, :ver, :sub, :travel, :ingr, :staff, 0, 0, :total, 'SENT', :notes) RETURNING id""",
                new MapSqlParameterSource().addValue("bid", bookingId).addValue("ver", version).addValue("sub", subtotal)
                        .addValue("travel", travel).addValue("ingr", ingredients).addValue("staff", staff)
                        .addValue("total", total).addValue("notes", blankToNull(q.notes())), UUID.class);
        for (BookingRequests.QuoteItem item : q.items()) {
            jdbc.update("""
                    INSERT INTO booking_quotation_items (quotation_id, description, unit_price, quantity, total_price)
                    VALUES (:qid, :d, :p, :n, :t)""",
                    new MapSqlParameterSource().addValue("qid", quotationId).addValue("d", item.description().trim())
                            .addValue("p", item.unitPrice()).addValue("n", item.quantity())
                            .addValue("t", item.unitPrice().multiply(BigDecimal.valueOf(item.quantity()))));
        }
        jdbc.update("UPDATE bookings SET final_amount = :total WHERE id = :id", Map.of("total", total, "id", bookingId));
        transition(bookingId, current, BookingStatus.QUOTATION_SENT, u.getUserId(), "Quotation v" + version + " sent");
        notifyCustomer(b, "QUOTATION_RECEIVED", "Quotation received",
                "You received a quotation of ₹" + total.toPlainString() + " for booking " + b.get("booking_reference") + ".");
        return get(bookingId, u.getUserId(), "PROVIDER");
    }

    @Transactional
    public Map<String, Object> complete(AuthenticatedUserPrincipal u, UUID bookingId) {
        Map<String, Object> b = loadForProvider(u, bookingId);
        BookingStatus current = status(b);
        if (current != BookingStatus.CONFIRMED && current != BookingStatus.IN_PROGRESS) throw invalidTransition(current, "complete");
        if (date(b).isAfter(LocalDate.now())) {
            throw ApiException.conflict("A booking can be marked complete on or after the event date.");
        }
        transition(bookingId, current, BookingStatus.COMPLETED, u.getUserId(), "Service delivered");
        notifyCustomer(b, "BOOKING_COMPLETED", "How did it go?",
                "Booking " + b.get("booking_reference") + " is complete. Please rate your experience.");
        return get(bookingId, u.getUserId(), "PROVIDER");
    }

    // ================================================================== customer actions

    @Transactional
    public Map<String, Object> acceptQuote(AuthenticatedUserPrincipal u, UUID bookingId) {
        Map<String, Object> b = loadForCustomer(u, bookingId);
        BookingStatus current = status(b);
        if (current != BookingStatus.QUOTATION_SENT) throw invalidTransition(current, "accept a quotation for");
        lockProvider((UUID) b.get("provider_id"));
        assertCapacity((UUID) b.get("provider_id"), date(b), bookingId);

        BookingStatus next = settings.getBoolean(SettingsService.PAYMENT_REQUIRED, false)
                ? BookingStatus.PENDING_PAYMENT : BookingStatus.CONFIRMED;
        jdbc.update("UPDATE booking_quotations SET quotation_status = 'ACCEPTED' WHERE booking_id = :id AND quotation_status = 'SENT'",
                Map.of("id", bookingId));
        jdbc.update("UPDATE bookings SET payment_status = :pay WHERE id = :id",
                Map.of("id", bookingId, "pay", next == BookingStatus.CONFIRMED ? "NOT_REQUIRED" : "PENDING"));
        transition(bookingId, current, next, u.getUserId(), "Quotation accepted by customer");
        notifyProvider(b, "QUOTATION_ACCEPTED", "Quotation accepted",
                "The customer accepted your quotation for " + b.get("booking_reference") + ".");
        return get(bookingId, u.getUserId(), "CUSTOMER");
    }

    @Transactional
    public Map<String, Object> declineQuote(AuthenticatedUserPrincipal u, UUID bookingId, String reason) {
        Map<String, Object> b = loadForCustomer(u, bookingId);
        BookingStatus current = status(b);
        if (current != BookingStatus.QUOTATION_SENT) throw invalidTransition(current, "decline a quotation for");
        jdbc.update("UPDATE booking_quotations SET quotation_status = 'REJECTED' WHERE booking_id = :id AND quotation_status = 'SENT'",
                Map.of("id", bookingId));
        transition(bookingId, current, BookingStatus.CUSTOMER_CANCELLED, u.getUserId(), "Quotation declined" + suffix(reason));
        recordCancellation(bookingId, u.getUserId(), reason == null || reason.isBlank() ? "Quotation declined" : reason);
        notifyProvider(b, "QUOTATION_DECLINED", "Quotation declined",
                "The customer declined your quotation for " + b.get("booking_reference") + suffix(reason));
        return get(bookingId, u.getUserId(), "CUSTOMER");
    }

    /** Customer or provider cancels. */
    @Transactional
    public Map<String, Object> cancel(AuthenticatedUserPrincipal u, UUID bookingId, String reason) {
        boolean isProvider = "PROVIDER".equals(u.getUserType());
        Map<String, Object> b = isProvider ? loadForProvider(u, bookingId) : loadForCustomer(u, bookingId);
        BookingStatus current = status(b);
        BookingStatus next = isProvider ? BookingStatus.PROVIDER_CANCELLED : BookingStatus.CUSTOMER_CANCELLED;
        if (!current.canTransitionTo(next)) throw invalidTransition(current, "cancel");
        if (isProvider && (reason == null || reason.isBlank())) {
            throw ApiException.invalid("Please tell the customer why you are cancelling.");
        }
        transition(bookingId, current, next, u.getUserId(), "Cancelled" + suffix(reason));
        recordCancellation(bookingId, u.getUserId(), reason == null || reason.isBlank() ? "Cancelled by customer" : reason);
        if (isProvider) {
            notifyCustomer(b, "BOOKING_CANCELLED", "Booking cancelled by provider",
                    "Booking " + b.get("booking_reference") + " was cancelled" + suffix(reason));
        } else {
            notifyProvider(b, "BOOKING_CANCELLED", "Booking cancelled by customer",
                    "Booking " + b.get("booking_reference") + " was cancelled" + suffix(reason));
        }
        return get(bookingId, u.getUserId(), u.getUserType());
    }

    // ================================================================== reads

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listMine(AuthenticatedUserPrincipal u, String scope, int page, int size) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        String owner;
        if ("PROVIDER".equals(u.getUserType())) {
            owner = "b.provider_id = :ownerId";
            p.addValue("ownerId", providers.requireIdByUserId(u.getUserId()));
        } else {
            owner = "b.customer_id = :ownerId";
            p.addValue("ownerId", u.getUserId());
        }
        String scopeSql = switch (scope == null ? "all" : scope) {
            case "requests" -> "AND b.booking_status IN ('PENDING_PROVIDER_CONFIRMATION', 'QUOTATION_SENT', 'PENDING_PAYMENT')";
            case "upcoming" -> "AND b.booking_status IN ('CONFIRMED', 'IN_PROGRESS') AND b.event_date >= CURRENT_DATE";
            case "active" -> "AND b.booking_status IN ('PENDING_PROVIDER_CONFIRMATION', 'QUOTATION_SENT', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS')";
            case "past" -> "AND b.booking_status IN ('COMPLETED', 'PROVIDER_REJECTED', 'CUSTOMER_CANCELLED', 'PROVIDER_CANCELLED', 'EXPIRED', 'DISPUTED')";
            default -> "";
        };
        return page(owner + " " + scopeSql, p, page, size, "past".equals(scope) ? "b.event_date DESC" : "b.event_date ASC, b.created_at DESC");
    }

    /** Used by the admin console. */
    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> listAll(String status, String q, int page, int size) {
        MapSqlParameterSource p = new MapSqlParameterSource();
        List<String> where = new ArrayList<>(List.of("TRUE"));
        if (status != null && !status.isBlank()) {
            where.add("b.booking_status = :status");
            p.addValue("status", status);
        }
        if (q != null && !q.isBlank()) {
            where.add("(b.booking_reference ILIKE :q OR pp.professional_name ILIKE :q OR cu.full_name ILIKE :q)");
            p.addValue("q", "%" + q.trim().replace("%", "\\%").replace("_", "\\_") + "%");
        }
        return page(String.join(" AND ", where), p, page, size, "b.created_at DESC");
    }

    private PageResponse<Map<String, Object>> page(String where, MapSqlParameterSource p, int page, int size, String order) {
        int s = Math.min(Math.max(size, 1), 50);
        int pg = Math.max(page, 0);
        p.addValue("lim", s).addValue("off", pg * s);
        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT b.id, b.booking_reference AS "reference", b.booking_status AS "status", b.payment_status AS "paymentStatus",
                       b.event_date::text AS "eventDate", to_char(b.event_time, 'HH24:MI') AS "eventTime",
                       b.guest_count AS "guests", b.service_title AS "serviceTitle", b.service_category AS "category",
                       b.event_city AS "city", b.estimated_total AS "estimatedTotal", b.final_amount AS "finalAmount",
                       b.pricing_model AS "pricingModel", b.created_at::text AS "createdAt",
                       pp.id AS "providerId", pp.professional_name AS "providerName", pp.avatar_url AS "providerAvatarUrl",
                       cu.full_name AS "customerName",
                       EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS "reviewed",
                       COUNT(*) OVER () AS "_total"
                FROM bookings b
                JOIN provider_profiles pp ON pp.id = b.provider_id
                LEFT JOIN user_profiles cu ON cu.user_id = b.customer_id
                WHERE %s ORDER BY %s LIMIT :lim OFFSET :off""".formatted(where, order), p);
        long total = items.isEmpty() ? 0 : ((Number) items.get(0).get("_total")).longValue();
        items.forEach(m -> m.remove("_total"));
        return new PageResponse<>(items, pg, s, total);
    }

    /**
     * Full booking for an authorized viewer. Customers see their own, providers
     * see bookings made with them, admins see all. Contact details of the other
     * party are only revealed once the booking is confirmed.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> get(UUID bookingId, UUID viewerUserId, String viewerType) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT b.id, b.booking_reference AS "reference", b.booking_status AS "status", b.payment_status AS "paymentStatus",
                       b.event_date::text AS "eventDate", to_char(b.event_time, 'HH24:MI') AS "eventTime",
                       b.guest_count AS "guests", b.service_id AS "serviceId", b.service_title AS "serviceTitle",
                       b.service_category AS "category", b.service_delivery_mode AS "deliveryMode",
                       b.pricing_model AS "pricingModel", b.estimated_total AS "estimatedTotal", b.final_amount AS "finalAmount",
                       b.event_address AS "eventAddress", b.event_city AS "city", b.budget_amount AS "budget",
                       b.cuisine_preference AS "cuisinePreference", b.host_special_instructions AS "specialInstructions",
                       b.details::text AS "detailsJson", b.provider_message AS "providerMessage",
                       b.created_at::text AS "createdAt",
                       b.customer_id AS "customerId", cu.full_name AS "customerName", cuser.phone AS "customerPhone",
                       cuser.email AS "customerEmail",
                       pp.id AS "providerId", pp.user_id AS "providerUserId", pp.professional_name AS "providerName",
                       pp.avatar_url AS "providerAvatarUrl", puser.phone AS "providerPhone", puser.email AS "providerEmail",
                       EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id) AS "reviewed"
                FROM bookings b
                JOIN provider_profiles pp ON pp.id = b.provider_id
                JOIN users puser ON puser.id = pp.user_id
                JOIN users cuser ON cuser.id = b.customer_id
                LEFT JOIN user_profiles cu ON cu.user_id = b.customer_id
                WHERE b.id = :id""", Map.of("id", bookingId));
        if (rows.isEmpty()) throw ApiException.notFound("Booking");
        Map<String, Object> b = new LinkedHashMap<>(rows.get(0));

        boolean isCustomer = "CUSTOMER".equals(viewerType) && viewerUserId.equals(b.get("customerId"));
        boolean isProvider = "PROVIDER".equals(viewerType) && viewerUserId.equals(b.get("providerUserId"));
        boolean isAdmin = "ADMIN".equals(viewerType);
        if (!isCustomer && !isProvider && !isAdmin) throw ApiException.notFound("Booking");

        BookingStatus st = BookingStatus.valueOf((String) b.get("status"));
        boolean revealContacts = isAdmin || BookingStatus.OCCUPYING.contains(st) || st == BookingStatus.COMPLETED;
        if (!revealContacts) {
            b.put("customerPhone", null);
            b.put("customerEmail", null);
            b.put("providerPhone", null);
            b.put("providerEmail", null);
        }
        if (isProvider && !revealContacts) {
            b.put("eventAddress", null); // exact address shared once confirmed; city stays visible
        }
        b.remove("providerUserId");
        b.put("details", fromJson((String) b.remove("detailsJson")));
        b.put("viewerRole", isAdmin ? "ADMIN" : isCustomer ? "CUSTOMER" : "PROVIDER");
        b.put("allowedActions", allowedActions(st, isCustomer, isProvider, b));

        b.put("history", jdbc.queryForList("""
                SELECT from_status AS "from", to_status AS "to", transition_reason AS "reason", created_at::text AS "at"
                FROM booking_status_history WHERE booking_id = :id ORDER BY created_at""", Map.of("id", bookingId)));
        List<Map<String, Object>> quotes = jdbc.queryForList("""
                SELECT id, quotation_version AS "version", subtotal_amount AS "subtotal", travel_charges AS "travelCharges",
                       ingredient_charges AS "ingredientCharges", additional_staff_charges AS "staffCharges",
                       total_amount AS "total", quotation_status AS "status", provider_notes AS "notes", created_at::text AS "createdAt"
                FROM booking_quotations WHERE booking_id = :id ORDER BY quotation_version DESC LIMIT 1""", Map.of("id", bookingId));
        if (!quotes.isEmpty()) {
            Map<String, Object> quote = new LinkedHashMap<>(quotes.get(0));
            quote.put("items", jdbc.queryForList("""
                    SELECT description, unit_price AS "unitPrice", quantity, total_price AS "total"
                    FROM booking_quotation_items WHERE quotation_id = :qid ORDER BY description""", Map.of("qid", quote.get("id"))));
            b.put("quotation", quote);
        } else {
            b.put("quotation", null);
        }
        return b;
    }

    private List<String> allowedActions(BookingStatus st, boolean customer, boolean provider, Map<String, Object> b) {
        List<String> a = new ArrayList<>();
        if (provider) {
            if (st == BookingStatus.PENDING_PROVIDER_CONFIRMATION) {
                if (b.get("estimatedTotal") != null) a.add("ACCEPT");
                a.addAll(List.of("QUOTE", "CLARIFY", "REJECT"));
            }
            if (st == BookingStatus.QUOTATION_SENT) a.addAll(List.of("QUOTE", "CLARIFY"));
            if (st.canTransitionTo(BookingStatus.PROVIDER_CANCELLED)) a.add("CANCEL");
            if ((st == BookingStatus.CONFIRMED || st == BookingStatus.IN_PROGRESS)
                    && !LocalDate.parse((String) b.get("eventDate")).isAfter(LocalDate.now())) a.add("COMPLETE");
        }
        if (customer) {
            if (st == BookingStatus.QUOTATION_SENT) a.addAll(List.of("ACCEPT_QUOTE", "DECLINE_QUOTE"));
            if (st == BookingStatus.PENDING_PAYMENT) a.add("PAY");
            if (st.canTransitionTo(BookingStatus.CUSTOMER_CANCELLED) && st != BookingStatus.QUOTATION_SENT) a.add("CANCEL");
            if (st == BookingStatus.COMPLETED && !Boolean.TRUE.equals(b.get("reviewed"))) a.add("REVIEW");
        }
        return a;
    }

    // ================================================================== expiry

    /** Expires requests nobody acted on in time, and anything still open after its event date. */
    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 60 * 1000)
    @Transactional
    public void expireStaleRequests() {
        int hours = settings.getInt(SettingsService.REQUEST_EXPIRY_HOURS, 48);
        List<Map<String, Object>> stale = jdbc.queryForList("""
                SELECT id, booking_status, customer_id, booking_reference FROM bookings
                WHERE (booking_status = 'PENDING_PROVIDER_CONFIRMATION' AND created_at < now() - make_interval(hours => :h))
                   OR (booking_status IN ('PENDING_PROVIDER_CONFIRMATION', 'QUOTATION_SENT', 'PENDING_PAYMENT') AND event_date < CURRENT_DATE)
                FOR UPDATE SKIP LOCKED""", Map.of("h", hours));
        for (Map<String, Object> row : stale) {
            UUID id = (UUID) row.get("id");
            transition(id, BookingStatus.valueOf((String) row.get("booking_status")), BookingStatus.EXPIRED, null, "No response in time");
            notifications.notify((UUID) row.get("customer_id"), "BOOKING_EXPIRED", "Booking request expired",
                    "Request " + row.get("booking_reference") + " expired without a response. You can book another provider.",
                    "/bookings/" + id);
        }
        if (!stale.isEmpty()) log.info("Expired {} stale booking requests", stale.size());
    }

    // ================================================================== helpers

    private Map<String, Object> lockProvider(UUID providerId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, user_id, is_accepting_bookings FROM provider_profiles WHERE id = :id FOR UPDATE", Map.of("id", providerId));
        if (rows.isEmpty()) throw ApiException.notFound("Provider");
        return rows.get(0);
    }

    private void assertDateBookable(UUID providerId, LocalDate date, LocalTime time) {
        Map<String, Object> rules = jdbc.queryForList("""
                SELECT advance_notice_hours, max_advance_days FROM provider_booking_limits WHERE provider_id = :pid""",
                Map.of("pid", providerId)).stream().findFirst().orElse(Map.of());
        int notice = rules.get("advance_notice_hours") == null ? 0 : (Integer) rules.get("advance_notice_hours");
        int maxDays = rules.get("max_advance_days") == null ? 365 : (Integer) rules.get("max_advance_days");
        LocalDateTime when = LocalDateTime.of(date, time);
        if (when.isBefore(LocalDateTime.now().plusHours(notice))) {
            throw ApiException.invalid(notice > 0
                    ? "This provider needs at least " + notice + " hours' notice."
                    : "Choose a time in the future.");
        }
        if (date.isAfter(LocalDate.now().plusDays(maxDays))) {
            throw ApiException.invalid("This provider takes bookings up to " + maxDays + " days ahead.");
        }
        Boolean blocked = jdbc.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM provider_blocked_dates WHERE provider_id = :pid AND blocked_date = :d)",
                Map.of("pid", providerId, "d", date), Boolean.class);
        if (Boolean.TRUE.equals(blocked)) throw ApiException.conflict("The provider is not available on this date.");

        List<Map<String, Object>> weekly = jdbc.queryForList(
                "SELECT day_of_week, start_time, end_time, is_active FROM provider_availability WHERE provider_id = :pid",
                Map.of("pid", providerId));
        if (!weekly.isEmpty()) {
            int dow = date.getDayOfWeek().getValue();
            boolean ok = weekly.stream().anyMatch(w -> ((Integer) w.get("day_of_week")) == dow
                    && Boolean.TRUE.equals(w.get("is_active"))
                    && !time.isBefore(((java.sql.Time) w.get("start_time")).toLocalTime())
                    && !time.isAfter(((java.sql.Time) w.get("end_time")).toLocalTime()));
            if (!ok) throw ApiException.conflict("The provider does not work at that day and time. Check their weekly hours.");
        }
        assertCapacity(providerId, date, null);
    }

    /** Must be called while holding the provider row lock. */
    private void assertCapacity(UUID providerId, LocalDate date, UUID excludingBooking) {
        Integer max = jdbc.queryForList("SELECT max_daily_bookings FROM provider_booking_limits WHERE provider_id = :pid",
                Map.of("pid", providerId), Integer.class).stream().findFirst().orElse(1);
        Integer taken = jdbc.queryForObject("""
                SELECT COUNT(*) FROM bookings WHERE provider_id = :pid AND event_date = :d AND booking_status IN (%s)
                  AND (CAST(:ex AS uuid) IS NULL OR id <> :ex)""".formatted(BookingStatus.sqlList(BookingStatus.OCCUPYING)),
                new MapSqlParameterSource().addValue("pid", providerId).addValue("d", date).addValue("ex", excludingBooking),
                Integer.class);
        if (taken != null && taken >= max) {
            throw ApiException.conflict("The provider is fully booked on " + date.format(DateTimeFormatter.ofPattern("d MMM yyyy")) + ".");
        }
    }

    private Map<String, Object> loadForProvider(AuthenticatedUserPrincipal u, UUID bookingId) {
        if (!"PROVIDER".equals(u.getUserType())) throw ApiException.forbidden();
        UUID pid = providers.requireIdByUserId(u.getUserId());
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM bookings WHERE id = :id AND provider_id = :pid FOR UPDATE", Map.of("id", bookingId, "pid", pid));
        if (rows.isEmpty()) throw ApiException.notFound("Booking");
        return rows.get(0);
    }

    private Map<String, Object> loadForCustomer(AuthenticatedUserPrincipal u, UUID bookingId) {
        if (!"CUSTOMER".equals(u.getUserType())) throw ApiException.forbidden();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM bookings WHERE id = :id AND customer_id = :cid FOR UPDATE", Map.of("id", bookingId, "cid", u.getUserId()));
        if (rows.isEmpty()) throw ApiException.notFound("Booking");
        return rows.get(0);
    }

    private void transition(UUID bookingId, BookingStatus from, BookingStatus to, UUID actor, String reason) {
        if (!from.canTransitionTo(to)) throw invalidTransition(from, "move to " + to.name().toLowerCase());
        int updated = jdbc.update("""
                UPDATE bookings SET booking_status = :to, updated_at = now() WHERE id = :id AND booking_status = :from""",
                Map.of("to", to.name(), "id", bookingId, "from", from.name()));
        if (updated == 0) throw ApiException.conflict("This booking was just updated. Please refresh and try again.");
        recordHistory(bookingId, from.name(), to, actor, reason);
    }

    private void recordHistory(UUID bookingId, String from, BookingStatus to, UUID actor, String reason) {
        jdbc.update("""
                INSERT INTO booking_status_history (booking_id, from_status, to_status, transition_reason, changed_by_user_id)
                VALUES (:bid, :from, :to, :reason, :actor)""",
                new MapSqlParameterSource().addValue("bid", bookingId).addValue("from", from).addValue("to", to.name())
                        .addValue("reason", reason).addValue("actor", actor));
    }

    private void recordCancellation(UUID bookingId, UUID actor, String reason) {
        jdbc.update("""
                INSERT INTO booking_cancellations (booking_id, cancelled_by_user_id, cancellation_reason)
                VALUES (:bid, :uid, :reason) ON CONFLICT (booking_id) DO NOTHING""",
                Map.of("bid", bookingId, "uid", actor, "reason", reason));
    }

    private void notifyCustomer(Map<String, Object> b, String type, String title, String message) {
        notifications.notify((UUID) b.get("customer_id"), type, title, message, "/bookings/" + b.get("id"));
    }

    private void notifyProvider(Map<String, Object> b, String type, String title, String message) {
        UUID providerUser = jdbc.queryForObject("SELECT user_id FROM provider_profiles WHERE id = :id",
                Map.of("id", b.get("provider_id")), UUID.class);
        notifications.notify(providerUser, type, title, message, "/provider/bookings/" + b.get("id"));
    }

    private static BookingStatus status(Map<String, Object> b) {
        return BookingStatus.valueOf((String) b.get("booking_status"));
    }

    private static LocalDate date(Map<String, Object> b) {
        Object d = b.get("event_date");
        return d instanceof java.sql.Date sd ? sd.toLocalDate() : (LocalDate) d;
    }

    private static ApiException invalidTransition(BookingStatus current, String action) {
        return ApiException.conflict("You cannot " + action + " a booking that is " + current.name().toLowerCase().replace('_', ' ') + ".");
    }

    private static String timeSlot(LocalTime t) {
        if (t.isBefore(LocalTime.of(11, 0))) return "MORNING";
        if (t.isBefore(LocalTime.of(16, 0))) return "AFTERNOON";
        return "EVENING";
    }

    private static String newReference() {
        StringBuilder sb = new StringBuilder("BMC-");
        sb.append(LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"))).append('-');
        for (int i = 0; i < 5; i++) sb.append(REF_ALPHABET.charAt(RANDOM.nextInt(REF_ALPHABET.length())));
        return sb.toString();
    }

    private String toJson(Map<String, Object> m) {
        try {
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    private Map<String, Object> fromJson(String json) {
        if (json == null) return Map.of();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {
            });
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private static BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static String suffix(String reason) {
        return reason == null || reason.isBlank() ? "." : ": " + reason.trim();
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
