package com.marketplace.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "Provider ID is required")
    private UUID providerId;

    private UUID serviceId;

    private String eventType;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    @NotNull(message = "Time slot is required")
    private String timeSlot; // LUNCH, DINNER

    @NotNull(message = "Guest count is required")
    private Integer guestCount;

    @NotNull(message = "Service delivery mode is required")
    private String serviceDeliveryMode;

    private UUID venueAddressId;
    private String dietaryPreference;
    private String spiceLevel;
    private String hostSpecialInstructions;
    private BigDecimal estimatedTotal;
}
