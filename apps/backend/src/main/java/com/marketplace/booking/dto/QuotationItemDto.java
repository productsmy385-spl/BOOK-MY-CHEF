package com.marketplace.booking.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationItemDto {
    private String description;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal totalAmount;
}
