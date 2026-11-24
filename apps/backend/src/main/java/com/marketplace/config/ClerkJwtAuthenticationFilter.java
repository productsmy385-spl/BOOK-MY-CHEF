package com.marketplace.config;

import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.identity.User;
import com.marketplace.identity.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Authenticates requests carrying a Clerk session token.
 *
 * - No Authorization header: request continues anonymously (public endpoints only).
 * - Invalid/expired token: 401.
 * - Valid token, user known to PostgreSQL: principal with the user's role.
 * - Valid token, user not yet synced: principal with ROLE_PENDING_SYNC, which only
 *   grants access to POST /api/v1/auth/sync and GET /api/v1/auth/me.
 * - Suspended/deleted account: 403.
 *
 * The role always comes from PostgreSQL, never from the client.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClerkJwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String ROLE_PENDING_SYNC = "ROLE_PENDING_SYNC";

    private final ClerkTokenVerifier tokenVerifier;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clerkUserId;
        try {
            clerkUserId = tokenVerifier.verifyAndGetSubject(authHeader.substring(7).trim());
        } catch (ClerkTokenVerifier.InvalidTokenException ex) {
            log.debug("Rejected bearer token on {}: {}", request.getRequestURI(), ex.getMessage());
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please sign in again.");
            return;
        }

        Optional<User> userOpt = userRepository.findByClerkId(clerkUserId);
        AuthenticatedUserPrincipal principal;
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
                writeError(response, HttpServletResponse.SC_FORBIDDEN, "This account is suspended. Please contact support.");
                return;
            }
            principal = AuthenticatedUserPrincipal.builder()
                    .userId(user.getId())
                    .clerkId(clerkUserId)
                    .phone(user.getPhone())
                    .email(user.getEmail())
                    .userType(user.getUserType())
                    .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getUserType().toUpperCase())))
                    .build();
        } else {
            principal = AuthenticatedUserPrincipal.builder()
                    .clerkId(clerkUserId)
                    .authorities(List.of(new SimpleGrantedAuthority(ROLE_PENDING_SYNC)))
                    .build();
        }

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }
}
