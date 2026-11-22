package com.marketplace.booking;

import com.marketplace.identity.User;
import com.marketplace.provider.ProviderProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_reference", nullable = false, unique = true, length = 64)
    private String bookingReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status", nullable = false, length = 48)
    private BookingStatus bookingStatus;

    @Column(name = "payment_status", nullable = false, length = 32)
    @Builder.Default
    private String paymentStatus = "PENDING";

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "time_slot", nullable = false, length = 32)
    private String timeSlot;

    @Column(name = "guest_count", nullable = false)
    private Integer guestCount;

    @Column(name = "service_delivery_mode", nullable = false, length = 64)
    private String serviceDeliveryMode;

    @Column(name = "estimated_total", precision = 10, scale = 2, nullable = false)
    private BigDecimal estimatedTotal;

    @Column(name = "final_amount", precision = 10, scale = 2)
    private BigDecimal finalAmount;

    @Column(name = "advance_amount", precision = 10, scale = 2)
    private BigDecimal advanceAmount;

    @Column(name = "balance_amount", precision = 10, scale = 2)
    private BigDecimal balanceAmount;

    @Column(name = "host_special_instructions", columnDefinition = "TEXT")
    private String hostSpecialInstructions;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
