package com.marketplace.media;

import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Issues short-lived ImageKit client-upload signatures (HMAC-SHA1 of token+expire
 * with the private key, per ImageKit's documented scheme). Files are uploaded
 * into a per-user folder. Without ImageKit keys the endpoint reports that
 * uploads are unavailable.
 */
@RestController
@RequestMapping("/api/v1/media")
@Tag(name = "Media uploads")
public class MediaController {

    static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4");

    private final String privateKey;
    private final String publicKey;
    private final String urlEndpoint;

    public MediaController(@Value("${imagekit.private-key:}") String privateKey,
                           @Value("${imagekit.public-key:}") String publicKey,
                           @Value("${imagekit.url-endpoint:}") String urlEndpoint) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.urlEndpoint = urlEndpoint;
    }

    @GetMapping("/upload-auth")
    @Operation(summary = "Signed parameters for one direct upload to ImageKit (valid 10 minutes)")
    public ApiResponse<Map<String, Object>> uploadAuth(@AuthenticationPrincipal AuthenticatedUserPrincipal u) {
        if (privateKey.isBlank() || publicKey.isBlank() || urlEndpoint.isBlank()) {
            throw ApiException.unavailable("Photo uploads are not set up yet. You can paste an image link instead.");
        }
        String token = UUID.randomUUID().toString();
        long expire = System.currentTimeMillis() / 1000 + 600;
        return ApiResponse.ok(Map.of(
                "token", token,
                "expire", expire,
                "signature", hmacSha1(token + expire),
                "publicKey", publicKey,
                "urlEndpoint", urlEndpoint,
                "folder", "/users/" + u.getUserId(),
                "maxSizeBytes", MAX_FILE_SIZE_BYTES,
                "allowedTypes", ALLOWED_TYPES));
    }

    private String hmacSha1(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(privateKey.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign upload", e);
        }
    }
}
