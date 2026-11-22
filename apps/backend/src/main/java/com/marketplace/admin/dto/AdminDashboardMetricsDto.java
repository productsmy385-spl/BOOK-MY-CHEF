package com.marketplace.admin.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardMetricsDto {
    private BigDecimal totalGmv;
    private BigDecimal netCommissionRevenue;
    private Long activeBookingsCount;
    private Long activeProvidersCount;
    private Long pendingVerificationsCount;
    private Double disputeRatePercentage;
}
