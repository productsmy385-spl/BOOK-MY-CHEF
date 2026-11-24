package com.marketplace.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.marketplace.common.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

/**
 * Minimal client for the Clerk Backend API. Used to read a user's VERIFIED
 * contact details (session tokens do not carry them) and to send administrator
 * invitations. Requires CLERK_SECRET_KEY; without it these operations report
 * that they are unavailable rather than pretending to succeed.
 */
@Slf4j
@Component
public class ClerkBackendClient {

    private final RestClient client;
    private final boolean configured;

    public ClerkBackendClient(@Value("${clerk.secret-key:}") String secretKey,
                              @Value("${clerk.api-url:https://api.clerk.com/v1}") String apiUrl) {
        this.configured = secretKey != null && !secretKey.isBlank();
        this.client = RestClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + secretKey)
                .build();
    }

    public boolean isConfigured() {
        return configured;
    }

    public record VerifiedContact(String email, String phone, String firstName, String lastName) {
        public String fullName() {
            String n = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
            return n.isEmpty() ? null : n;
        }
    }

    /** Returns the user's primary email/phone, each only if Clerk reports it as verified. */
    public VerifiedContact getVerifiedContact(String clerkUserId) {
        if (!configured) {
            throw ApiException.unavailable("Account verification service is not configured.");
        }
        try {
            JsonNode user = client.get().uri("/users/{id}", clerkUserId).retrieve().body(JsonNode.class);
            if (user == null) throw ApiException.unavailable("Could not read account details.");
            return new VerifiedContact(
                    verifiedValue(user, "email_addresses", "email_address", user.path("primary_email_address_id").asText(null)),
                    verifiedValue(user, "phone_numbers", "phone_number", user.path("primary_phone_number_id").asText(null)),
                    textOrNull(user.path("first_name")),
                    textOrNull(user.path("last_name")));
        } catch (RestClientResponseException e) {
            log.error("Clerk user lookup failed: HTTP {}", e.getStatusCode().value());
            throw ApiException.unavailable("Could not verify your account right now. Please try again.");
        }
    }

    /** Sends a Clerk invitation email that lets the recipient create an account and land on the admin sign-in. */
    public void createInvitation(String email, String redirectUrl) {
        if (!configured) {
            throw ApiException.unavailable("Invitation emails require CLERK_SECRET_KEY to be configured on the server.");
        }
        try {
            client.post().uri("/invitations")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email_address", email, "redirect_url", redirectUrl, "ignore_existing", true))
                    .retrieve().toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.error("Clerk invitation failed: HTTP {} {}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw ApiException.unavailable("Clerk rejected the invitation. Check the email address and Clerk settings.");
        }
    }

    private static String verifiedValue(JsonNode user, String arrayField, String valueField, String primaryId) {
        String fallback = null;
        for (JsonNode n : user.path(arrayField)) {
            boolean verified = "verified".equals(n.path("verification").path("status").asText());
            if (!verified) continue;
            String value = n.path(valueField).asText(null);
            if (primaryId != null && primaryId.equals(n.path("id").asText())) return value;
            if (fallback == null) fallback = value;
        }
        return fallback;
    }

    private static String textOrNull(JsonNode n) {
        return n.isMissingNode() || n.isNull() || n.asText().isBlank() ? null : n.asText();
    }
}
