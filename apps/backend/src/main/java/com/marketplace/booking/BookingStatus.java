package com.marketplace.booking;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Booking lifecycle. Names match the bookings.booking_status CHECK constraint.
 *
 * <pre>
 * PENDING_PROVIDER_CONFIRMATION (requested)
 *   ├─ provider accepts ─────────► PENDING_PAYMENT ─ payment ─► CONFIRMED   (payment required)
 *   │                         └──► CONFIRMED                                  (payment not required)
 *   ├─ provider quotes ──► QUOTATION_SENT ─ customer accepts ─► PENDING_PAYMENT / CONFIRMED
 *   │                                    └─ customer declines ─► CUSTOMER_CANCELLED
 *   ├─ provider rejects ─► PROVIDER_REJECTED
 *   ├─ no response in time / date passed ─► EXPIRED
 *   └─ customer cancels ─► CUSTOMER_CANCELLED
 * CONFIRMED ─ provider marks done (on/after event date) ─► COMPLETED
 * CONFIRMED / PENDING_PAYMENT ─ either side cancels ─► CUSTOMER_CANCELLED / PROVIDER_CANCELLED
 * </pre>
 */
public enum BookingStatus {
    PENDING_PROVIDER_CONFIRMATION,
    QUOTATION_SENT,
    PENDING_PAYMENT,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    PROVIDER_REJECTED,
    CUSTOMER_CANCELLED,
    PROVIDER_CANCELLED,
    EXPIRED,
    DISPUTED;

    /** Statuses that hold one of the provider's daily booking slots. */
    public static final Set<BookingStatus> OCCUPYING = EnumSet.of(PENDING_PAYMENT, CONFIRMED, IN_PROGRESS);

    /** Statuses in which the request is still open (awaiting someone's action). */
    public static final Set<BookingStatus> OPEN = EnumSet.of(PENDING_PROVIDER_CONFIRMATION, QUOTATION_SENT, PENDING_PAYMENT);

    private static final Map<BookingStatus, Set<BookingStatus>> TRANSITIONS = Map.of(
        PENDING_PROVIDER_CONFIRMATION, EnumSet.of(QUOTATION_SENT, PENDING_PAYMENT, CONFIRMED, PROVIDER_REJECTED, CUSTOMER_CANCELLED, EXPIRED),
        QUOTATION_SENT, EnumSet.of(QUOTATION_SENT, PENDING_PAYMENT, CONFIRMED, CUSTOMER_CANCELLED, PROVIDER_CANCELLED, EXPIRED),
        PENDING_PAYMENT, EnumSet.of(CONFIRMED, CUSTOMER_CANCELLED, PROVIDER_CANCELLED, EXPIRED),
        CONFIRMED, EnumSet.of(IN_PROGRESS, COMPLETED, CUSTOMER_CANCELLED, PROVIDER_CANCELLED, DISPUTED),
        IN_PROGRESS, EnumSet.of(COMPLETED, DISPUTED)
    );

    public boolean canTransitionTo(BookingStatus next) {
        return TRANSITIONS.getOrDefault(this, Set.of()).contains(next);
    }

    public static String sqlList(Set<BookingStatus> statuses) {
        return statuses.stream().map(s -> "'" + s.name() + "'").reduce((a, b) -> a + "," + b).orElse("''");
    }
}
