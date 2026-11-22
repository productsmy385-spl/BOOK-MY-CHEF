package com.marketplace.provider;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, UUID> {
    Optional<ProviderProfile> findByUserId(UUID userId);
    List<ProviderProfile> findByVerificationStatus(String verificationStatus);

    @Query("SELECT p FROM ProviderProfile p WHERE p.isAcceptingBookings = true AND (:status IS NULL OR p.verificationStatus = :status)")
    List<ProviderProfile> findAllActiveProviders(@Param("status") String status);
}
