package com.marketplace.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    List<Booking> findByCustomerId(UUID customerId);
    List<Booking> findByProviderId(UUID providerId);
    Optional<Booking> findByBookingReference(String bookingReference);
    List<Booking> findByBookingStatus(BookingStatus bookingStatus);
}
