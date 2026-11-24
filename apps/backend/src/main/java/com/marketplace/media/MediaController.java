package com.marketplace.media;

import com.marketplace.common.ApiResponse;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * ImageKit uploads. Flow: (1) GET upload-auth for a purpose, (2) the browser uploads
 * directly to ImageKit into the signed folder, (3) POST assets with the returned
 * fileId so the server verifies and records it.
 */
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media uploads")
public class MediaController {

    /** Legacy, unregistered uploads (documents, videos, images entered via link fields). */
    static final long LEGACY_MAX_BYTES = 10L * 1024 * 1024;
    static final List<String> LEGACY_TYPES = List.of("image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4");

    private final ImageKitClient imageKit;
    private final MediaService media;

    @GetMapping("/upload-auth")
    @Operation(summary = "Signed parameters for one direct upload to ImageKit (valid 10 minutes)")
    public ApiResponse<Map<String, Object>> uploadAuth(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                       @RequestParam(required = false) String purpose) {
        imageKit.requireConfigured();
        boolean registered = purpose != null && !purpose.isBlank();
        String folder = registered ? media.folderFor(u, purpose) : "/book-my-chef/users/" + u.getUserId();
        String token = UUID.randomUUID().toString();
        long expire = System.currentTimeMillis() / 1000 + 600;
        return ApiResponse.ok(Map.of(
                "token", token,
                "expire", expire,
                "signature", imageKit.sign(token, expire),
                "publicKey", imageKit.publicKey(),
                "urlEndpoint", imageKit.urlEndpoint(),
                "uploadUrl", imageKit.uploadUrl(),
                "folder", folder,
                "maxSizeBytes", registered ? MediaService.MAX_IMAGE_BYTES : LEGACY_MAX_BYTES,
                "allowedTypes", registered ? MediaService.IMAGE_TYPES : LEGACY_TYPES,
                "register", registered));
    }

    public record RegisterRequest(@NotBlank @Size(max = 128) String fileId, @NotBlank String purpose) {
    }

    @PostMapping("/assets")
    @Operation(summary = "Verify an uploaded image with ImageKit and record it")
    public ApiResponse<Map<String, Object>> register(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                     @Valid @RequestBody RegisterRequest r) {
        return ApiResponse.ok(media.register(u, r.fileId(), r.purpose()), "Image saved");
    }

    @GetMapping("/assets")
    public ApiResponse<PageResponse<Map<String, Object>>> list(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                               @RequestParam(required = false) String purpose,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.ok(media.list(u, purpose, page, size));
    }

    @DeleteMapping("/assets/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthenticatedUserPrincipal u, @PathVariable UUID id) {
        media.delete(u, id);
        return ApiResponse.ok(null, "Image deleted");
    }
}
