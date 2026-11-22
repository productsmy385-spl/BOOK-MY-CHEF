package com.marketplace.payments;

import com.marketplace.booking.Booking;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "razorpay_order_id", nullable = false, unique = true, length = 128)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", unique = true, length = 128)
    private String razorpayPaymentId;

    @Column(name = "payment_stage", nullable = false, length = 32)
    private String paymentStage; // ADVANCE_30, FULL_100, BALANCE_70

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "payment_method", length = 64)
    private String paymentMethod;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING"; // PENDING, ESCROW_HELD, CAPTURED, FAILED, REFUNDED

    @Column(name = "paid_at")
    private Instant paidAt;
}
