package com.marketplace.availability;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProviderAvailabilitySlotRepository extends JpaRepository<ProviderAvailabilitySlot, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ProviderAvailabilitySlot s WHERE s.provider.id = :providerId AND s.slotDate = :slotDate AND s.timeSlot = :timeSlot")
    Optional<ProviderAvailabilitySlot> findSlotForUpdate(
        @Param("providerId") UUID providerId,
        @Param("slotDate") LocalDate slotDate,
        @Param("timeSlot") String timeSlot
    );

    List<ProviderAvailabilitySlot> findByProviderIdAndSlotDateBetween(UUID providerId, LocalDate start, LocalDate end);

    List<ProviderAvailabilitySlot> findByProviderIdAndSlotDate(UUID providerId, LocalDate slotDate);

    void deleteByProviderIdAndSlotDate(UUID providerId, LocalDate slotDate);

    List<ProviderAvailabilitySlot> findByReservationStatusAndLockExpiresAtBefore(String reservationStatus, Instant cutoff);
}
