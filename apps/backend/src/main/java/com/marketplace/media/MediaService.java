package com.marketplace.media;

import com.fasterxml.jackson.databind.JsonNode;
import com.marketplace.common.ApiException;
import com.marketplace.common.PageResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.*;

/**
 * Registers ImageKit uploads as media assets after verifying them with ImageKit,
 * and enforces that each user can only use and delete their own images.
 */
@Service
@RequiredArgsConstructor
public class MediaService {

    public static final long MAX_IMAGE_BYTES = 8L * 1024 * 1024;
    public static final List<String> IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp");

    /** Which account type may upload for which purpose, and the ImageKit folder it goes to. */
    private static final Map<String, String> PROVIDER_PURPOSES = Map.of(
            "PROVIDER_BANNER", "provider-banners",
            "PROVIDER_COVER", "provider-covers",
            "PROVIDER_PROFILE", "provider-profiles",
            "PROVIDER_PORTFOLIO", "provider-portfolios");
    private static final Map<String, String> ADMIN_PURPOSES = Map.of(
            "PLATFORM_BANNER", "platform-banners",
            "CAMPAIGN_ASSET", "campaign-assets");

    private final NamedParameterJdbcTemplate jdbc;
    private final ImageKitClient imageKit;

    @org.springframework.beans.factory.annotation.Value("${app.public-web-url:http://localhost:5173}")
    private String publicWebUrl;

    public String folderFor(AuthenticatedUserPrincipal u, String purpose) {
        if ("PROVIDER".equals(u.getUserType()) && PROVIDER_PURPOSES.containsKey(purpose)) {
            return "/book-my-chef/" + PROVIDER_PURPOSES.get(purpose) + "/" + u.getUserId();
        }
        if ("ADMIN".equals(u.getUserType()) && ADMIN_PURPOSES.containsKey(purpose)) {
            return "/book-my-chef/" + ADMIN_PURPOSES.get(purpose);
        }
        throw ApiException.forbidden();
    }

    /** Verifies an uploaded file with ImageKit, then records it. Idempotent per file id. */
    @Transactional
    public Map<String, Object> register(AuthenticatedUserPrincipal u, String fileId, String purpose) {
        String folder = folderFor(u, purpose);
        List<Map<String, Object>> existing = jdbc.queryForList(
                "SELECT owner_user_id FROM media_assets WHERE file_id = :f", Map.of("f", fileId));
        if (!existing.isEmpty()) {
            if (!u.getUserId().equals(existing.get(0).get("owner_user_id"))) throw ApiException.forbidden();
            return byFileId(fileId);
        }

        JsonNode d = imageKit.fileDetails(fileId);
        String path = d.path("filePath").asText("");
        if (!path.startsWith(folder + "/")) {
            // Someone else's file, or uploaded outside the signed folder.
            throw ApiException.forbidden();
        }
        String mime = d.path("mime").asText(d.path("fileType").asText(""));
        long size = d.path("size").asLong(0);
        if (!IMAGE_TYPES.contains(mime)) {
            imageKit.deleteFile(fileId);
            throw ApiException.invalid("Only JPEG, PNG or WebP images are allowed.");
        }
        if (size <= 0 || size > MAX_IMAGE_BYTES) {
            imageKit.deleteFile(fileId);
            throw ApiException.invalid("Images must be smaller than 8 MB.");
        }
        insert(u.getUserId(), purpose, fileId, d.path("url").asText(), path, mime, size,
                intOrNull(d, "width"), intOrNull(d, "height"), "UPLOAD", null);
        return byFileId(fileId);
    }

    /** Records an image the server itself uploaded (AI generation). */
    @Transactional
    public void recordGenerated(UUID owner, String fileId, String url, String path, long size,
                                Integer width, Integer height, String prompt) {
        insert(owner, "CAMPAIGN_ASSET", fileId, url, path, "image/png", size, width, height, "AI", prompt);
    }

    void insert(UUID owner, String purpose, String fileId, String url, String path, String mime, long size,
                Integer width, Integer height, String source, String prompt) {
        jdbc.update("""
                INSERT INTO media_assets (owner_user_id, purpose, file_id, url, file_path, mime_type, size_bytes,
                    width, height, source, ai_prompt)
                VALUES (:o, :p, :f, :u, :path, :m, :s, :w, :h, :src, :prompt)""",
                new MapSqlParameterSource().addValue("o", owner).addValue("p", purpose).addValue("f", fileId)
                        .addValue("u", url).addValue("path", path).addValue("m", mime).addValue("s", size)
                        .addValue("w", width).addValue("h", height).addValue("src", source).addValue("prompt", prompt));
    }

    public Map<String, Object> byFileId(String fileId) {
        return jdbc.queryForMap(SELECT + " WHERE file_id = :f", Map.of("f", fileId));
    }

    private static final String SELECT = """
            SELECT id, purpose, storage, url, width, height, mime_type AS "mimeType", size_bytes AS "sizeBytes",
                   source, ai_prompt AS "aiPrompt", created_at::text AS "createdAt"
            FROM media_assets""";

