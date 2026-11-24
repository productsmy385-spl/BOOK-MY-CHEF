package com.marketplace.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window, per-client rate limiting for authentication and write-heavy
 * endpoints. In-memory is sufficient for a single backend instance; if the API
 * is scaled horizontally this should move to a shared store.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000;

    private final int authLimit;
    private final int writeLimit;
    private final int searchLimit;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public RateLimitFilter(@Value("${app.rate-limit.auth-per-minute:20}") int authLimit,
                           @Value("${app.rate-limit.write-per-minute:60}") int writeLimit,
                           @Value("${app.rate-limit.search-per-minute:120}") int searchLimit) {
        this.authLimit = authLimit;
        this.writeLimit = writeLimit;
        this.searchLimit = searchLimit;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String method = request.getMethod();

        Integer limit = null;
        String bucket = null;
        if (path.startsWith("/api/v1/auth/")) {
            limit = authLimit;
            bucket = "auth";
        } else if (path.startsWith("/api/v1/search/")) {
            limit = searchLimit;
            bucket = "search";
        } else if (path.startsWith("/api/v1/") && !HttpMethod.GET.matches(method)) {
            limit = writeLimit;
            bucket = "write";
        }

        if (limit != null) {
            String key = bucket + ":" + clientKey(request);
            long now = System.currentTimeMillis();
            Window w = windows.compute(key, (k, existing) ->
                    existing == null || now - existing.start >= WINDOW_MS ? new Window(now) : existing);
            if (w.count.incrementAndGet() > limit) {
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(Math.max(1, (WINDOW_MS - (now - w.start)) / 1000)));
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Too many requests. Please wait a moment and try again.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private String clientKey(HttpServletRequest request) {
        // Railway terminates TLS at its proxy and sets X-Forwarded-For; first hop is the client.
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Scheduled(fixedRate = 300_000)
    void evictStaleWindows() {
        long now = System.currentTimeMillis();
        windows.entrySet().removeIf(e -> now - e.getValue().start >= WINDOW_MS);
    }

    private static final class Window {
        final long start;
        final AtomicInteger count = new AtomicInteger();

        Window(long start) {
            this.start = start;
        }
    }
}
