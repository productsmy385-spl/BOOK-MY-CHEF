package com.marketplace.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Stateless bearer-token security. Coarse role rules live here; resource
 * ownership (a customer's booking, a provider's services) is enforced in the
 * service layer using the authenticated principal, never request parameters.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] AUTHENTICATED_ROLES = {"CUSTOMER", "PROVIDER", "ADMIN"};

    private final ClerkJwtAuthenticationFilter clerkJwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:4173,capacitor://localhost,https://localhost}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // stateless bearer tokens, no cookies
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Error dispatches carry the original status (e.g. 403); never re-deny them as 401
                .requestMatchers("/error").permitAll()
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()

                // Webhooks authenticate with their own signatures
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/webhook", "/api/v1/payments/webhook").permitAll()

                // Identity: any valid Clerk session, including one not yet synced
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/sync").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/auth/me").authenticated()

                // Provider self-management (must precede the public /providers/* rule)
                .requestMatchers("/api/v1/providers/me", "/api/v1/providers/me/**").hasRole("PROVIDER")

                // Public marketplace reads
                .requestMatchers(HttpMethod.GET,
                    "/api/v1/catalog",
                    "/api/v1/search/providers",
                    "/api/v1/providers/*",
                    "/api/v1/providers/*/menu",
                    "/api/v1/reviews/provider/*"
                ).permitAll()
                // Read-only price calculation for the booking form
                .requestMatchers(HttpMethod.POST, "/api/v1/providers/*/estimate").permitAll()

                // Public discovery, banners and banner analytics events
                .requestMatchers(HttpMethod.GET, "/api/v1/public/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/public/banners/*/impression", "/api/v1/public/banners/*/click").permitAll()

                .requestMatchers("/api/v1/customer/**").hasRole("CUSTOMER")
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/reviews").hasRole("CUSTOMER")
                .requestMatchers(
                    "/api/v1/bookings/**",
                    "/api/v1/notifications/**",
                    "/api/v1/media/**",
                    "/api/v1/payments/**"
                ).hasAnyRole(AUTHENTICATED_ROLES)

                .anyRequest().denyAll()
            )
            .addFilterBefore(clerkJwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(rateLimitFilter, ClerkJwtAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(allowedOrigins.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
