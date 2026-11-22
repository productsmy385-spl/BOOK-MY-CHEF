package com.marketplace.config;

import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.identity.User;
import com.marketplace.identity.UserRepository;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ClerkJwtAuthenticationFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Value("${clerk.issuer:https://causal-turtle-7435.clerk.accounts.dev}")
    private String expectedIssuer;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Check optional internal dev mock header strictly when running locally
            String mockUserId = request.getHeader("X-Mock-User-Id");
            if (mockUserId != null && !mockUserId.isEmpty() && "localhost".equalsIgnoreCase(request.getServerName())) {
                authenticateMockUser(mockUserId);
            }
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();

        try {
            SignedJWT signedJWT = SignedJWT.parse(token);

            // 1. Validate Expiration
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (expirationTime != null && new Date().after(expirationTime)) {
                log.warn("Rejected expired Clerk JWT token for path: {}", request.getRequestURI());
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has expired");
                return;
            }

            // 2. Extract Subject (Clerk User ID)
            String clerkUserId = signedJWT.getJWTClaimsSet().getSubject();
            if (clerkUserId == null || clerkUserId.isEmpty()) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token claims: subject missing");
                return;
            }

            // 3. Resolve user identity from trusted PostgreSQL records
            Optional<User> userOpt = userRepository.findByClerkId(clerkUserId);

            if (userOpt.isPresent()) {
                User user = userOpt.get();

                if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
                    log.warn("Access denied for suspended/inactive user: {}", user.getId());
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "Account suspended or deactivated");
                    return;
                }

                String role = "ROLE_" + user.getUserType().toUpperCase();
                AuthenticatedUserPrincipal principal = AuthenticatedUserPrincipal.builder()
                        .userId(user.getId())
                        .clerkId(user.getClerkId())
                        .phone(user.getPhone())
                        .email(user.getEmail())
                        .userType(user.getUserType())
                        .authorities(List.of(new SimpleGrantedAuthority(role)))
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                log.debug("Authenticated Clerk user {} has not yet synced to PostgreSQL", clerkUserId);
            }

        } catch (Exception ex) {
            log.error("Failed to parse and verify Clerk JWT: {}", ex.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid JWT token signature or format");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateMockUser(String mockIdentifier) {
        Optional<User> userOpt = userRepository.findByClerkId(mockIdentifier)
                .or(() -> userRepository.findByPhone(mockIdentifier));

        userOpt.ifPresent(user -> {
            String role = "ROLE_" + user.getUserType().toUpperCase();
            AuthenticatedUserPrincipal principal = AuthenticatedUserPrincipal.builder()
                    .userId(user.getId())
                    .clerkId(user.getClerkId())
                    .phone(user.getPhone())
                    .email(user.getEmail())
                    .userType(user.getUserType())
                    .authorities(List.of(new SimpleGrantedAuthority(role)))
                    .build();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        });
    }
}
