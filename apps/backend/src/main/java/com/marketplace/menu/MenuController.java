package com.marketplace.menu;

import com.marketplace.booking.BookingService;
import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * /providers/me/menu/** — the provider's own dishes and set menus (ROLE_PROVIDER, see SecurityConfig).
 * /providers/{id}/menu and /providers/{id}/estimate — public, for the profile and booking form.
 * Every write returns the provider's full, fresh menu.
 */
@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Menus")
public class MenuController {

    private final MenuService menus;
    private final BookingService bookings;

    // ------------------------------------------------------------------ provider (owner)

    @GetMapping("/me/menu")
    public ApiResponse<Map<String, Object>> mine(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        return ApiResponse.ok(menus.ownerMenu(u.getUserId()));
    }

    @PostMapping("/me/menu/items")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addItem(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                    @Valid @RequestBody MenuRequests.ItemUpsert body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menus.createItem(u.getUserId(), body), "Dish added"));
    }

    @PutMapping("/me/menu/items/{id}")
    public ApiResponse<Map<String, Object>> updateItem(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                       @Valid @RequestBody MenuRequests.ItemUpsert body) {
        return ApiResponse.ok(menus.updateItem(u.getUserId(), id, body), "Dish saved");
    }

    @DeleteMapping("/me/menu/items/{id}")
    public ApiResponse<Map<String, Object>> deleteItem(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(menus.deleteItem(u.getUserId(), id), "Dish removed");
    }

    @PostMapping("/me/menu/sets")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addSet(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                                   @Valid @RequestBody MenuRequests.SetMenuUpsert body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(menus.createSetMenu(u.getUserId(), body), "Set menu added"));
    }

    @PutMapping("/me/menu/sets/{id}")
    public ApiResponse<Map<String, Object>> updateSet(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id,
                                                      @Valid @RequestBody MenuRequests.SetMenuUpsert body) {
        return ApiResponse.ok(menus.updateSetMenu(u.getUserId(), id, body), "Set menu saved");
    }

    @DeleteMapping("/me/menu/sets/{id}")
    public ApiResponse<Map<String, Object>> deleteSet(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        return ApiResponse.ok(menus.deleteSetMenu(u.getUserId(), id), "Set menu removed");
    }

    // ------------------------------------------------------------------ public

    @GetMapping("/{id}/menu")
    @Operation(summary = "Available dishes and orderable set menus of a published provider")
    public ApiResponse<Map<String, Object>> publicMenu(@PathVariable UUID id) {
        return ApiResponse.ok(menus.publicMenu(id));
    }

    @PostMapping("/{id}/estimate")
    @Operation(summary = "Price breakdown for a service, guest count and optional menu, exactly as a booking would be priced")
    public ApiResponse<Map<String, Object>> estimate(@PathVariable UUID id, @Valid @RequestBody MenuRequests.EstimateRequest body) {
        return ApiResponse.ok(bookings.preview(id, body));
    }
}
