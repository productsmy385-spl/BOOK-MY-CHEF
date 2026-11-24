package com.marketplace.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/** Svix signature scheme used by Clerk webhooks. */
class ClerkWebhookSignatureTest {

    private static final byte[] SECRET = "0123456789abcdef0123456789abcdef".getBytes(StandardCharsets.UTF_8);
    private ClerkWebhookController controller;

    @BeforeEach
    void setUp() {
        controller = new ClerkWebhookController(mock(UserRepository.class), new ObjectMapper());
        ReflectionTestUtils.setField(controller, "webhookSecret", "whsec_" + Base64.getEncoder().encodeToString(SECRET));
    }

    private static String sign(String id, String ts, String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET, "HmacSHA256"));
        return "v1," + Base64.getEncoder().encodeToString(mac.doFinal((id + "." + ts + "." + body).getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void acceptsCorrectSignature() throws Exception {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        assertThat(controller.isValidSignature("{}", "msg_1", ts, sign("msg_1", ts, "{}"))).isTrue();
    }

    @Test
    void acceptsWhenOneOfSeveralSignaturesMatches() throws Exception {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        assertThat(controller.isValidSignature("{}", "msg_1", ts, "v1,AAAA " + sign("msg_1", ts, "{}"))).isTrue();
    }

    @Test
    void rejectsTamperedBody() throws Exception {
        String ts = String.valueOf(Instant.now().getEpochSecond());
        assertThat(controller.isValidSignature("{\"x\":1}", "msg_1", ts, sign("msg_1", ts, "{}"))).isFalse();
    }

    @Test
    void rejectsReplayOutsideTolerance() throws Exception {
        String old = String.valueOf(Instant.now().minusSeconds(3600).getEpochSecond());
        assertThat(controller.isValidSignature("{}", "msg_1", old, sign("msg_1", old, "{}"))).isFalse();
    }

    @Test
    void rejectsMissingHeaders() {
        assertThat(controller.isValidSignature("{}", null, null, null)).isFalse();
    }
}
