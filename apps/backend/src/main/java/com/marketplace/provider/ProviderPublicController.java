package com.marketplace.provider;

import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Provider profiles (public)")
public class ProviderPublicController {

    private final ProviderRepository providers;

    @GetMapping("/{id}")
    @Operation(summary = "Public profile of a published provider")
    public ResponseEntity<ApiResponse<Map<String, Object>>> get(@PathVariable UUID id) {
        if (!providers.isPubliclyListed(id)) {
            throw ApiException.notFound("Provider");
        }
        return ResponseEntity.ok(ApiResponse.ok(providers.detail(id, false)));
    }
}
