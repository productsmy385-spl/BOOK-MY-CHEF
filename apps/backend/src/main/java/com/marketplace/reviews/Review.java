package com.marketplace.reviews;

import com.marketplace.booking.Booking;
import com.marketplace.identity.User;
import com.marketplace.provider.ProviderProfile;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private ProviderProfile provider;

    @Column(name = "overall_rating", precision = 2, scale = 1, nullable = false)
    private BigDecimal overallRating;

    @Column(name = "food_taste_rating", precision = 2, scale = 1)
    private BigDecimal foodTasteRating;

    @Column(name = "hygiene_rating", precision = 2, scale = 1)
    private BigDecimal hygieneRating;

    @Column(name = "punctuality_rating", precision = 2, scale = 1)
    private BigDecimal punctualityRating;

    @Column(name = "hospitality_rating", precision = 2, scale = 1)
    private BigDecimal hospitalityRating;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @Column(name = "is_verified_booking", nullable = false)
    @Builder.Default
    private Boolean isVerifiedBooking = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
