package com.marketplace.media;

import com.fasterxml.jackson.databind.JsonNode;
import com.marketplace.common.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Server-side ImageKit access. The private key is used only here (HTTP Basic auth
 * and upload signatures) and is never returned to clients or written to logs.
 */
@Slf4j
@Component
public class ImageKitClient {

    private final String publicKey;
    private final String privateKey;
    private final String urlEndpoint;
    private final String uploadUrl;
    private final RestClient api;
    private final RestClient upload;

    public ImageKitClient(@Value("${imagekit.public-key:}") String publicKey,
                          @Value("${imagekit.private-key:}") String privateKey,
                          @Value("${imagekit.url-endpoint:}") String urlEndpoint,
                          @Value("${imagekit.api-url:https://api.imagekit.io/v1}") String apiUrl,
                          @Value("${imagekit.upload-url:https://upload.imagekit.io/api/v1/files/upload}") String uploadUrl) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.urlEndpoint = urlEndpoint;
        this.uploadUrl = uploadUrl;
        String basic = "Basic " + Base64.getEncoder().encodeToString((privateKey + ":").getBytes(StandardCharsets.UTF_8));
        this.api = RestClient.builder().baseUrl(apiUrl).defaultHeader("Authorization", basic).build();
        this.upload = RestClient.builder().defaultHeader("Authorization", basic).build();
    }

    public boolean isConfigured() {
        return !publicKey.isBlank() && !privateKey.isBlank() && !urlEndpoint.isBlank();
    }

    public void requireConfigured() {
        if (!isConfigured()) {
            throw ApiException.unavailable("Image uploads are not configured yet (ImageKit credentials missing on the server).");
        }
    }

    public String publicKey() {
        return publicKey;
    }

    public String urlEndpoint() {
        return urlEndpoint;
    }

    public String uploadUrl() {
        return uploadUrl;
    }

    /** ImageKit client-upload signature: HMAC-SHA1(token + expire) with the private key. */
    public String sign(String token, long expire) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(privateKey.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
            return HexFormat.of().formatHex(mac.doFinal((token + expire).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Could not sign upload", e);
        }
    }

    /** File metadata straight from ImageKit (path, type, size, dimensions, url). */
    public JsonNode fileDetails(String fileId) {
        requireConfigured();
        try {
            return api.get().uri("/files/{id}/details", fileId).retrieve().body(JsonNode.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) throw ApiException.notFound("Uploaded file");
            log.error("ImageKit file lookup failed: HTTP {}", e.getStatusCode().value());
            throw ApiException.unavailable("Could not confirm the upload with the image service. Please try again.");
        }
    }

    public void deleteFile(String fileId) {
        requireConfigured();
        try {
            api.delete().uri("/files/{id}", fileId).retrieve().toBodilessEntity();
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) return; // already gone
            log.error("ImageKit delete failed: HTTP {}", e.getStatusCode().value());
            throw ApiException.unavailable("Could not delete the image from storage. Please try again.");
        }
    }

    /** Server-side upload (used for AI-generated images). Returns ImageKit's upload response. */
    public JsonNode uploadBytes(byte[] bytes, String fileName, String folder) {
        requireConfigured();
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        });
        form.add("fileName", fileName);
        form.add("folder", folder);
        form.add("useUniqueFileName", "true");
        try {
            return upload.post().uri(uploadUrl).contentType(MediaType.MULTIPART_FORM_DATA).body(form).retrieve().body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.error("ImageKit server upload failed: HTTP {}", e.getStatusCode().value());
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The image service rejected the upload.");
        }
    }
}
