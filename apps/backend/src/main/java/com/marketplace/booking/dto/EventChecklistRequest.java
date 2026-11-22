package com.marketplace.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventChecklistRequest {

    @NotBlank(message = "Status step is required")
    private String statusStep; // EN_ROUTE, ARRIVED, COOKING_STARTED, FOOD_SERVED, COMPLETED

    private BigDecimal latitude;
    private BigDecimal longitude;
    private String arrivalOtp;
}
