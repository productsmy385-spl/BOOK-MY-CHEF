package com.marketplace.notification;

import com.marketplace.common.ApiResponse;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notifications;

    @GetMapping
    public ApiResponse<PageResponse<Map<String, Object>>> list(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(notifications.list(u.getUserId(), page, size));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> unread(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(Map.of("count", notifications.unreadCount(u.getUserId())));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Void> read(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        notifications.markRead(u.getUserId(), id);
        return ApiResponse.ok(null, "Marked as read");
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> readAll(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        notifications.markAllRead(u.getUserId());
        return ApiResponse.ok(null, "All marked as read");
    }
}
