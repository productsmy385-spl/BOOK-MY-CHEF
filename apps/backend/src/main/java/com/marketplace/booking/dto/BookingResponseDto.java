package com.marketplace.booking.dto;

import com.marketplace.booking.BookingStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDto {
    private UUID id;
    private String bookingReference;
    private UUID customerId;
    private String customerName;
    private String customerPhone;
    private UUID providerId;
    private String providerName;
    private String providerPhone;
    private BookingStatus bookingStatus;
    private String paymentStatus;
    private LocalDate eventDate;
    private String timeSlot;
    private Integer guestCount;
    private String serviceDeliveryMode;
    private BigDecimal estimatedTotal;
    private BigDecimal finalAmount;
    private BigDecimal advanceAmount;
    private BigDecimal balanceAmount;
    private String hostSpecialInstructions;
    private Instant createdAt;
    private Instant expiresAt;
    private List<QuotationItemDto> quotationItems;
}
