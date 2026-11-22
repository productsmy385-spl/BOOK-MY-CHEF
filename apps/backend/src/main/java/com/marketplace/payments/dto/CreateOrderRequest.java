package com.marketplace.payments.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    private String paymentStage; // ADVANCE_30, FULL_100, BALANCE_70
}
