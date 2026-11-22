package com.marketplace.availability;

import com.marketplace.provider.ProviderProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(
    name = "provider_availability_slots",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider_id", "slot_date", "time_slot"})
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderAvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "time_slot", nullable = false, length = 32)
    private String timeSlot; // 'BREAKFAST', 'LUNCH', 'HIGH_TEA', 'DINNER', 'FULL_DAY'

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "AVAILABLE"; // 'AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED'

    @Column(name = "reservation_status", nullable = false, length = 32)
    @Builder.Default
    private String reservationStatus = "NONE"; // 'NONE', 'LOCKED_PENDING_PAYMENT'

    @Column(name = "lock_expires_at")
    private Instant lockExpiresAt;

    @Column(name = "locked_by_booking_id")
    private UUID lockedByBookingId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
