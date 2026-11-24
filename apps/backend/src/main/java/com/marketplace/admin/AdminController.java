package com.marketplace.admin;

import com.marketplace.booking.BookingService;
import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import com.marketplace.common.PageResponse;
import com.marketplace.common.SettingsService;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.identity.ClerkBackendClient;
import com.marketplace.notification.NotificationService;
import com.marketplace.provider.ProviderRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.*;

/**
 * Platform administration. Requires ROLE_ADMIN (SecurityConfig) plus an ACTIVE
 * admin_users row; individual operations are further limited by admin role.
 * Every state-changing action is written to admin_audit_logs.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Administration")
public class AdminController {

    private static final Set<String> ANY = Set.of("SUPER_ADMIN", "OPS_ADMIN", "VERIFICATION_ADMIN", "FINANCE_ADMIN");
    private static final Set<String> VERIFY = Set.of("SUPER_ADMIN", "OPS_ADMIN", "VERIFICATION_ADMIN");
    private static final Set<String> OPS = Set.of("SUPER_ADMIN", "OPS_ADMIN");
    private static final Set<String> FINANCE = Set.of("SUPER_ADMIN", "FINANCE_ADMIN");
    private static final Set<String> SUPER = Set.of("SUPER_ADMIN");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final NamedParameterJdbcTemplate jdbc;
    private final ProviderRepository providers;
    private final BookingService bookings;
    private final SettingsService settings;
    private final NotificationService notifications;
    private final ClerkBackendClient clerk;
    private final AdminSupport support;

    @Value("${app.public-web-url:http://localhost:5173}")
    private String publicWebUrl;

    // ================================================================= dashboard

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        require(u, ANY);
        Map<String, Object> m = new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT
                  (SELECT COUNT(*) FROM users WHERE user_type = 'CUSTOMER' AND account_status <> 'DELETED') AS "customers",
                  (SELECT COUNT(*) FROM users WHERE user_type = 'PROVIDER' AND account_status <> 'DELETED') AS "providers",
                  (SELECT COUNT(*) FROM provider_profiles WHERE verification_status = 'VERIFIED') AS "verifiedProviders",
                  (SELECT COUNT(*) FROM provider_profiles WHERE onboarding_status = 'PUBLISHED') AS "publishedProviders",
                  (SELECT COUNT(*) FROM provider_profiles p WHERE verification_status = 'PENDING'
                     AND (onboarding_status = 'PUBLISHED' OR EXISTS (SELECT 1 FROM provider_documents d WHERE d.provider_id = p.id))) AS "pendingVerifications",
                  (SELECT COUNT(*) FROM bookings) AS "totalBookings",
                  (SELECT COUNT(*) FROM bookings WHERE booking_status IN ('PENDING_PROVIDER_CONFIRMATION','QUOTATION_SENT','PENDING_PAYMENT','CONFIRMED','IN_PROGRESS')) AS "activeBookings",
                  (SELECT COUNT(*) FROM bookings WHERE booking_status = 'COMPLETED') AS "completedBookings",
                  (SELECT COUNT(*) FROM bookings WHERE booking_status IN ('CUSTOMER_CANCELLED','PROVIDER_CANCELLED')) AS "cancelledBookings",
                  (SELECT COALESCE(SUM(COALESCE(final_amount, estimated_total)), 0) FROM bookings WHERE booking_status = 'COMPLETED') AS "completedBookingValue",
                  (SELECT COUNT(*) FROM disputes WHERE dispute_status IN ('OPEN','UNDER_INVESTIGATION')) AS "openDisputes"
                """, Map.of()));
        java.math.BigDecimal rate = settings.getDecimal(SettingsService.COMMISSION_RATE, java.math.BigDecimal.TEN);
        m.put("commissionRate", rate);
        m.put("estimatedCommission", ((java.math.BigDecimal) m.get("completedBookingValue"))
                .multiply(rate).movePointLeft(2).setScale(2, java.math.RoundingMode.HALF_UP));
        return ApiResponse.ok(m);
    }

    // ================================================================= providers

    @GetMapping("/providers")
    public ApiResponse<PageResponse<Map<String, Object>>> providers(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                    @RequestParam(required = false) String verification,
                                                                    @RequestParam(required = false) String q,
                                                                    @RequestParam(defaultValue = "0") int page,
                                                                    @RequestParam(defaultValue = "20") int size) {
        require(u, ANY);
        MapSqlParameterSource p = new MapSqlParameterSource();
        List<String> where = new ArrayList<>(List.of("TRUE"));
        if (verification != null && !verification.isBlank()) {
            where.add("pp.verification_status = :v");
            p.addValue("v", verification);
        }
        if (q != null && !q.isBlank()) {
            where.add("(pp.professional_name ILIKE :q OR pp.business_name ILIKE :q OR pp.city ILIKE :q OR u.email ILIKE :q OR u.phone ILIKE :q)");
            p.addValue("q", like(q));
        }
        return ApiResponse.ok(page("""
                SELECT pp.id, pp.user_id AS "userId", pp.professional_name AS "name", pp.business_name AS "businessName",
                       pp.city, pp.verification_status AS "verificationStatus", pp.onboarding_status AS "onboardingStatus",
                       u.account_status AS "accountStatus", u.email, u.phone, pp.created_at::text AS "createdAt",
                       (SELECT COUNT(*) FROM provider_documents d WHERE d.provider_id = pp.id) AS "documentCount",
                       (SELECT COUNT(*) FROM bookings b WHERE b.provider_id = pp.id) AS "bookingCount",
                       COUNT(*) OVER () AS "_total"
                FROM provider_profiles pp JOIN users u ON u.id = pp.user_id
                WHERE %s ORDER BY (pp.verification_status = 'PENDING') DESC, pp.created_at DESC
                LIMIT :lim OFFSET :off""".formatted(String.join(" AND ", where)), p, page, size));
    }

    @GetMapping("/providers/{id}")
    public ApiResponse<Map<String, Object>> provider(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        require(u, ANY);
        Map<String, Object> d = providers.detail(id, true);
        d.put("account", jdbc.queryForMap("""
                SELECT u.id AS "userId", u.email, u.phone, u.account_status AS "accountStatus", u.created_at::text AS "createdAt"
                FROM provider_profiles p JOIN users u ON u.id = p.user_id WHERE p.id = :id""", Map.of("id", id)));
        return ApiResponse.ok(d);
    }

    public record VerificationDecision(
            @NotBlank @Pattern(regexp = "APPROVE|REJECT|SUSPEND|REINSTATE") String decision,
            @Size(max = 1000) String note) {
    }

    @PostMapping("/providers/{id}/verification")
    @Transactional
    public ApiResponse<Map<String, Object>> verify(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                   @Valid @RequestBody VerificationDecision r, HttpServletRequest req) {
        require(u, VERIFY);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT verification_status, user_id FROM provider_profiles WHERE id = :id FOR UPDATE", Map.of("id", id));
        if (rows.isEmpty()) throw ApiException.notFound("Provider");
        String before = (String) rows.get(0).get("verification_status");
        if (("REJECT".equals(r.decision()) || "SUSPEND".equals(r.decision())) && (r.note() == null || r.note().isBlank())) {
            throw ApiException.invalid("Add a note explaining the decision; the provider will see it.");
        }
        String after = switch (r.decision()) {
            case "APPROVE", "REINSTATE" -> "VERIFIED";
            case "REJECT" -> "REJECTED";
            default -> "SUSPENDED";
        };
        jdbc.update("""
                UPDATE provider_profiles SET verification_status = :s,
                    verified_at = CASE WHEN :s = 'VERIFIED' THEN now() ELSE verified_at END,
                    onboarding_status = CASE WHEN :s IN ('REJECTED','SUSPENDED') AND onboarding_status = 'PUBLISHED' THEN 'UNPUBLISHED' ELSE onboarding_status END,
                    updated_at = now()
                WHERE id = :id""", Map.of("s", after, "id", id));
        if ("APPROVE".equals(r.decision())) {
            jdbc.update("UPDATE provider_documents SET verification_status = 'APPROVED' WHERE provider_id = :id AND verification_status = 'PENDING'",
                    Map.of("id", id));
        } else if ("REJECT".equals(r.decision())) {
            jdbc.update("UPDATE provider_documents SET verification_status = 'REJECTED' WHERE provider_id = :id AND verification_status = 'PENDING'",
                    Map.of("id", id));
        }
        audit(u, "PROVIDER_" + r.decision(), "PROVIDER_PROFILE", id, Map.of("verificationStatus", before),
                mapOf("verificationStatus", after, "note", r.note()), req);
        String message = switch (after) {
            case "VERIFIED" -> "Your profile is verified. Customers now see the Verified badge.";
            case "REJECTED" -> "Your verification was not approved: " + r.note();
            default -> "Your profile has been suspended: " + r.note();
        };
        notifications.notify((UUID) rows.get(0).get("user_id"), "VERIFICATION_" + after, "Verification update", message, "/provider/profile");
        return provider(u, id);
    }

    // ================================================================= users

    @GetMapping("/customers")
    public ApiResponse<PageResponse<Map<String, Object>>> customers(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                    @RequestParam(required = false) String q,
                                                                    @RequestParam(required = false) String status,
                                                                    @RequestParam(defaultValue = "0") int page,
                                                                    @RequestParam(defaultValue = "20") int size) {
        require(u, ANY);
        MapSqlParameterSource p = new MapSqlParameterSource();
        List<String> where = new ArrayList<>(List.of("u.user_type = 'CUSTOMER'"));
        if (status != null && !status.isBlank()) {
            where.add("u.account_status = :st");
            p.addValue("st", status);
        }
        if (q != null && !q.isBlank()) {
            where.add("(up.full_name ILIKE :q OR u.email ILIKE :q OR u.phone ILIKE :q)");
            p.addValue("q", like(q));
        }
        return ApiResponse.ok(page("""
                SELECT u.id, up.full_name AS "name", u.email, u.phone, up.city, u.account_status AS "accountStatus",
                       u.created_at::text AS "createdAt",
                       (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = u.id) AS "bookingCount",
                       (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = u.id AND b.booking_status = 'COMPLETED') AS "completedCount",
                       COUNT(*) OVER () AS "_total"
                FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id
                WHERE %s ORDER BY u.created_at DESC LIMIT :lim OFFSET :off""".formatted(String.join(" AND ", where)), p, page, size));
    }

    public record AccountStatusChange(@NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
                                      @NotBlank(message = "Give a reason") @Size(max = 1000) String reason) {
    }

    @PostMapping("/users/{id}/status")
    @Transactional
    public ApiResponse<Map<String, Object>> setStatus(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                      @Valid @RequestBody AccountStatusChange r, HttpServletRequest req) {
        require(u, OPS);
        if (id.equals(u.getUserId())) throw ApiException.invalid("You cannot change your own account status.");
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT account_status, user_type FROM users WHERE id = :id FOR UPDATE", Map.of("id", id));
        if (rows.isEmpty()) throw ApiException.notFound("User");
        if ("ADMIN".equals(rows.get(0).get("user_type"))) throw ApiException.invalid("Manage administrators from the team page.");
        String before = (String) rows.get(0).get("account_status");
        if ("DELETED".equals(before)) throw ApiException.conflict("This account was deleted by its owner.");
        jdbc.update("UPDATE users SET account_status = :s, updated_at = now() WHERE id = :id", Map.of("s", r.status(), "id", id));
        jdbc.update("""
                INSERT INTO account_status_history (user_id, previous_status, new_status, reason, changed_by_admin_id)
                VALUES (:uid, :prev, :next, :reason, :admin)""",
                Map.of("uid", id, "prev", before, "next", r.status(), "reason", r.reason(), "admin", u.getUserId()));
        audit(u, "USER_" + r.status(), "USER", id, Map.of("accountStatus", before),
                Map.of("accountStatus", r.status(), "reason", r.reason()), req);
        return ApiResponse.ok(Map.of("id", id, "accountStatus", r.status()), "Account updated");
    }

    // ================================================================= bookings & finance

    @GetMapping("/bookings")
    public ApiResponse<PageResponse<Map<String, Object>>> bookings(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                   @RequestParam(required = false) String status,
                                                                   @RequestParam(required = false) String q,
                                                                   @RequestParam(defaultValue = "0") int page,
                                                                   @RequestParam(defaultValue = "20") int size) {
        require(u, ANY);
        return ApiResponse.ok(bookings.listAll(status, q, page, size));
    }

    @GetMapping("/finance")
    public ApiResponse<Map<String, Object>> finance(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        require(u, FINANCE);
        java.math.BigDecimal rate = settings.getDecimal(SettingsService.COMMISSION_RATE, java.math.BigDecimal.TEN);
        Map<String, Object> m = new LinkedHashMap<>(jdbc.queryForMap("""
                SELECT
                  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'CAPTURED') AS "paymentsCaptured",
                  (SELECT COUNT(*) FROM payments WHERE status = 'CAPTURED') AS "paymentsCount",
                  (SELECT COALESCE(SUM(refund_amount), 0) FROM refunds) AS "refunded",
                  (SELECT COALESCE(SUM(COALESCE(final_amount, estimated_total)), 0) FROM bookings WHERE booking_status = 'COMPLETED') AS "completedBookingValue"
                """, Map.of()));
        m.put("commissionRate", rate);
        m.put("monthly", jdbc.queryForList("""
                SELECT to_char(date_trunc('month', event_date), 'YYYY-MM') AS "month",
                       COUNT(*) AS "completedBookings",
                       COALESCE(SUM(COALESCE(final_amount, estimated_total)), 0) AS "bookingValue",
                       ROUND(COALESCE(SUM(COALESCE(final_amount, estimated_total)), 0) * :rate / 100, 2) AS "commission"
                FROM bookings WHERE booking_status = 'COMPLETED' AND event_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
                GROUP BY 1 ORDER BY 1""", Map.of("rate", rate)));
        return ApiResponse.ok(m);
    }

    // ================================================================= admin team (invitations)

    @GetMapping("/invitations")
    public ApiResponse<Map<String, Object>> invitations(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        require(u, SUPER);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("admins", jdbc.queryForList("""
                SELECT u.id, up.full_name AS "name", u.email, a.admin_role AS "role", a.status, a.created_at::text AS "since"
                FROM admin_users a JOIN users u ON u.id = a.user_id LEFT JOIN user_profiles up ON up.user_id = u.id
                ORDER BY a.created_at""", Map.of()));
        m.put("invitations", jdbc.queryForList("""
                SELECT id, email, admin_role AS "role", status, expires_at::text AS "expiresAt", created_at::text AS "createdAt"
                FROM admin_invitations ORDER BY created_at DESC LIMIT 100""", Map.of()));
        m.put("emailDelivery", clerk.isConfigured());
        return ApiResponse.ok(m);
    }

    public record Invite(@NotBlank @Email(message = "Enter a valid email") String email,
                         @NotBlank @Pattern(regexp = "SUPER_ADMIN|OPS_ADMIN|VERIFICATION_ADMIN|FINANCE_ADMIN") String role) {
    }

    @PostMapping("/invitations")
    @Transactional
    public ApiResponse<Map<String, Object>> invite(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                   @Valid @RequestBody Invite r, HttpServletRequest req) {
        require(u, SUPER);
        String email = r.email().trim().toLowerCase(Locale.ROOT);
        Boolean isAdmin = jdbc.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM users WHERE lower(email) = :e AND user_type = 'ADMIN')""", Map.of("e", email), Boolean.class);
        if (Boolean.TRUE.equals(isAdmin)) throw ApiException.conflict("This person is already an administrator.");
        byte[] token = new byte[24];
        RANDOM.nextBytes(token);
        UUID id = jdbc.queryForObject("""
                INSERT INTO admin_invitations (email, admin_role, token, invited_by, status, expires_at)
                VALUES (:e, :role, :token, :by, 'PENDING', now() + INTERVAL '7 days')
                ON CONFLICT (email) DO UPDATE SET admin_role = EXCLUDED.admin_role, token = EXCLUDED.token,
                    invited_by = EXCLUDED.invited_by, status = 'PENDING', expires_at = EXCLUDED.expires_at, created_at = now()
                RETURNING id""",
                Map.of("e", email, "role", r.role(), "token", HexFormat.of().formatHex(token), "by", u.getUserId()), UUID.class);
        boolean emailSent = false;
        String deliveryNote;
        if (clerk.isConfigured()) {
            try {
                clerk.createInvitation(email, publicWebUrl + "/admin/login");
                emailSent = true;
                deliveryNote = "Invitation email sent.";
            } catch (ApiException e) {
                // The invitation itself is valid; only the email failed. Tell the admin honestly.
                deliveryNote = "Invitation saved, but the email could not be sent. Ask them to sign up at "
                        + publicWebUrl + "/admin/login with this email.";
            }
        } else {
            deliveryNote = "Email delivery is not configured. Ask them to sign up at " + publicWebUrl + "/admin/login with this email.";
        }
        audit(u, "ADMIN_INVITED", "ADMIN_INVITATION", id, null, Map.of("email", email, "role", r.role()), req);
        return ApiResponse.ok(Map.of("id", id, "emailSent", emailSent), deliveryNote);
    }

    @DeleteMapping("/invitations/{id}")
    @Transactional
    public ApiResponse<Void> revoke(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id, HttpServletRequest req) {
        require(u, SUPER);
        if (jdbc.update("UPDATE admin_invitations SET status = 'REVOKED' WHERE id = :id AND status = 'PENDING'", Map.of("id", id)) == 0) {
            throw ApiException.notFound("Pending invitation");
        }
        audit(u, "ADMIN_INVITATION_REVOKED", "ADMIN_INVITATION", id, null, null, req);
        return ApiResponse.ok(null, "Invitation revoked");
    }

    // ================================================================= settings & audit

    @GetMapping("/settings")
    public ApiResponse<List<Map<String, Object>>> settings(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        require(u, ANY);
        return ApiResponse.ok(settings.all());
    }

    public record SettingChange(@NotBlank @Size(max = 255) String value) {
    }

    @PutMapping("/settings/{key}")
    @Transactional
    public ApiResponse<Map<String, Object>> updateSetting(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable String key,
                                                          @Valid @RequestBody SettingChange r, HttpServletRequest req) {
        require(u, SUPER);
        String before = settings.get(key, null);
        Map<String, Object> result = settings.update(key, r.value());
        audit(u, "SETTING_CHANGED", "SYSTEM_SETTING", UUID.nameUUIDFromBytes(key.getBytes()),
                mapOf("key", key, "value", before), result, req);
        return ApiResponse.ok(result, "Setting saved");
    }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResponse<Map<String, Object>>> auditLogs(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                    @RequestParam(defaultValue = "0") int page,
                                                                    @RequestParam(defaultValue = "30") int size) {
        require(u, SUPER);
        return ApiResponse.ok(page("""
                SELECT l.id, l.action, l.entity_type AS "entityType", l.entity_id AS "entityId",
                       l.old_values::text AS "before", l.new_values::text AS "after", l.ip_address AS "ip",
                       l.performed_at::text AS "at", up.full_name AS "adminName", COUNT(*) OVER () AS "_total"
                FROM admin_audit_logs l LEFT JOIN user_profiles up ON up.user_id = l.admin_user_id
                ORDER BY l.performed_at DESC LIMIT :lim OFFSET :off""", new MapSqlParameterSource(), page, size));
    }

    // ================================================================= helpers

    private void require(AuthenticatedUserPrincipal u, Set<String> allowed) {
        support.require(u, allowed);
    }

    private PageResponse<Map<String, Object>> page(String sql, MapSqlParameterSource p, int page, int size) {
        return support.page(sql, p, page, size);
    }

    private void audit(AuthenticatedUserPrincipal u, String action, String entityType, UUID entityId,
                       Map<String, ?> before, Map<String, ?> after, HttpServletRequest req) {
        support.audit(u, action, entityType, entityId, before, after, req);
    }

    private static Map<String, Object> mapOf(String k1, Object v1, String k2, Object v2) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put(k1, v1);
        m.put(k2, v2);
        return m;
    }

    private static String like(String q) {
        return "%" + q.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }
}
