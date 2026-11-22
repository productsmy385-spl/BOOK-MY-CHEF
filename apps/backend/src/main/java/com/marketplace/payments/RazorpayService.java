package com.marketplace.payments;

import com.marketplace.booking.Booking;
import com.marketplace.booking.BookingRepository;
import com.marketplace.booking.BookingStatus;
import com.marketplace.payments.dto.CreateOrderRequest;
import com.marketplace.payments.dto.PaymentOrderDto;
import com.marketplace.payments.dto.VerifyPaymentRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RazorpayService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${razorpay.key-id:rzp_test_bookmychef123}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:test_secret_key_placeholder}")
    private String razorpayKeySecret;

    @Transactional
    public PaymentOrderDto createOrder(CreateOrderRequest req) {
        Booking booking = bookingRepository.findById(req.getBookingId())
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + req.getBookingId()));

        String stage = req.getPaymentStage() != null ? req.getPaymentStage() : "ADVANCE_30";
        BigDecimal amount = "ADVANCE_30".equalsIgnoreCase(stage)
                ? (booking.getAdvanceAmount() != null ? booking.getAdvanceAmount() : booking.getEstimatedTotal().multiply(BigDecimal.valueOf(0.30)))
                : booking.getEstimatedTotal();

        String orderId = "order_" + Math.abs(RANDOM.nextLong()) + "bmc";

        Payment payment = Payment.builder()
                .booking(booking)
                .razorpayOrderId(orderId)
                .paymentStage(stage)
                .amount(amount)
                .currency("INR")
                .status("PENDING")
                .build();

        paymentRepository.save(payment);
        log.info("Created payment order: {} for booking: {}", orderId, booking.getId());

        return PaymentOrderDto.builder()
                .bookingId(booking.getId())
                .orderId(orderId)
                .amount(amount)
                .currency("INR")
                .keyId(razorpayKeyId)
                .customerName("Host Ananya Sharma")
                .customerEmail("ananya@gmail.com")
                .customerPhone("+919876543210")
                .build();
    }

    @Transactional
    public boolean verifyAndCapture(VerifyPaymentRequest req) {
        log.info("Verifying payment for order: {}, payment: {}", req.getRazorpayOrderId(), req.getRazorpayPaymentId());

        Payment payment = paymentRepository.findByRazorpayOrderId(req.getRazorpayOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Payment record not found for order: " + req.getRazorpayOrderId()));

        // Idempotency: prevent duplicate transaction processing
        if ("ESCROW_HELD".equals(payment.getStatus()) || "COMPLETED".equals(payment.getStatus())) {
            log.info("Payment order {} is already captured and held in escrow.", req.getRazorpayOrderId());
            return true;
        }

        // Validate HMAC-SHA256 signature
        boolean signatureValid = verifyHmacSha256(
                req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId(),
                req.getRazorpaySignature(),
                razorpayKeySecret
        );

        if (!signatureValid) {
            log.error("CRITICAL SECURITY: Invalid payment signature for order: {}. Transaction rejected.", req.getRazorpayOrderId());
            throw new SecurityException("Payment signature verification failed. Untrusted payment payload rejected.");
        }

        payment.setRazorpayPaymentId(req.getRazorpayPaymentId());
        payment.setStatus("ESCROW_HELD");
        payment.setPaidAt(Instant.now());
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setPaymentStatus("ESCROW_HELD");
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        log.info("Escrow locked. Booking {} transitioned to CONFIRMED.", booking.getBookingReference());
        return true;
    }

    public boolean verifyHmacSha256(String data, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String generatedSignature = HexFormat.of().formatHex(hash);
            return generatedSignature.equalsIgnoreCase(signature);
        } catch (Exception e) {
            log.error("HMAC SHA256 error: {}", e.getMessage());
            return false;
        }
    }
}
