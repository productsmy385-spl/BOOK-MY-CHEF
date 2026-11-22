package com.marketplace.provider;

import com.marketplace.identity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "provider_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "professional_name", nullable = false, length = 150)
    private String professionalName;

    @Column(name = "business_name", length = 150)
    private String businessName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "experience_years", nullable = false)
    @Builder.Default
    private Integer experienceYears = 0;

    @Column(name = "avatar_url", length = 1024)
    private String avatarUrl;

    @Column(name = "cover_image_url", length = 1024)
    private String coverImageUrl;

    @Column(name = "verification_status", nullable = false, length = 32)
    @Builder.Default
    private String verificationStatus = "PENDING";

    @Column(name = "is_accepting_bookings", nullable = false)
    @Builder.Default
    private Boolean isAcceptingBookings = true;

    @Column(name = "min_booking_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal minBookingAmount = BigDecimal.ZERO;

    @Column(name = "max_travel_distance_km", nullable = false)
    @Builder.Default
    private Integer maxTravelDistanceKm = 25;

    @Column(name = "base_latitude", precision = 9, scale = 6)
    private BigDecimal baseLatitude;

    @Column(name = "base_longitude", precision = 9, scale = 6)
    private BigDecimal baseLongitude;

    @Column(name = "fssai_license_number", length = 64)
    private String fssaiLicenseNumber;

    @Column(name = "fssai_expiry_date")
    private LocalDate fssaiExpiryDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "profile_completion")
    @Builder.Default
    private Integer profileCompletion = 90;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
