package com.marketplace.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ClerkJwtAuthenticationFilter clerkJwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                .contentTypeOptions(HeadersConfigurer.ContentTypeOptionsConfig::disable)
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
            )
            .authorizeHttpRequests(auth -> auth
                // Public Documentation & Health Endpoints
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll()

                // Public Webhooks (Protected via cryptographic HMAC signatures in controllers)
                .requestMatchers(
                    "/api/v1/auth/webhook",
                    "/api/v1/payments/webhook"
                ).permitAll()

                // Public Discovery & Catalog APIs (Read-Only)
                .requestMatchers(HttpMethod.GET,
                    "/api/v1/providers/**",
                    "/api/v1/availability/**",
                    "/api/v1/reviews/**"
                ).permitAll()

                // Public Auth Sync & User Profile Read
                .requestMatchers(
                    "/api/v1/auth/sync",
                    "/api/v1/auth/me"
                ).permitAll()

                // Platform Administrator APIs: Strictly ADMIN only
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

                // Provider-Specific Operations
                .requestMatchers(
                    "/api/v1/providers/profile",
                    "/api/v1/bookings/*/respond",
                    "/api/v1/bookings/*/quotation"
                ).hasAnyRole("PROVIDER", "ADMIN")

                // All other operations require authenticated token
                .anyRequest().authenticated()
            )
            .addFilterBefore(clerkJwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Strict production origin patterns (Disallowing wildcard with credentials)
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "https://*.up.railway.app",
            "https://*.railway.app"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "X-Mock-User-Id"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
