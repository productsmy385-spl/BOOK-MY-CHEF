package com.marketplace.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerFavouriteRepository extends JpaRepository<CustomerFavourite, UUID> {
    List<CustomerFavourite> findByUserId(UUID userId);
    Optional<CustomerFavourite> findByUserIdAndProviderId(UUID userId, UUID providerId);
    boolean existsByUserIdAndProviderId(UUID userId, UUID providerId);
    void deleteByUserIdAndProviderId(UUID userId, UUID providerId);
}
