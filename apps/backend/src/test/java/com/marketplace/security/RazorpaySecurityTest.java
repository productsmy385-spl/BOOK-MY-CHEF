package com.marketplace.security;

import com.marketplace.payments.RazorpayService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Razorpay Payment Security Tests")
public class RazorpaySecurityTest {

    private final RazorpayService razorpayService = new RazorpayService(null, null);
    private final String secret = "prod_razorpay_secret_test_key_8899";

    private String computeHmac(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("Valid HMAC-SHA256 signature must be verified successfully")
    void testValidSignatureVerification() throws Exception {
        String payload = "order_123456789|pay_987654321";
        String validSig = computeHmac(payload, secret);

        boolean result = razorpayService.verifyHmacSha256(payload, validSig, secret);
        assertTrue(result, "Authentic payment signature must be verified as valid");
    }

    @Test
    @DisplayName("Tampered payload or signature must be rejected")
    void testTamperedSignatureRejection() throws Exception {
        String payload = "order_123456789|pay_987654321";
        String tamperedSig = "deadbeefcafebabe00112233445566778899aabbccddeeff0011223344556677";

        boolean result = razorpayService.verifyHmacSha256(payload, tamperedSig, secret);
        assertFalse(result, "Tampered signature must be rejected");
    }

    @Test
    @DisplayName("Signature signed with incorrect secret must be rejected")
    void testWrongSecretRejection() throws Exception {
        String payload = "order_123456789|pay_987654321";
        String wrongSecretSig = computeHmac(payload, "attacker_secret_key");

        boolean result = razorpayService.verifyHmacSha256(payload, wrongSecretSig, secret);
        assertFalse(result, "Signature generated with unauthorized secret must be rejected");
    }
}
