package com.marketplace.notification;

import com.marketplace.common.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** In-app notifications stored in the notifications table. */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NamedParameterJdbcTemplate jdbc;

    public void notify(UUID userId, String type, String title, String message, String actionUrl) {
        jdbc.update("""
                INSERT INTO notifications (user_id, notification_type, title, message, action_url)
                VALUES (:uid, :type, :title, :msg, :url)""",
                new MapSqlParameterSource().addValue("uid", userId).addValue("type", type)
                        .addValue("title", truncate(title, 150)).addValue("msg", message).addValue("url", actionUrl));
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> list(UUID userId, int page, int size) {
        int s = Math.min(Math.max(size, 1), 50);
        int p = Math.max(page, 0);
        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT id, notification_type AS "type", title, message, action_url AS "actionUrl",
                       is_read AS "read", created_at::text AS "createdAt"
                FROM notifications WHERE user_id = :uid ORDER BY created_at DESC LIMIT :lim OFFSET :off""",
                Map.of("uid", userId, "lim", s, "off", p * s));
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id = :uid", Map.of("uid", userId), Long.class);
        return new PageResponse<>(items, p, s, total == null ? 0 : total);
    }

    public long unreadCount(UUID userId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id = :uid AND NOT is_read",
                Map.of("uid", userId), Long.class);
        return n == null ? 0 : n;
    }

    @Transactional
    public void markRead(UUID userId, UUID notificationId) {
        jdbc.update("UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_id = :uid",
                Map.of("id", notificationId, "uid", userId));
    }

    @Transactional
    public void markAllRead(UUID userId) {
        jdbc.update("UPDATE notifications SET is_read = TRUE WHERE user_id = :uid AND NOT is_read", Map.of("uid", userId));
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
