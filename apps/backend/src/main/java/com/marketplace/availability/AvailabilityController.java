package com.marketplace.availability;

import com.marketplace.common.ApiResponse;
import com.marketplace.provider.ProviderProfile;
import com.marketplace.provider.ProviderProfileRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/availability")
@RequiredArgsConstructor
@Tag(name = "Availability & Calendar", description = "Provider calendar slots, date blocking, and real-time availability checks")
public class AvailabilityController {

    private final ProviderAvailabilitySlotRepository slotRepository;
    private final ProviderProfileRepository providerProfileRepository;

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get provider calendar slots for a date range")
    public ResponseEntity<ApiResponse<List<ProviderAvailabilitySlot>>> getSlots(
            @PathVariable UUID providerId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {

        LocalDate start = startDate != null ? startDate : LocalDate.now();
        LocalDate end = endDate != null ? endDate : start.plusMonths(1);

        List<ProviderAvailabilitySlot> slots = slotRepository.findByProviderIdAndSlotDateBetween(providerId, start, end);
        return ResponseEntity.ok(ApiResponse.ok(slots, "Availability slots retrieved"));
    }

    @PostMapping("/provider/{providerId}/block")
    @Transactional
    @Operation(summary = "Provider marks a date or slot as blocked / holiday")
    public ResponseEntity<ApiResponse<ProviderAvailabilitySlot>> blockSlot(
            @PathVariable UUID providerId,
            @RequestParam LocalDate date,
            @RequestParam(defaultValue = "FULL_DAY") String timeSlot) {

        ProviderProfile provider = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + providerId));

        ProviderAvailabilitySlot slot = ProviderAvailabilitySlot.builder()
                .provider(provider)
                .slotDate(date)
                .timeSlot(timeSlot)
                .status("BLOCKED")
                .reservationStatus("NONE")
                .build();

        ProviderAvailabilitySlot saved = slotRepository.save(slot);
        return ResponseEntity.ok(ApiResponse.ok(saved, "Date successfully marked as blocked"));
    }
}
