package com.marketplace.availability;

import com.marketplace.provider.ProviderProfile;
import com.marketplace.provider.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingSlotLockService {

    private final ProviderAvailabilitySlotRepository slotRepository;
    private final ProviderProfileRepository providerProfileRepository;

    /**
     * Acquires a pessimistic write lock on the provider's calendar slot to prevent double-booking.
     */
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public boolean lockSlotForPayment(UUID providerId, LocalDate date, String timeSlot, UUID bookingId) {
        Optional<ProviderAvailabilitySlot> slotOpt = slotRepository.findSlotForUpdate(providerId, date, timeSlot);

        ProviderAvailabilitySlot slot;
        if (slotOpt.isEmpty()) {
            ProviderProfile provider = providerProfileRepository.findById(providerId).orElse(null);
            if (provider == null) return false;
            slot = ProviderAvailabilitySlot.builder()
                    .provider(provider)
                    .slotDate(date)
                    .timeSlot(timeSlot)
                    .status("AVAILABLE")
                    .reservationStatus("NONE")
                    .build();
        } else {
            slot = slotOpt.get();
        }

        if ("BOOKED".equals(slot.getStatus()) || "BLOCKED".equals(slot.getStatus())) {
            return false;
        }

        if ("LOCKED_PENDING_PAYMENT".equals(slot.getReservationStatus()) &&
            slot.getLockExpiresAt() != null &&
            slot.getLockExpiresAt().isAfter(Instant.now())) {
            return false; // Already locked by another host
        }

        // Lock slot for 15 minutes lease
        slot.setStatus("RESERVED");
        slot.setReservationStatus("LOCKED_PENDING_PAYMENT");
        slot.setLockExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        slot.setLockedByBookingId(bookingId);
        slotRepository.save(slot);

        log.info("Locked slot for provider {} on {} slot {} (lease 15 min)", providerId, date, timeSlot);
        return true;
    }

    public boolean lockSlot(UUID providerId, LocalDate date, String timeSlot, UUID bookingId) {
        return lockSlotForPayment(providerId, date, timeSlot, bookingId);
    }

    /**
     * Confirms the locked slot permanently upon successful advance payment.
     */
    @Transactional
    public void confirmSlotPermanent(UUID slotId) {
        slotRepository.findById(slotId).ifPresent(slot -> {
            slot.setStatus("BOOKED");
            slot.setReservationStatus("NONE");
            slot.setLockExpiresAt(null);
            slotRepository.save(slot);
        });
    }

    /**
     * Scheduled worker releasing expired payment leases every 60 seconds.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void releaseExpiredSlotLocks() {
        List<ProviderAvailabilitySlot> expired = slotRepository
            .findByReservationStatusAndLockExpiresAtBefore("LOCKED_PENDING_PAYMENT", Instant.now());

        for (ProviderAvailabilitySlot slot : expired) {
            slot.setStatus("AVAILABLE");
            slot.setReservationStatus("NONE");
            slot.setLockExpiresAt(null);
            slot.setLockedByBookingId(null);
        }
        if (!expired.isEmpty()) {
            slotRepository.saveAll(expired);
            log.info("Released {} expired slot reservation locks", expired.size());
        }
    }
}
