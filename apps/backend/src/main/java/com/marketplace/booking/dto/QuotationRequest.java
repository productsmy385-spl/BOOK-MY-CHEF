package com.marketplace.booking.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationRequest {
    private List<QuotationItemDto> items;
    private String providerNotes;
}
