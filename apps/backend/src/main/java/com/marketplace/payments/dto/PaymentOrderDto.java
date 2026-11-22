package com.marketplace.payments.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrderDto {
    private UUID bookingId;
    private String orderId;
    private BigDecimal amount;
    private String currency;
    private String keyId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
