package com.marketplace.promotion;

import com.fasterxml.jackson.databind.JsonNode;
import com.marketplace.common.ApiException;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.media.ImageKitClient;
import com.marketplace.media.MediaService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.*;

/**
 * Generates campaign images with a real image model (OpenAI Images API) and stores
 * them in ImageKit as CAMPAIGN_ASSET media. Without an API key the feature reports
 * itself unavailable; nothing is simulated.
 */
@Slf4j
@Service
public class AiImageService {

    public record Preset(String code, String label, String prompt) {
    }

    public static final List<Preset> PRESETS = List.of(
        new Preset("WEDDING_CATERING", "Indian wedding catering", "a lavish Indian wedding buffet with brass serving vessels, marigold decor and warm evening lighting"),
        new Preset("TRADITIONAL_CUISINE", "Traditional Indian cuisine", "a traditional South Indian meal served on a banana leaf with rice, sambar, rasam, poriyal and payasam"),
        new Preset("HOME_CHEF", "Professional home chefs", "a friendly professional chef cooking fresh Indian food in a bright, clean home kitchen"),
        new Preset("PRIVATE_DINING", "Premium private dining", "an elegant private dining table set for six with plated gourmet Indian courses and soft candlelight"),
        new Preset("BIRTHDAY", "Birthday celebrations", "a joyful family birthday party table with homemade Indian sweets, snacks and a decorated cake"),
        new Preset("CORPORATE", "Corporate events", "a polished corporate event buffet with live counters and neatly uniformed serving staff"),
        new Preset("FESTIVAL", "Festival food promotions", "a festive Diwali spread of sweets and savouries with diyas and rangoli"),
        new Preset("REGIONAL", "Regional cuisine promotions", "an authentic Andhra meal with gongura pachadi, pappu, pulihora and crispy appalam on a steel plate")
    );

    private static final String STYLE = "Realistic premium commercial food photography, natural light, shallow depth of field, "
            + "appetising colours, no text, no logos, no watermarks, leave calm negative space on one side for a headline.";

    private final String apiKey;
    private final String model;
    private final String provider;
    private final RestClient client;
    private final ImageKitClient imageKit;
    private final MediaService media;

    public AiImageService(@Value("${ai-images.api-key:}") String apiKey,
                          @Value("${ai-images.model:gpt-image-1}") String model,
                          @Value("${ai-images.provider:openai}") String provider,
                          @Value("${ai-images.api-url:https://api.openai.com/v1}") String apiUrl,
                          ImageKitClient imageKit, MediaService media) {
        this.apiKey = apiKey;
        this.model = model;
        this.provider = provider;
        this.imageKit = imageKit;
        this.media = media;
        this.client = RestClient.builder().baseUrl(apiUrl).defaultHeader("Authorization", "Bearer " + apiKey).build();
    }

    public Map<String, Object> config() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("enabled", isConfigured() && imageKit.isConfigured());
        m.put("generatorConfigured", isConfigured());
        m.put("storageConfigured", imageKit.isConfigured());
        m.put("provider", provider);
        m.put("presets", PRESETS.stream().map(p -> Map.of("code", p.code(), "label", p.label())).toList());
        return m;
    }

    boolean isConfigured() {
        return "openai".equals(provider) && !apiKey.isBlank();
    }

    /** Generates one image and stores it. format: DESKTOP (landscape) or MOBILE (portrait). */
    public Map<String, Object> generate(AuthenticatedUserPrincipal admin, String prompt, String presetCode, String format) {
        if (!isConfigured()) {
            throw ApiException.unavailable("AI image generation is not configured. Set OPENAI_API_KEY on the backend service, or upload an image instead.");
        }
        imageKit.requireConfigured();
        String preset = PRESETS.stream().filter(p -> p.code().equals(presetCode)).map(Preset::prompt).findFirst().orElse("");
        String subject = (prompt == null || prompt.isBlank()) ? preset : prompt.trim() + (preset.isEmpty() ? "" : ". Scene: " + preset);
        if (subject.isBlank()) throw ApiException.invalid("Describe the image or choose a preset.");
        String fullPrompt = subject + ". " + STYLE;
        String size = "MOBILE".equals(format) ? "1024x1536" : "1536x1024";

        byte[] png;
        try {
            JsonNode res = client.post().uri("/images/generations").contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("model", model, "prompt", fullPrompt, "size", size, "n", 1))
                    .retrieve().body(JsonNode.class);
            String b64 = res == null ? null : res.path("data").path(0).path("b64_json").asText(null);
            if (b64 == null) throw new ApiException(HttpStatus.BAD_GATEWAY, "The image generator returned no image.");
            png = Base64.getDecoder().decode(b64);
        } catch (RestClientResponseException e) {
            log.error("AI image generation failed: HTTP {}", e.getStatusCode().value());
            throw new ApiException(HttpStatus.BAD_GATEWAY, e.getStatusCode().value() == 400
                    ? "The image generator refused this prompt. Try rewording it."
                    : "The image generator is unavailable right now. Please try again.");
        }

        String folder = media.folderFor(admin, "CAMPAIGN_ASSET");
        JsonNode up = imageKit.uploadBytes(png, "ai-" + UUID.randomUUID() + ".png", folder);
        String fileId = up.path("fileId").asText();
        media.recordGenerated(admin.getUserId(), fileId, up.path("url").asText(), up.path("filePath").asText(),
                up.path("size").asLong(png.length), up.hasNonNull("width") ? up.get("width").asInt() : null,
                up.hasNonNull("height") ? up.get("height").asInt() : null, fullPrompt);
        return media.byFileId(fileId);
    }
}
