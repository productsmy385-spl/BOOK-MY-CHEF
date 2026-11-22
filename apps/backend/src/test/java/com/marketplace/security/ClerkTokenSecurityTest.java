package com.marketplace.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Clerk JWT Security & Expiration Tests")
public class ClerkTokenSecurityTest {

    private final byte[] sharedSecret = "a_very_secure_test_signing_key_32_bytes_long!".getBytes();

    private SignedJWT createTestToken(String subject, Instant expiration) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(subject)
                .issuer("https://viable-marmot-48.clerk.accounts.dev")
                .expirationTime(Date.from(expiration))
                .issueTime(new Date())
                .build();

        SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        signedJWT.sign(new MACSigner(sharedSecret));
        return signedJWT;
    }

    @Test
    @DisplayName("Active token with future expiration must be valid")
    void testActiveTokenValid() throws Exception {
        SignedJWT jwt = createTestToken("user_clerk_active_01", Instant.now().plusSeconds(3600));
        Date exp = jwt.getJWTClaimsSet().getExpirationTime();

        assertNotNull(exp);
        assertTrue(new Date().before(exp), "Future expiration must not be expired");
        assertEquals("user_clerk_active_01", jwt.getJWTClaimsSet().getSubject());
    }

    @Test
    @DisplayName("Expired token must be detected and rejected")
    void testExpiredTokenDetected() throws Exception {
        SignedJWT jwt = createTestToken("user_clerk_expired_01", Instant.now().minusSeconds(120));
        Date exp = jwt.getJWTClaimsSet().getExpirationTime();

        assertNotNull(exp);
        assertTrue(new Date().after(exp), "Past expiration date must be identified as expired");
    }

    @Test
    @DisplayName("Malformed token string must fail parsing")
    void testMalformedTokenRejected() {
        String malformedToken = "not.a.valid.jwt.structure";
        assertThrows(Exception.class, () -> SignedJWT.parse(malformedToken));
    }
}
