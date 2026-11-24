package com.marketplace.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.DefaultJWTClaimsVerifier;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Verifies Clerk session tokens (RS256 JWTs) against Clerk's published JWKS.
 * Checks signature, issuer, expiry/not-before (with small clock skew) and, when
 * configured, the authorized party (azp) claim against the allowed web origins.
 */
@Slf4j
@Component
public class ClerkTokenVerifier {

    private final DefaultJWTProcessor<SecurityContext> processor;
    private final Set<String> authorizedParties;
    private final boolean configured;

    public ClerkTokenVerifier(
            @Value("${clerk.issuer:}") String issuer,
            @Value("${clerk.jwks-url:}") String jwksUrl,
            @Value("${clerk.authorized-parties:}") String authorizedPartiesCsv) {

        this.authorizedParties = new HashSet<>();
        Arrays.stream(authorizedPartiesCsv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .forEach(authorizedParties::add);

        if (issuer.isBlank() || jwksUrl.isBlank()) {
            log.error("Clerk is not configured (CLERK_ISSUER / CLERK_JWKS_URL missing). All bearer tokens will be rejected.");
            this.processor = null;
            this.configured = false;
            return;
        }

        try {
            JWKSource<SecurityContext> keySource = JWKSourceBuilder.create(new URL(jwksUrl))
                    .retrying(true)
                    .build();
            DefaultJWTProcessor<SecurityContext> p = new DefaultJWTProcessor<>();
            p.setJWSKeySelector(new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource));
            DefaultJWTClaimsVerifier<SecurityContext> claimsVerifier = new DefaultJWTClaimsVerifier<>(
                    new JWTClaimsSet.Builder().issuer(issuer).build(),
                    new HashSet<>(List.of("sub", "exp", "iat")));
            claimsVerifier.setMaxClockSkew(30);
            p.setJWTClaimsSetVerifier(claimsVerifier);
            this.processor = p;
            this.configured = true;
        } catch (MalformedURLException e) {
            throw new IllegalStateException("CLERK_JWKS_URL is not a valid URL: " + jwksUrl, e);
        }
    }

    /**
     * @return the verified Clerk user id (sub claim)
     * @throws InvalidTokenException when the token is not a valid, current Clerk session token
     */
    public String verifyAndGetSubject(String token) {
        if (!configured) {
            throw new InvalidTokenException("Authentication service is not configured");
        }
        try {
            JWTClaimsSet claims = processor.process(token, null);
            if (!authorizedParties.isEmpty()) {
                String azp = claims.getStringClaim("azp");
                if (azp != null && !authorizedParties.contains(azp)) {
                    throw new InvalidTokenException("Token issued for an unrecognised origin");
                }
            }
            return claims.getSubject();
        } catch (InvalidTokenException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidTokenException("Invalid or expired session token");
        }
    }

    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException(String message) {
            super(message);
        }
    }
}
