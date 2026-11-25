package com.marketplace.promotion;

import com.marketplace.catalog.ServiceCatalog;
import com.marketplace.common.ApiException;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.media.MediaService;
import com.marketplace.notification.NotificationService;
import com.marketplace.provider.ProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Platform campaigns, provider promotional banners and their analytics.
 *
 * Visibility rules (enforced in SQL on every public read):
 *  - platform banner: PUBLISHED and inside its start/end window;
 *  - provider banner: APPROVED, inside its window, and the provider is publicly listed.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BannerService {

    public static final Set<String> PLACEMENTS = Set.of("HOME", "SIGN_IN", "REGISTER", "EXPLORE", "CATEGORY",
            "PROVIDER_HOME", "PROVIDER_SIGN_IN", "PROVIDER_REGISTER");
    private static final Set<String> PLATFORM_ASSETS = Set.of("PLATFORM_BANNER", "CAMPAIGN_ASSET");
    private static final Set<String> PROVIDER_ASSETS = Set.of("PROVIDER_BANNER");
    private static final String PLATFORM_LIVE = "b.status = 'PUBLISHED' AND (b.start_at IS NULL OR b.start_at <= now()) AND (b.end_at IS NULL OR b.end_at > now())";
    private static final String PROVIDER_LIVE = """
            pb.status = 'APPROVED' AND (pb.start_at IS NULL OR pb.start_at <= now()) AND (pb.end_at IS NULL OR pb.end_at > now())
            AND pp.onboarding_status = 'PUBLISHED' AND pp.verification_status IN ('PENDING', 'VERIFIED')
            AND EXISTS (SELECT 1 FROM users u WHERE u.id = pp.user_id AND u.account_status = 'ACTIVE')""";

    private final NamedParameterJdbcTemplate jdbc;
    private final MediaService media;
    private final ProviderRepository providers;
    private final NotificationService notifications;

    // ===================================================================== platform campaigns

    private static final String PLATFORM_SELECT = """
            SELECT b.id, b.title, b.subtitle, b.cta_text AS "ctaText", b.destination_type AS "destinationType",
                   b.destination_ref AS "destinationRef", array_to_string(b.placements, ',') AS "placementsCsv",
                   b.category, b.status, b.priority, b.rotation_seconds AS "rotationSeconds",
                   b.start_at::text AS "startAt", b.end_at::text AS "endAt", b.published_at::text AS "publishedAt",
                   b.created_at::text AS "createdAt", b.updated_at::text AS "updatedAt",
                   b.desktop_asset_id AS "desktopAssetId", b.mobile_asset_id AS "mobileAssetId",
                   d.url AS "desktopUrl", COALESCE(m.url, d.url) AS "mobileUrl"
            FROM platform_banners b
            JOIN media_assets d ON d.id = b.desktop_asset_id
            LEFT JOIN media_assets m ON m.id = b.mobile_asset_id""";

    public record PlatformInput(String title, String subtitle, String ctaText, String destinationType, String destinationRef,
                                UUID desktopAssetId, UUID mobileAssetId, List<String> placements, String category,
                                Integer priority, Integer rotationSeconds, OffsetDateTime startAt, OffsetDateTime endAt) {
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> publicPlatform(String placement, String category) {
        if (!PLACEMENTS.contains(placement)) throw ApiException.invalid("Unknown placement.");
        MapSqlParameterSource p = new MapSqlParameterSource().addValue("pl", placement);
        String cat = "";
        if ("CATEGORY".equals(placement)) {
            if (category == null || !ServiceCatalog.isCategory(category)) return List.of();
            cat = " AND b.category = :cat";
            p.addValue("cat", category);
        }
        return jdbc.queryForList(PLATFORM_SELECT + " WHERE " + PLATFORM_LIVE + " AND :pl = ANY(b.placements)" + cat
                + " ORDER BY b.priority DESC, b.published_at DESC LIMIT 10", p).stream().map(this::publicPlatformView).toList();
    }

    private Map<String, Object> publicPlatformView(Map<String, Object> r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.get("id"));
        m.put("kind", "PLATFORM");
        m.put("title", r.get("title"));
        m.put("subtitle", r.get("subtitle"));
        m.put("ctaText", r.get("ctaText"));
        m.put("href", href((String) r.get("destinationType"), (String) r.get("destinationRef")));
        m.put("desktopUrl", r.get("desktopUrl"));
        m.put("mobileUrl", r.get("mobileUrl"));
        m.put("rotationSeconds", r.get("rotationSeconds"));
        return m;
    }

    static String href(String type, String ref) {
        if (type == null) return null;
        return switch (type) {
            case "EXPLORE" -> "/explore";
            case "CATEGORY" -> "/explore?category=" + ref;
            case "PROVIDER" -> "/p/" + ref;
            case "PATH" -> ref;
            default -> null;
        };
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> adminList(String status, int page, int size) {
        int s = Math.min(Math.max(size, 1), 50);
        int pg = Math.max(page, 0);
        MapSqlParameterSource p = new MapSqlParameterSource().addValue("lim", s).addValue("off", pg * s);
        String where = "b.status <> 'ARCHIVED'";
        if (status != null && !status.isBlank()) {
            where = "b.status = :st";
            p.addValue("st", status);
        }
        List<Map<String, Object>> items = jdbc.queryForList(PLATFORM_SELECT + " WHERE " + where
                + " ORDER BY b.status = 'PUBLISHED' DESC, b.priority DESC, b.updated_at DESC LIMIT :lim OFFSET :off", p);
        items.forEach(this::withPlacementsAndLiveness);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM platform_banners b WHERE " + where, p, Long.class);
        return new PageResponse<>(items, pg, s, total == null ? 0 : total);
    }

    private void withPlacementsAndLiveness(Map<String, Object> r) {
        String csv = (String) r.remove("placementsCsv");
        r.put("placements", csv == null || csv.isBlank() ? List.of() : List.of(csv.split(",")));
        r.put("href", href((String) r.get("destinationType"), (String) r.get("destinationRef")));
    }

    public Map<String, Object> platformById(UUID id) {
        List<Map<String, Object>> rows = jdbc.queryForList(PLATFORM_SELECT + " WHERE b.id = :id", Map.of("id", id));
        if (rows.isEmpty()) throw ApiException.notFound("Campaign");
        Map<String, Object> r = new LinkedHashMap<>(rows.get(0));
        withPlacementsAndLiveness(r);
        Boolean live = jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM platform_banners b WHERE b.id = :id AND " + PLATFORM_LIVE + ")",
                Map.of("id", id), Boolean.class);
        r.put("live", Boolean.TRUE.equals(live));
        return r;
    }

    @Transactional
    public Map<String, Object> createPlatform(AuthenticatedUserPrincipal admin, PlatformInput in) {
        validatePlatform(admin, in);
        UUID id = jdbc.queryForObject("""
                INSERT INTO platform_banners (title, subtitle, cta_text, destination_type, destination_ref, desktop_asset_id,
                    mobile_asset_id, placements, category, priority, rotation_seconds, start_at, end_at, created_by)
                VALUES (:title, :subtitle, :cta, :dt, :dr, :desk, :mob, CAST(:pl AS varchar(32)[]), :cat, :prio, :rot, :start, :end, :by)
                RETURNING id""", platformParams(in).addValue("by", admin.getUserId()), UUID.class);
        return platformById(id);
    }

    @Transactional
    public Map<String, Object> updatePlatform(AuthenticatedUserPrincipal admin, UUID id, PlatformInput in) {
        validatePlatform(admin, in);
        int n = jdbc.update("""
                UPDATE platform_banners SET title = :title, subtitle = :subtitle, cta_text = :cta, destination_type = :dt,
                    destination_ref = :dr, desktop_asset_id = :desk, mobile_asset_id = :mob, placements = CAST(:pl AS varchar(32)[]),
                    category = :cat, priority = :prio, rotation_seconds = :rot, start_at = :start, end_at = :end, updated_at = now()
                WHERE id = :id AND status <> 'ARCHIVED'""", platformParams(in).addValue("id", id));
        if (n == 0) throw ApiException.notFound("Campaign");
        return platformById(id);
    }

    @Transactional
    public Map<String, Object> setPlatformStatus(UUID id, String status) {
        Map<String, Object> current = platformById(id);
        String from = (String) current.get("status");
        if ("ARCHIVED".equals(from)) throw ApiException.conflict("Archived campaigns cannot be changed. Duplicate it instead.");
        Boolean ended = jdbc.queryForObject("SELECT end_at IS NOT NULL AND end_at <= now() FROM platform_banners WHERE id = :id",
                Map.of("id", id), Boolean.class);
        if ("PUBLISHED".equals(status) && Boolean.TRUE.equals(ended)) {
            throw ApiException.invalid("This campaign's end date has passed. Change the schedule before publishing.");
        }
        jdbc.update("""
                UPDATE platform_banners SET status = :s, updated_at = now(),
                    published_at = CASE WHEN :s = 'PUBLISHED' THEN now() ELSE published_at END
                WHERE id = :id""", Map.of("s", status, "id", id));
        return platformById(id);
    }

    @Transactional
    public Map<String, Object> duplicatePlatform(AuthenticatedUserPrincipal admin, UUID id) {
        platformById(id);
        UUID copy = jdbc.queryForObject("""
                INSERT INTO platform_banners (title, subtitle, cta_text, destination_type, destination_ref, desktop_asset_id,
                    mobile_asset_id, placements, category, priority, rotation_seconds, start_at, end_at, created_by)
                SELECT left('Copy of ' || title, 120), subtitle, cta_text, destination_type, destination_ref, desktop_asset_id,
                    mobile_asset_id, placements, category, priority, rotation_seconds, NULL, NULL, :by
                FROM platform_banners WHERE id = :id RETURNING id""", Map.of("id", id, "by", admin.getUserId()), UUID.class);
        return platformById(copy);
    }

    /** Changes display order (higher priority shows first). */
    @Transactional
    public Map<String, Object> setPriority(UUID id, int priority) {
        if (jdbc.update("UPDATE platform_banners SET priority = :p, updated_at = now() WHERE id = :id",
                Map.of("p", Math.max(-100, Math.min(100, priority)), "id", id)) == 0) throw ApiException.notFound("Campaign");
        return platformById(id);
    }

    /** Deletes a draft or archived campaign (published ones must be unpublished or archived first). */
    @Transactional
    public void deletePlatformDraft(UUID id) {
        Map<String, Object> b = platformById(id);
        if ("PUBLISHED".equals(b.get("status"))) throw ApiException.conflict("Unpublish or archive this campaign before deleting it.");
        jdbc.update("DELETE FROM banner_events WHERE banner_kind = 'PLATFORM' AND banner_id = :id", Map.of("id", id));
        jdbc.update("DELETE FROM platform_banners WHERE id = :id", Map.of("id", id));
    }

    private void validatePlatform(AuthenticatedUserPrincipal admin, PlatformInput in) {
        if (in.placements() == null || in.placements().isEmpty() || !PLACEMENTS.containsAll(in.placements())) {
            throw ApiException.invalid("Choose at least one valid placement.");
        }
        if (in.placements().contains("CATEGORY") && !ServiceCatalog.isCategory(in.category())) {
            throw ApiException.invalid("Choose the service category this campaign belongs to.");
        }
        if (in.startAt() != null && in.endAt() != null && !in.endAt().isAfter(in.startAt())) {
            throw ApiException.invalid("End date must be after the start date.");
        }
        validateDestination(in.destinationType(), in.destinationRef());
        if (in.ctaText() != null && !in.ctaText().isBlank() && "NONE".equals(in.destinationType())) {
            throw ApiException.invalid("A button needs a destination.");
        }
        media.requireUsable(admin, in.desktopAssetId(), PLATFORM_ASSETS);
        if (in.mobileAssetId() != null) media.requireUsable(admin, in.mobileAssetId(), PLATFORM_ASSETS);
    }

    private void validateDestination(String type, String ref) {
        switch (type == null ? "" : type) {
            case "NONE", "EXPLORE" -> { }
            case "CATEGORY" -> {
                if (!ServiceCatalog.isCategory(ref)) throw ApiException.invalid("Choose a valid category for the button.");
            }
            case "PROVIDER" -> {
                try {
                    if (!providers.isPubliclyListed(UUID.fromString(ref))) throw ApiException.invalid("That provider is not publicly listed.");
                } catch (IllegalArgumentException | NullPointerException e) {
                    throw ApiException.invalid("Choose a provider for the button.");
                }
            }
            case "PATH" -> {
                if (ref == null || !ref.matches("^/(?!/)[A-Za-z0-9/_.\\-?=&%]{0,200}$")) {
                    throw ApiException.invalid("The link must be a page on this site, starting with “/”.");
                }
            }
            default -> throw ApiException.invalid("Unknown destination.");
        }
    }

    private MapSqlParameterSource platformParams(PlatformInput in) {
        return new MapSqlParameterSource()
                .addValue("title", in.title().trim()).addValue("subtitle", blank(in.subtitle())).addValue("cta", blank(in.ctaText()))
                .addValue("dt", in.destinationType()).addValue("dr", "NONE".equals(in.destinationType()) || "EXPLORE".equals(in.destinationType()) ? null : in.destinationRef())
                .addValue("desk", in.desktopAssetId()).addValue("mob", in.mobileAssetId())
                .addValue("pl", "{" + String.join(",", new LinkedHashSet<>(in.placements())) + "}")
                .addValue("cat", in.placements().contains("CATEGORY") ? in.category() : null)
                .addValue("prio", in.priority() == null ? 0 : in.priority())
                .addValue("rot", in.rotationSeconds() == null ? 6 : in.rotationSeconds())
                .addValue("start", in.startAt()).addValue("end", in.endAt());
    }

    // ===================================================================== provider banners

    private static final String PROVIDER_SELECT = """
            SELECT pb.id, pb.provider_id AS "providerId", pp.professional_name AS "providerName", pp.business_name AS "businessName",
                   pp.avatar_url AS "providerAvatarUrl", pb.title, pb.description, pb.offer_text AS "offerText", pb.category,
                   pb.cta_text AS "ctaText", pb.service_id AS "serviceId", pb.status, pb.review_note AS "reviewNote",
                   pb.reviewed_at::text AS "reviewedAt", pb.submitted_at::text AS "submittedAt",
                   pb.start_at::text AS "startAt", pb.end_at::text AS "endAt", pb.created_at::text AS "createdAt",
                   pb.updated_at::text AS "updatedAt", pb.desktop_asset_id AS "desktopAssetId", pb.mobile_asset_id AS "mobileAssetId",
                   d.url AS "desktopUrl", COALESCE(m.url, d.url) AS "mobileUrl"
            FROM provider_banners pb
            JOIN provider_profiles pp ON pp.id = pb.provider_id
            JOIN media_assets d ON d.id = pb.desktop_asset_id
            LEFT JOIN media_assets m ON m.id = pb.mobile_asset_id""";

    public record ProviderInput(String title, String description, String offerText, String category, String ctaText,
                                UUID serviceId, UUID desktopAssetId, UUID mobileAssetId,
                                OffsetDateTime startAt, OffsetDateTime endAt) {
    }

    /** Approved, live provider banners for customer discovery (optionally one provider's). */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> publicProvider(UUID providerId, String category, int limit) {
        MapSqlParameterSource p = new MapSqlParameterSource().addValue("lim", Math.min(Math.max(limit, 1), 24));
        StringBuilder where = new StringBuilder(PROVIDER_LIVE);
        if (providerId != null) {
            where.append(" AND pb.provider_id = :pid");
            p.addValue("pid", providerId);
        }
        if (category != null && !category.isBlank()) {
            where.append(" AND pb.category = :cat");
            p.addValue("cat", category);
        }
        return jdbc.queryForList(PROVIDER_SELECT + " WHERE " + where + " ORDER BY pb.reviewed_at DESC LIMIT :lim", p).stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            for (String k : List.of("id", "providerId", "providerName", "businessName", "title", "description", "offerText",
                    "category", "ctaText", "desktopUrl", "mobileUrl")) m.put(k, r.get(k));
            m.put("kind", "PROVIDER");
            m.put("href", "/p/" + r.get("providerId"));
            return m;
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> mine(UUID userId) {
        UUID pid = providers.requireIdByUserId(userId);
        List<Map<String, Object>> rows = jdbc.queryForList(PROVIDER_SELECT + " WHERE pb.provider_id = :pid AND pb.status <> 'ARCHIVED' ORDER BY pb.updated_at DESC",
                Map.of("pid", pid));
        rows.forEach(r -> r.putAll(stats("PROVIDER", (UUID) r.get("id"))));
        return rows;
    }

    private Map<String, Object> providerBanner(UUID id) {
        List<Map<String, Object>> rows = jdbc.queryForList(PROVIDER_SELECT + " WHERE pb.id = :id", Map.of("id", id));
        if (rows.isEmpty()) throw ApiException.notFound("Banner");
        Map<String, Object> r = new LinkedHashMap<>(rows.get(0));
        r.putAll(stats("PROVIDER", id));
        return r;
    }

    /** Loads a banner and locks it, ensuring it belongs to the calling provider. */
    private Map<String, Object> ownBanner(UUID userId, UUID bannerId) {
        UUID pid = providers.requireIdByUserId(userId);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, status, end_at FROM provider_banners WHERE id = :id AND provider_id = :pid FOR UPDATE",
                Map.of("id", bannerId, "pid", pid));
        if (rows.isEmpty()) throw ApiException.notFound("Banner");
        return rows.get(0);
    }

    @Transactional
    public Map<String, Object> createProvider(AuthenticatedUserPrincipal u, ProviderInput in) {
        UUID pid = providers.requireIdByUserId(u.getUserId());
        validateProvider(u, pid, in);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM provider_banners WHERE provider_id = :pid AND status <> 'ARCHIVED'",
                Map.of("pid", pid), Integer.class);
        if (count != null && count >= 10) throw ApiException.invalid("You can keep up to 10 banners. Remove one first.");
        UUID id = jdbc.queryForObject("""
                INSERT INTO provider_banners (provider_id, title, description, offer_text, category, cta_text, service_id,
                    desktop_asset_id, mobile_asset_id, start_at, end_at)
                VALUES (:pid, :title, :desc, :offer, :cat, :cta, :svc, :desk, :mob, :start, :end) RETURNING id""",
                providerParams(in).addValue("pid", pid), UUID.class);
        return providerBanner(id);
    }

    /** Editing an approved or paused banner sends it back to DRAFT; it must be re-approved. */
    @Transactional
    public Map<String, Object> updateProvider(AuthenticatedUserPrincipal u, UUID id, ProviderInput in) {
        Map<String, Object> b = ownBanner(u.getUserId(), id);
        String st = (String) b.get("status");
        if (Set.of("PENDING_APPROVAL", "ARCHIVED").contains(st)) {
            throw ApiException.conflict("PENDING_APPROVAL".equals(st) ? "This banner is under review. Wait for the decision before editing." : "Archived banners cannot be edited.");
        }
        validateProvider(u, providers.requireIdByUserId(u.getUserId()), in);
        jdbc.update("""
                UPDATE provider_banners SET title = :title, description = :desc, offer_text = :offer, category = :cat,
                    cta_text = :cta, service_id = :svc, desktop_asset_id = :desk, mobile_asset_id = :mob,
                    start_at = :start, end_at = :end, updated_at = now(),
                    status = CASE WHEN status IN ('APPROVED', 'PAUSED', 'EXPIRED') THEN 'DRAFT' ELSE status END
                WHERE id = :id""", providerParams(in).addValue("id", id));
        return providerBanner(id);
    }

    @Transactional
    public Map<String, Object> submit(UUID userId, UUID id) {
        Map<String, Object> b = ownBanner(userId, id);
        String st = (String) b.get("status");
        if (!Set.of("DRAFT", "REJECTED", "CHANGES_REQUESTED").contains(st)) {
            throw ApiException.conflict("Only drafts and banners needing changes can be submitted.");
        }
        jdbc.update("UPDATE provider_banners SET status = 'PENDING_APPROVAL', submitted_at = now(), updated_at = now() WHERE id = :id",
                Map.of("id", id));
        return providerBanner(id);
    }

    @Transactional
    public Map<String, Object> providerPause(UUID userId, UUID id, boolean pause) {
        Map<String, Object> b = ownBanner(userId, id);
        String st = (String) b.get("status");
        if (pause && !"APPROVED".equals(st)) throw ApiException.conflict("Only live banners can be paused.");
        if (!pause && !"PAUSED".equals(st)) throw ApiException.conflict("Only paused banners can be resumed.");
        jdbc.update("UPDATE provider_banners SET status = :s, updated_at = now() WHERE id = :id",
                Map.of("s", pause ? "PAUSED" : "APPROVED", "id", id));
        return providerBanner(id);
    }

    @Transactional
    public void providerDelete(UUID userId, UUID id) {
        ownBanner(userId, id);
        Boolean hasEvents = jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM banner_events WHERE banner_kind = 'PROVIDER' AND banner_id = :id)",
                Map.of("id", id), Boolean.class);
        if (Boolean.TRUE.equals(hasEvents)) {
            jdbc.update("UPDATE provider_banners SET status = 'ARCHIVED', updated_at = now() WHERE id = :id", Map.of("id", id));
        } else {
            jdbc.update("DELETE FROM provider_banners WHERE id = :id", Map.of("id", id));
        }
    }

    private void validateProvider(AuthenticatedUserPrincipal u, UUID pid, ProviderInput in) {
        if (in.category() != null && !in.category().isBlank()) {
            Boolean offers = jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM provider_roles WHERE provider_id = :pid AND role_type = :c AND is_active)",
                    Map.of("pid", pid, "c", in.category()), Boolean.class);
            if (!Boolean.TRUE.equals(offers)) throw ApiException.invalid("Choose one of the services you offer.");
        }
        if (in.serviceId() != null) {
            Boolean own = jdbc.queryForObject("SELECT EXISTS (SELECT 1 FROM services WHERE id = :s AND provider_id = :pid)",
                    Map.of("s", in.serviceId(), "pid", pid), Boolean.class);
            if (!Boolean.TRUE.equals(own)) throw ApiException.invalid("That service is not yours.");
        }
        if (in.startAt() != null && in.endAt() != null && !in.endAt().isAfter(in.startAt())) {
            throw ApiException.invalid("End date must be after the start date.");
        }
        media.requireUsable(u, in.desktopAssetId(), PROVIDER_ASSETS);
        if (in.mobileAssetId() != null) media.requireUsable(u, in.mobileAssetId(), PROVIDER_ASSETS);
    }

    private MapSqlParameterSource providerParams(ProviderInput in) {
        return new MapSqlParameterSource()
                .addValue("title", in.title().trim()).addValue("desc", blank(in.description())).addValue("offer", blank(in.offerText()))
                .addValue("cat", blank(in.category())).addValue("cta", blank(in.ctaText())).addValue("svc", in.serviceId())
                .addValue("desk", in.desktopAssetId()).addValue("mob", in.mobileAssetId())
                .addValue("start", in.startAt()).addValue("end", in.endAt());
    }

    // ---- admin review

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> reviewQueue(String status, int page, int size) {
        int s = Math.min(Math.max(size, 1), 50);
        int pg = Math.max(page, 0);
        MapSqlParameterSource p = new MapSqlParameterSource().addValue("lim", s).addValue("off", pg * s)
                .addValue("st", status == null || status.isBlank() ? "PENDING_APPROVAL" : status);
        List<Map<String, Object>> items = jdbc.queryForList(PROVIDER_SELECT + " WHERE pb.status = :st ORDER BY pb.submitted_at NULLS LAST, pb.updated_at DESC LIMIT :lim OFFSET :off", p);
        items.forEach(r -> r.putAll(stats("PROVIDER", (UUID) r.get("id"))));
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM provider_banners pb WHERE pb.status = :st", p, Long.class);
        return new PageResponse<>(items, pg, s, total == null ? 0 : total);
    }

    /** decision: APPROVE | REJECT | REQUEST_CHANGES | PAUSE | ARCHIVE */
    @Transactional
    public Map<String, Object> review(AuthenticatedUserPrincipal admin, UUID id, String decision, String note) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT pb.status, pb.title, pp.user_id FROM provider_banners pb JOIN provider_profiles pp ON pp.id = pb.provider_id
                WHERE pb.id = :id FOR UPDATE OF pb""", Map.of("id", id));
        if (rows.isEmpty()) throw ApiException.notFound("Banner");
        String st = (String) rows.get(0).get("status");
        String next = switch (decision) {
            case "APPROVE" -> {
                if (!"PENDING_APPROVAL".equals(st)) throw ApiException.conflict("Only banners awaiting approval can be approved.");
                yield "APPROVED";
            }
            case "REJECT" -> {
                if (!"PENDING_APPROVAL".equals(st)) throw ApiException.conflict("Only banners awaiting approval can be rejected.");
                yield "REJECTED";
            }
            case "REQUEST_CHANGES" -> {
                if (!Set.of("PENDING_APPROVAL", "APPROVED", "PAUSED").contains(st)) throw ApiException.conflict("Changes cannot be requested now.");
                yield "CHANGES_REQUESTED";
            }
            case "PAUSE" -> {
                if (!"APPROVED".equals(st)) throw ApiException.conflict("Only live banners can be paused.");
                yield "PAUSED";
            }
            case "ARCHIVE" -> "ARCHIVED";
            default -> throw ApiException.invalid("Unknown decision.");
        };
        if (Set.of("REJECT", "REQUEST_CHANGES").contains(decision) && (note == null || note.isBlank())) {
            throw ApiException.invalid("Add a note so the provider knows what to change.");
        }
        jdbc.update("""
                UPDATE provider_banners SET status = :s, review_note = :note, reviewed_by = :by, reviewed_at = now(), updated_at = now()
                WHERE id = :id""", new MapSqlParameterSource().addValue("s", next).addValue("note", blank(note))
                .addValue("by", admin.getUserId()).addValue("id", id));
        String title = (String) rows.get(0).get("title");
        String msg = switch (next) {
            case "APPROVED" -> "Your banner “" + title + "” is approved and now visible to customers.";
            case "REJECTED" -> "Your banner “" + title + "” was not approved: " + note;
            case "CHANGES_REQUESTED" -> "Changes requested for “" + title + "”: " + note;
            case "PAUSED" -> "Your banner “" + title + "” was paused by Book My Chef" + (note == null || note.isBlank() ? "." : ": " + note);
            default -> "Your banner “" + title + "” was archived by Book My Chef.";
        };
        notifications.notify((UUID) rows.get(0).get("user_id"), "BANNER_" + next, "Promotion update", msg, "/provider/promotions");
        return providerBanner(id);
    }

    /** Approved/paused banners past their end date become EXPIRED. */
    @Scheduled(fixedDelay = 30 * 60 * 1000, initialDelay = 90 * 1000)
    @Transactional
    public void expire() {
        int n = jdbc.update("UPDATE provider_banners SET status = 'EXPIRED', updated_at = now() WHERE status IN ('APPROVED', 'PAUSED') AND end_at <= now()",
                Map.of());
        if (n > 0) log.info("Expired {} provider banners", n);
    }

    // ===================================================================== analytics

    /** Records one impression/click; duplicates per visitor per banner per day are ignored. */
    @Transactional
    public boolean recordEvent(String kind, UUID bannerId, String type, String placement, String visitorId, String clientIp, String userAgent) {
        if (!Set.of("PLATFORM", "PROVIDER").contains(kind) || !Set.of("IMPRESSION", "CLICK").contains(type)) {
            throw ApiException.invalid("Unknown event.");
        }
        String liveSql = "PLATFORM".equals(kind)
                ? "SELECT EXISTS (SELECT 1 FROM platform_banners b WHERE b.id = :id AND " + PLATFORM_LIVE + ")"
                : "SELECT EXISTS (SELECT 1 FROM provider_banners pb JOIN provider_profiles pp ON pp.id = pb.provider_id WHERE pb.id = :id AND " + PROVIDER_LIVE + ")";
        Boolean live = jdbc.queryForObject(liveSql, Map.of("id", bannerId), Boolean.class);
        if (!Boolean.TRUE.equals(live)) return false; // only live banners are counted
        String identity = visitorId != null && visitorId.matches("^[A-Za-z0-9-]{8,64}$") ? "v:" + visitorId : "ip:" + clientIp + "|" + userAgent;
        int n = jdbc.update("""
                INSERT INTO banner_events (banner_kind, banner_id, event_type, placement, visitor_key)
                VALUES (:k, :id, :t, :pl, :vk) ON CONFLICT DO NOTHING""",
                new MapSqlParameterSource().addValue("k", kind).addValue("id", bannerId).addValue("t", type)
                        .addValue("pl", placement != null && placement.length() <= 32 ? placement : null)
                        .addValue("vk", sha256(identity)));
        return n > 0;
    }

    private Map<String, Object> stats(String kind, UUID id) {
        Map<String, Object> m = new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT COUNT(*) FILTER (WHERE event_type = 'IMPRESSION') AS "impressions",
                       COUNT(*) FILTER (WHERE event_type = 'CLICK') AS "clicks"
                FROM banner_events WHERE banner_kind = :k AND banner_id = :id""", Map.of("k", kind, "id", id)));
        long imp = ((Number) m.get("impressions")).longValue();
        long clk = ((Number) m.get("clicks")).longValue();
        m.put("ctr", imp == 0 ? null : Math.round(clk * 1000.0 / imp) / 10.0);
        return m;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> analytics(int days) {
        int d = Math.min(Math.max(days, 1), 365);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("days", d);
        out.put("campaigns", jdbc.queryForList("""
                SELECT b.id, b.title, b.status,
                       COUNT(e.id) FILTER (WHERE e.event_type = 'IMPRESSION') AS "impressions",
                       COUNT(e.id) FILTER (WHERE e.event_type = 'CLICK') AS "clicks"
                FROM platform_banners b
                LEFT JOIN banner_events e ON e.banner_kind = 'PLATFORM' AND e.banner_id = b.id AND e.event_day > CURRENT_DATE - :d
                WHERE b.status <> 'DRAFT' GROUP BY b.id ORDER BY "impressions" DESC, b.title""", Map.of("d", d)));
        out.put("providerPromotions", jdbc.queryForList("""
                SELECT pb.id, pb.title, pb.status, pp.professional_name AS "providerName",
                       COUNT(e.id) FILTER (WHERE e.event_type = 'IMPRESSION') AS "impressions",
                       COUNT(e.id) FILTER (WHERE e.event_type = 'CLICK') AS "clicks"
                FROM provider_banners pb JOIN provider_profiles pp ON pp.id = pb.provider_id
                LEFT JOIN banner_events e ON e.banner_kind = 'PROVIDER' AND e.banner_id = pb.id AND e.event_day > CURRENT_DATE - :d
                WHERE pb.status IN ('APPROVED', 'PAUSED', 'EXPIRED', 'ARCHIVED') GROUP BY pb.id, pp.professional_name
                ORDER BY "impressions" DESC, pb.title""", Map.of("d", d)));
        out.put("placements", jdbc.queryForList("""
                SELECT COALESCE(placement, 'UNKNOWN') AS "placement",
                       COUNT(*) FILTER (WHERE event_type = 'IMPRESSION') AS "impressions",
                       COUNT(*) FILTER (WHERE event_type = 'CLICK') AS "clicks"
                FROM banner_events WHERE event_day > CURRENT_DATE - :d GROUP BY 1 ORDER BY 2 DESC""", Map.of("d", d)));
        return out;
    }

    // ===================================================================== helpers

    static String sha256(String s) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
