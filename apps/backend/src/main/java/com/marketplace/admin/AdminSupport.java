package com.marketplace.admin;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.common.ApiException;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Admin role checks, paging and audit logging shared by all admin controllers. */
@Component
@RequiredArgsConstructor
public class AdminSupport {

    public static final Set<String> ANY = Set.of("SUPER_ADMIN", "OPS_ADMIN", "VERIFICATION_ADMIN", "FINANCE_ADMIN");
    public static final Set<String> OPS = Set.of("SUPER_ADMIN", "OPS_ADMIN");
    public static final Set<String> SUPER = Set.of("SUPER_ADMIN");

    private final NamedParameterJdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    /** Requires an ACTIVE admin_users row with one of the allowed roles. */
    public void require(AuthenticatedUserPrincipal u, Set<String> allowed) {
        List<String> roles = jdbc.queryForList(
                "SELECT admin_role FROM admin_users WHERE user_id = :uid AND status = 'ACTIVE'", Map.of("uid", u.getUserId()), String.class);
        if (roles.isEmpty() || !allowed.contains(roles.get(0))) throw ApiException.forbidden();
    }

    /** Runs a query that selects COUNT(*) OVER () AS "_total" and uses :lim/:off. */
    public PageResponse<Map<String, Object>> page(String sql, MapSqlParameterSource p, int page, int size) {
        int s = Math.min(Math.max(size, 1), 100);
        int pg = Math.max(page, 0);
        p.addValue("lim", s).addValue("off", pg * s);
        List<Map<String, Object>> items = jdbc.queryForList(sql, p);
        long total = items.isEmpty() ? 0 : ((Number) items.get(0).get("_total")).longValue();
        items.forEach(m -> m.remove("_total"));
        return new PageResponse<>(items, pg, s, total);
    }

    public void audit(AuthenticatedUserPrincipal u, String action, String entityType, UUID entityId,
                      Map<String, ?> before, Map<String, ?> after, HttpServletRequest req) {
        String forwarded = req.getHeader("X-Forwarded-For");
        String ip = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
        jdbc.update("""
                INSERT INTO admin_audit_logs (admin_user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
                VALUES (:admin, :action, :type, :eid, CAST(:before AS jsonb), CAST(:after AS jsonb), :ip)""",
                new MapSqlParameterSource().addValue("admin", u.getUserId()).addValue("action", action)
                        .addValue("type", entityType).addValue("eid", entityId)
                        .addValue("before", json(before)).addValue("after", json(after))
                        .addValue("ip", ip.length() > 45 ? ip.substring(0, 45) : ip));
    }

    private String json(Map<String, ?> m) {
        if (m == null) return null;
        try {
            return objectMapper.writeValueAsString(m);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
