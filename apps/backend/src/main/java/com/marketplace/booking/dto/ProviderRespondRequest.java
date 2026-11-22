package com.marketplace.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderRespondRequest {

    @NotBlank(message = "Action is required (ACCEPT or REJECT)")
    private String action; // ACCEPT, REJECT

    private String rejectionReason;
}
