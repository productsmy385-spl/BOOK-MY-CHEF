package com.marketplace.booking;

import com.marketplace.availability.BookingSlotLockService;
import com.marketplace.booking.dto.*;
import com.marketplace.identity.User;
import com.marketplace.identity.UserRepository;
import com.marketplace.provider.ProviderProfile;
import com.marketplace.provider.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final com.marketplace.identity.UserProfileRepository userProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;
    private final BookingSlotLockService slotLockService;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public BookingResponseDto createBooking(UUID customerId, CreateBookingRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        ProviderProfile provider = providerProfileRepository.findById(req.getProviderId())
                .orElseThrow(() -> new IllegalArgumentException("Provider not found: " + req.getProviderId()));

        String reference = "#BMC-" + (1000 + RANDOM.nextInt(9000)) + "-HYD";
        BigDecimal estimated = req.getEstimatedTotal() != null ? req.getEstimatedTotal() : BigDecimal.valueOf(3500);

        Booking booking = Booking.builder()
                .bookingReference(reference)
                .customer(customer)
                .provider(provider)
                .bookingStatus(BookingStatus.PENDING_PROVIDER_CONFIRMATION)
                .paymentStatus("PENDING")
                .eventDate(req.getEventDate())
                .timeSlot(req.getTimeSlot())
                .guestCount(req.getGuestCount())
                .serviceDeliveryMode(req.getServiceDeliveryMode())
                .estimatedTotal(estimated)
                .finalAmount(estimated)
                .advanceAmount(estimated.multiply(BigDecimal.valueOf(0.30)).setScale(2, RoundingMode.HALF_UP))
                .balanceAmount(estimated.multiply(BigDecimal.valueOf(0.70)).setScale(2, RoundingMode.HALF_UP))
                .hostSpecialInstructions(req.getHostSpecialInstructions())
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Created booking reference: {} with id: {}", reference, saved.getId());
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public BookingResponseDto getBookingById(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));
        return mapToDto(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getCustomerBookings(UUID customerId) {
        return bookingRepository.findByCustomerId(customerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingResponseDto> getProviderBookings(UUID providerId) {
        return bookingRepository.findByProviderId(providerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponseDto respondToBooking(UUID providerId, UUID bookingId, ProviderRespondRequest req) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        if (!booking.getProvider().getId().equals(providerId)) {
            throw new SecurityException("Unauthorized provider for booking: " + bookingId);
        }

        if ("ACCEPT".equalsIgnoreCase(req.getAction())) {
            booking.setBookingStatus(BookingStatus.PROVIDER_ACCEPTED);
        } else {
            booking.setBookingStatus(BookingStatus.PROVIDER_REJECTED);
        }

        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingResponseDto submitQuotation(UUID providerId, UUID bookingId, QuotationRequest req) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        if (!booking.getProvider().getId().equals(providerId)) {
            throw new SecurityException("Unauthorized provider for booking: " + bookingId);
        }

        BigDecimal calculatedTotal = req.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity() != null ? item.getQuantity() : 1)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        booking.setFinalAmount(calculatedTotal);
        booking.setAdvanceAmount(calculatedTotal.multiply(BigDecimal.valueOf(0.30)).setScale(2, RoundingMode.HALF_UP));
        booking.setBalanceAmount(calculatedTotal.multiply(BigDecimal.valueOf(0.70)).setScale(2, RoundingMode.HALF_UP));
        booking.setBookingStatus(BookingStatus.QUOTATION_SENT);

        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingResponseDto lockAndCheckout(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        // Enforce pessimistic write lock on provider's calendar slot
        slotLockService.lockSlot(
                booking.getProvider().getId(),
                booking.getEventDate(),
                booking.getTimeSlot(),
                booking.getId()
        );

        booking.setBookingStatus(BookingStatus.PENDING_PAYMENT);
        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingResponseDto updateEventChecklist(UUID bookingId, EventChecklistRequest req) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        String step = req.getStatusStep().toUpperCase();
        switch (step) {
            case "EN_ROUTE", "ARRIVED", "COOKING_STARTED", "FOOD_SERVED" -> booking.setBookingStatus(BookingStatus.IN_PROGRESS);
            case "COMPLETED" -> booking.setBookingStatus(BookingStatus.COMPLETED);
            default -> log.warn("Unmapped status step: {}", step);
        }

        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingResponseDto completeBookingAndReleaseEscrow(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        booking.setBookingStatus(BookingStatus.COMPLETED);
        booking.setPaymentStatus("CAPTURED");
        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingResponseDto updateStatus(UUID bookingId, String status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));
        try {
            BookingStatus newStatus = BookingStatus.valueOf(status.toUpperCase());
            booking.setBookingStatus(newStatus);
            if (newStatus == BookingStatus.CONFIRMED) {
                booking.setPaymentStatus("ESCROW_LOCKED");
            } else if (newStatus == BookingStatus.COMPLETED) {
                booking.setPaymentStatus("CAPTURED");
            } else if (newStatus == BookingStatus.CANCELLED) {
                booking.setPaymentStatus("REFUNDED");
            }
        } catch (IllegalArgumentException e) {
            log.warn("Unrecognized booking status: {}", status);
        }
        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    @Transactional
    public BookingResponseDto cancelBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));
        booking.setBookingStatus(BookingStatus.CANCELLED);
        booking.setPaymentStatus("REFUNDED");
        Booking saved = bookingRepository.save(booking);
        return mapToDto(saved);
    }

    private BookingResponseDto mapToDto(Booking b) {
        String custName = "Valued Host";
        String custPhone = "+919876543210";
        if (b.getCustomer() != null) {
            if (b.getCustomer().getPhone() != null) {
                custPhone = b.getCustomer().getPhone();
            }
            custName = userProfileRepository.findByUserId(b.getCustomer().getId())
                    .map(com.marketplace.identity.UserProfile::getFullName)
                    .orElse(b.getCustomer().getEmail() != null ? b.getCustomer().getEmail() : "Host");
        }

        String provName = "Culinary Atelier";
        String provPhone = "+919876543210";
        if (b.getProvider() != null) {
            provName = b.getProvider().getProfessionalName();
            if (b.getProvider().getUser() != null && b.getProvider().getUser().getPhone() != null) {
                provPhone = b.getProvider().getUser().getPhone();
            }
        }

        return BookingResponseDto.builder()
                .id(b.getId())
                .bookingReference(b.getBookingReference())
                .customerId(b.getCustomer() != null ? b.getCustomer().getId() : null)
                .customerName(custName)
                .customerPhone(custPhone)
                .providerId(b.getProvider() != null ? b.getProvider().getId() : null)
                .providerName(provName)
                .providerPhone(provPhone)
                .bookingStatus(b.getBookingStatus())
                .paymentStatus(b.getPaymentStatus())
                .eventDate(b.getEventDate())
                .timeSlot(b.getTimeSlot())
                .guestCount(b.getGuestCount())
                .serviceDeliveryMode(b.getServiceDeliveryMode())
                .estimatedTotal(b.getEstimatedTotal())
                .finalAmount(b.getFinalAmount())
                .advanceAmount(b.getAdvanceAmount())
                .balanceAmount(b.getBalanceAmount())
                .hostSpecialInstructions(b.getHostSpecialInstructions())
                .createdAt(b.getCreatedAt())
                .expiresAt(b.getCreatedAt() != null ? b.getCreatedAt().plus(15, ChronoUnit.MINUTES) : Instant.now().plus(15, ChronoUnit.MINUTES))
                .build();
    }
}
