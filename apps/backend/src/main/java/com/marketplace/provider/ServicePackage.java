package com.marketplace.provider;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "service_packages")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServicePackage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "min_guests", nullable = false)
    @Builder.Default
    private Integer minGuests = 5;

    @Column(name = "max_guests", nullable = false)
    @Builder.Default
    private Integer maxGuests = 200;

    @Column(name = "is_customizable", nullable = false)
    @Builder.Default
    private Boolean isCustomizable = true;
}