    /**
     * Returns the asset if it is usable by this user for one of the given purposes.
     * Admin-owned platform assets are shared among administrators.
     */
    public Map<String, Object> requireUsable(AuthenticatedUserPrincipal u, UUID assetId, Set<String> purposes) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id, owner_user_id, purpose, url FROM media_assets WHERE id = :id AND deleted_at IS NULL""", Map.of("id", assetId));
        if (rows.isEmpty()) throw ApiException.invalid("That image is no longer available. Upload it again.");
        Map<String, Object> a = rows.get(0);
        boolean sharedAdminAsset = "ADMIN".equals(u.getUserType()) && ADMIN_PURPOSES.containsKey((String) a.get("purpose"));
        if (!sharedAdminAsset && !u.getUserId().equals(a.get("owner_user_id"))) throw ApiException.forbidden();
        if (!purposes.contains((String) a.get("purpose"))) throw ApiException.invalid("That image cannot be used here.");
        return a;
    }

    @Transactional(readOnly = true)
    public PageResponse<Map<String, Object>> list(AuthenticatedUserPrincipal u, String purpose, int page, int size) {
        int s = Math.min(Math.max(size, 1), 60);
        int p = Math.max(page, 0);
        MapSqlParameterSource params = new MapSqlParameterSource().addValue("lim", s).addValue("off", p * s);
        List<String> where = new ArrayList<>(List.of("deleted_at IS NULL"));
        if ("ADMIN".equals(u.getUserType())) {
            where.add("purpose IN ('PLATFORM_BANNER', 'CAMPAIGN_ASSET')");
        } else {
            where.add("owner_user_id = :owner");
            params.addValue("owner", u.getUserId());
        }
        if (purpose != null && !purpose.isBlank()) {
            where.add("purpose = :purpose");
            params.addValue("purpose", purpose);
        }
        String w = String.join(" AND ", where);
        List<Map<String, Object>> items = jdbc.queryForList(SELECT + " WHERE " + w + " ORDER BY created_at DESC LIMIT :lim OFFSET :off", params);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM media_assets WHERE " + w, params, Long.class);
        return new PageResponse<>(items, p, s, total == null ? 0 : total);
    }

    /** Deletes from ImageKit and marks deleted, only when no banner references the asset. */
    @Transactional
    public void delete(AuthenticatedUserPrincipal u, UUID assetId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT owner_user_id, purpose, file_id, storage FROM media_assets WHERE id = :id AND deleted_at IS NULL FOR UPDATE", Map.of("id", assetId));
        if (rows.isEmpty()) throw ApiException.notFound("Image");
        Map<String, Object> a = rows.get(0);
        boolean sharedAdminAsset = "ADMIN".equals(u.getUserType()) && ADMIN_PURPOSES.containsKey((String) a.get("purpose"));
        if (!sharedAdminAsset && !u.getUserId().equals(a.get("owner_user_id"))) throw ApiException.notFound("Image");
        Boolean used = jdbc.queryForObject("""
                SELECT EXISTS (SELECT 1 FROM platform_banners WHERE (desktop_asset_id = :id OR mobile_asset_id = :id) AND status <> 'ARCHIVED')
                    OR EXISTS (SELECT 1 FROM provider_banners WHERE (desktop_asset_id = :id OR mobile_asset_id = :id) AND status <> 'ARCHIVED')""",
                Map.of("id", assetId), Boolean.class);
        if (Boolean.TRUE.equals(used)) throw ApiException.conflict("This image is used by a banner. Archive the banner first.");
        // Bundled images ship with the web app; only ImageKit files are deleted remotely.
        if ("IMAGEKIT".equals(a.get("storage"))) imageKit.deleteFile((String) a.get("file_id"));
        jdbc.update("UPDATE media_assets SET deleted_at = now() WHERE id = :id", Map.of("id", assetId));
    }

    /**
     * Copies a bundled image (served by the web app) into ImageKit and switches the asset to it.
     * Every banner that uses the asset picks up the ImageKit URL automatically.
     */
    @Transactional
    public Map<String, Object> copyBundledToImageKit(UUID assetId) {
        imageKit.requireConfigured();
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT purpose, url, storage FROM media_assets WHERE id = :id AND deleted_at IS NULL FOR UPDATE", Map.of("id", assetId));
        if (rows.isEmpty()) throw ApiException.notFound("Image");
        Map<String, Object> a = rows.get(0);
        if (!"BUNDLED".equals(a.get("storage"))) throw ApiException.conflict("This image is already stored in ImageKit.");
        String path = (String) a.get("url");
        byte[] bytes;
        try {
            bytes = RestClient.create().get().uri(publicWebUrl.replaceAll("/+$", "") + path).retrieve().body(byte[].class);
        } catch (Exception e) {
            throw ApiException.unavailable("Could not read the bundled image from the web app at " + publicWebUrl + ".");
        }
        if (bytes == null || bytes.length == 0) throw ApiException.unavailable("The bundled image is empty.");
        String folder = "/book-my-chef/" + ("CAMPAIGN_ASSET".equals(a.get("purpose")) ? "campaign-assets" : "platform-banners");
        JsonNode up = imageKit.uploadBytes(bytes, path.substring(path.lastIndexOf('/') + 1), folder);
        jdbc.update("""
                UPDATE media_assets SET storage = 'IMAGEKIT', file_id = :f, url = :u, file_path = :p, size_bytes = :s
                WHERE id = :id""", new MapSqlParameterSource().addValue("f", up.path("fileId").asText()).addValue("u", up.path("url").asText())
                .addValue("p", up.path("filePath").asText()).addValue("s", up.path("size").asLong(bytes.length)).addValue("id", assetId));
        return jdbc.queryForMap(SELECT + " WHERE id = :id", Map.of("id", assetId));
    }

    private static Integer intOrNull(JsonNode n, String field) {
        return n.hasNonNull(field) ? n.get(field).asInt() : null;
    }
}
