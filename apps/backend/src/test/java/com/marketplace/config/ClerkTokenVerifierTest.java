package com.marketplace.config;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Verifies real RS256 signature/issuer/expiry checks against a JWKS served over HTTP. */
class ClerkTokenVerifierTest {

    private static HttpServer server;
    private static RSAKey key;
    private static RSAKey otherKey;
    private static String issuer;
    private static ClerkTokenVerifier verifier;

    @BeforeAll
    static void start() throws Exception {
        key = new RSAKeyGenerator(2048).keyID("k1").generate();
        otherKey = new RSAKeyGenerator(2048).keyID("k1").generate();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        byte[] jwks = new JWKSet(key.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);
        server.createContext("/jwks", ex -> {
            ex.sendResponseHeaders(200, jwks.length);
            ex.getResponseBody().write(jwks);
            ex.close();
        });
        server.start();
        issuer = "https://test.clerk.example";
        verifier = new ClerkTokenVerifier(issuer, "http://127.0.0.1:" + server.getAddress().getPort() + "/jwks",
                "https://app.example");
    }

    @AfterAll
    static void stop() {
        server.stop(0);
    }

    private static String token(RSAKey signingKey, String iss, Instant exp, String azp) throws Exception {
        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
                .subject("user_abc").issuer(iss).issueTime(new Date()).expirationTime(Date.from(exp));
        if (azp != null) claims.claim("azp", azp);
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).keyID("k1").type(JOSEObjectType.JWT).build(), claims.build());
        jwt.sign(new RSASSASigner(signingKey));
        return jwt.serialize();
    }

    @Test
    void acceptsValidToken() throws Exception {
        assertThat(verifier.verifyAndGetSubject(token(key, issuer, Instant.now().plusSeconds(300), "https://app.example")))
                .isEqualTo("user_abc");
    }

    @Test
    void rejectsTokenSignedByAnotherKey() throws Exception {
        String forged = token(otherKey, issuer, Instant.now().plusSeconds(300), null);
        assertThatThrownBy(() -> verifier.verifyAndGetSubject(forged)).isInstanceOf(ClerkTokenVerifier.InvalidTokenException.class);
    }

    @Test
    void rejectsWrongIssuer() throws Exception {
        String t = token(key, "https://evil.example", Instant.now().plusSeconds(300), null);
        assertThatThrownBy(() -> verifier.verifyAndGetSubject(t)).isInstanceOf(ClerkTokenVerifier.InvalidTokenException.class);
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        String t = token(key, issuer, Instant.now().minusSeconds(120), null);
        assertThatThrownBy(() -> verifier.verifyAndGetSubject(t)).isInstanceOf(ClerkTokenVerifier.InvalidTokenException.class);
    }

    @Test
    void rejectsUnknownAuthorizedParty() throws Exception {
        String t = token(key, issuer, Instant.now().plusSeconds(300), "https://phishing.example");
        assertThatThrownBy(() -> verifier.verifyAndGetSubject(t)).isInstanceOf(ClerkTokenVerifier.InvalidTokenException.class);
    }

    @Test
    void rejectsUnsignedAlgNoneToken() {
        String none = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyX2FiYyIsImlzcyI6Imh0dHBzOi8vdGVzdC5jbGVyay5leGFtcGxlIn0.";
        assertThatThrownBy(() -> verifier.verifyAndGetSubject(none)).isInstanceOf(ClerkTokenVerifier.InvalidTokenException.class);
    }

    @Test
    void unconfiguredVerifierRejectsEverything() throws Exception {
        ClerkTokenVerifier unconfigured = new ClerkTokenVerifier("", "", "");
        String t = token(key, issuer, Instant.now().plusSeconds(300), null);
        assertThatThrownBy(() -> unconfigured.verifyAndGetSubject(t)).isInstanceOf(ClerkTokenVerifier.InvalidTokenException.class);
    }
}
