package com.marketplace.payments;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.booking.BookingStatus;
import com.marketplace.common.ApiException;
import com.marketplace.common.ApiResponse;
import com.marketplace.identity.AuthenticatedUserPrincipal;
import com.marketplace.notification.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Online payment via Razorpay. Used only when the platform setting
 * booking.payment_required is true. Without RAZORPAY_KEY_ID/SECRET the
 * endpoints answer "not configured" rather than simulating a payment.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments")
public class PaymentController {

    private final NamedParameterJdbcTemplate jdbc;
    private final NotificationService notifications;
    private final ObjectMapper objectMapper;
    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final RestClient razorpay;

    public PaymentController(NamedParameterJdbcTemplate jdbc, NotificationService notifications, ObjectMapper objectMapper,
                             @Value("${razorpay.key-id:}") String keyId,
                             @Value("${razorpay.key-secret:}") String keySecret,
                             @Value("${razorpay.webhook-secret:}") String webhookSecret) {
        this.jdbc = jdbc;
        this.notifications = notifications;
        this.objectMapper = objectMapper;
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.razorpay = RestClient.builder()
                .baseUrl("https://api.razorpay.com/v1")
                .defaultHeaders(h -> h.setBasicAuth(keyId, keySecret))
                .build();
    }

    private boolean configured() {
        return !keyId.isBlank() && !keySecret.isBlank();
    }

    @GetMapping("/config")
    public ApiResponse<Map<String, Object>> config() {
        return ApiResponse.ok(Map.of("enabled", configured(), "keyId", configured() ? keyId : ""));
    }

    public record OrderRequest(@NotNull UUID bookingId) {
    }

    @PostMapping("/orders")
    @Transactional
    public ApiResponse<Map<String, Object>> createOrder(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                        @Valid @RequestBody OrderRequest r) {
        if (!configured()) throw ApiException.unavailable("Online payments are not set up yet. The provider will contact you about payment.");
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT booking_reference, booking_status, final_amount FROM bookings
                WHERE id = :id AND customer_id = :cid FOR UPDATE""", Map.of("id", r.bookingId(), "cid", u.getUserId()));
        if (rows.isEmpty()) throw ApiException.notFound("Booking");
        Map<String, Object> b = rows.get(0);
        if (!BookingStatus.PENDING_PAYMENT.name().equals(b.get("booking_status"))) {
            throw ApiException.conflict("This booking is not awaiting payment.");
        }
        BigDecimal amount = (BigDecimal) b.get("final_amount");
        long paise = amount.movePointRight(2).longValueExact();
        JsonNode order;
        try {
            order = razorpay.post().uri("/orders").contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("amount", paise, "currency", "INR", "receipt", b.get("booking_reference")))
                    .retrieve().body(JsonNode.class);
        } catch (RestClientResponseException e) {
            log.error("Razorpay order creation failed: HTTP {}", e.getStatusCode().value());
            throw ApiException.unavailable("The payment gateway could not start this payment. Please try again.");
        }
        String orderId = order.path("id").asText();
        jdbc.update("""
                INSERT INTO payments (booking_id, razorpay_order_id, payment_stage, amount, currency, status)
                VALUES (:bid, :oid, 'FULL_100', :amt, 'INR', 'PENDING')""",
                Map.of("bid", r.bookingId(), "oid", orderId, "amt", amount));
        return ApiResponse.ok(Map.of("orderId", orderId, "amount", paise, "currency", "INR", "keyId", keyId,
                "reference", b.get("booking_reference")));
    }

    public record VerifyRequest(@NotBlank String orderId, @NotBlank String paymentId, @NotBlank String signature) {
    }

    @PostMapping("/verify")
    @Transactional
    public ApiResponse<Map<String, Object>> verify(@AuthenticationPrincipal AuthenticatedUserPrincipal u,
                                                   @Valid @RequestBody VerifyRequest r) {
        if (!configured()) throw ApiException.unavailable("Online payments are not set up.");
        String expected = hmacHex(keySecret, r.orderId() + "|" + r.paymentId());
        if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), r.signature().getBytes(StandardCharsets.UTF_8))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment could not be verified.");
        }
        List<UUID> owned = jdbc.queryForList("""
                SELECT p.booking_id FROM payments p JOIN bookings b ON b.id = p.booking_id
                WHERE p.razorpay_order_id = :oid AND b.customer_id = :cid""", Map.of("oid", r.orderId(), "cid", u.getUserId()), UUID.class);
        if (owned.isEmpty()) throw ApiException.notFound("Payment");
        markPaid(r.orderId(), r.paymentId());
        return ApiResponse.ok(Map.of("bookingId", owned.get(0)), "Payment received. Your booking is confirmed.");
    }

    @PostMapping("/webhook")
    @Transactional
    public ResponseEntity<String> webhook(@RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
                                          @RequestBody String payload) throws Exception {
        if (webhookSecret.isBlank()) return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("not configured");
        if (signature == null || !MessageDigest.isEqual(hmacHex(webhookSecret, payload).getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("invalid signature");
        }
        JsonNode root = objectMapper.readTree(payload);
        if ("payment.captured".equals(root.path("event").asText())) {
            JsonNode p = root.path("payload").path("payment").path("entity");
            markPaid(p.path("order_id").asText(), p.path("id").asText());
        }
        return ResponseEntity.ok("ok");
    }

    /** Idempotent: a payment already marked captured is left as is. */
    private void markPaid(String orderId, String paymentId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT p.id, p.status, p.booking_id, b.booking_status, b.booking_reference, b.customer_id, pp.user_id AS provider_user
                FROM payments p JOIN bookings b ON b.id = p.booking_id JOIN provider_profiles pp ON pp.id = b.provider_id
                WHERE p.razorpay_order_id = :oid FOR UPDATE OF p, b""", Map.of("oid", orderId));
        if (rows.isEmpty()) return;
        Map<String, Object> row = rows.get(0);
        if ("CAPTURED".equals(row.get("status"))) return;
        jdbc.update("UPDATE payments SET status = 'CAPTURED', razorpay_payment_id = :pid, paid_at = now() WHERE id = :id",
                Map.of("pid", paymentId, "id", row.get("id")));
        if (BookingStatus.PENDING_PAYMENT.name().equals(row.get("booking_status"))) {
            jdbc.update("UPDATE bookings SET booking_status = 'CONFIRMED', payment_status = 'CAPTURED', updated_at = now() WHERE id = :id",
                    Map.of("id", row.get("booking_id")));
            jdbc.update("""
                    INSERT INTO booking_status_history (booking_id, from_status, to_status, transition_reason)
                    VALUES (:id, 'PENDING_PAYMENT', 'CONFIRMED', 'Payment received')""", Map.of("id", row.get("booking_id")));
            notifications.notify((UUID) row.get("provider_user"), "BOOKING_CONFIRMED", "Booking confirmed",
                    "Payment received for " + row.get("booking_reference") + ".", "/provider/bookings/" + row.get("booking_id"));
        }
    }

    private static String hmacHex(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
