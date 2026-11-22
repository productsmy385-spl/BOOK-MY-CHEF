package com.marketplace.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycVerificationRequest {

    @NotBlank(message = "Decision is required (APPROVE or REJECT)")
    private String decision; // APPROVE, REJECT

    private String remarks;
}
