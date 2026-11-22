package com.marketplace.media;

import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media & Document Security", description = "Secure upload authorization, mime-type validation, and private KYC storage")
public class MediaController {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
    );

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${imagekit.private-key:default_imagekit_private_key}")
    private String imagekitPrivateKey;

    @Value("${imagekit.public-key:default_imagekit_public_key}")
    private String imagekitPublicKey;

    @GetMapping("/upload-token")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Generate secure signed token for authenticated client-side upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUploadAuth(
            @AuthenticationPrincipal AuthenticatedUserPrincipal principal) {

        long expire = (System.currentTimeMillis() / 1000) + 1800; // 30 minutes
        String token = "tok_" + Math.abs(RANDOM.nextLong()) + "_" + (principal != null ? principal.getUserId() : "guest");
        String signature = generateHmacSignature(token + expire, imagekitPrivateKey);

        Map<String, Object> authParams = Map.of(
                "token", token,
                "expire", expire,
                "signature", signature,
                "publicKey", imagekitPublicKey,
                "maxSizeBytes", MAX_FILE_SIZE_BYTES,
                "allowedMimeTypes", ALLOWED_MIME_TYPES
        );

        return ResponseEntity.ok(ApiResponse.ok(authParams, "Upload authorization generated"));
    }

    private String generateHmacSignature(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA1");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            log.error("Failed to generate upload signature: {}", e.getMessage());
            return "sig_mock_" + System.currentTimeMillis();
        }
    }
}
