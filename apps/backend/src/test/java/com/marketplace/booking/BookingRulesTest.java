package com.marketplace.booking;

import com.marketplace.catalog.ServiceCatalog;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class BookingRulesTest {

    @Test
    void requestCanBeAcceptedQuotedRejectedCancelledOrExpired() {
        BookingStatus s = BookingStatus.PENDING_PROVIDER_CONFIRMATION;
        assertThat(s.canTransitionTo(BookingStatus.CONFIRMED)).isTrue();
        assertThat(s.canTransitionTo(BookingStatus.QUOTATION_SENT)).isTrue();
        assertThat(s.canTransitionTo(BookingStatus.PROVIDER_REJECTED)).isTrue();
        assertThat(s.canTransitionTo(BookingStatus.CUSTOMER_CANCELLED)).isTrue();
        assertThat(s.canTransitionTo(BookingStatus.EXPIRED)).isTrue();
        assertThat(s.canTransitionTo(BookingStatus.COMPLETED)).isFalse();
    }

    @Test
    void terminalStatusesCannotMove() {
        for (BookingStatus terminal : new BookingStatus[]{BookingStatus.COMPLETED, BookingStatus.PROVIDER_REJECTED,
                BookingStatus.CUSTOMER_CANCELLED, BookingStatus.PROVIDER_CANCELLED, BookingStatus.EXPIRED}) {
            for (BookingStatus next : BookingStatus.values()) {
                assertThat(terminal.canTransitionTo(next)).as(terminal + " -> " + next).isFalse();
            }
        }
    }

    @Test
    void onlyConfirmedWorkCanComplete() {
        assertThat(BookingStatus.CONFIRMED.canTransitionTo(BookingStatus.COMPLETED)).isTrue();
        assertThat(BookingStatus.PENDING_PAYMENT.canTransitionTo(BookingStatus.COMPLETED)).isFalse();
        assertThat(BookingStatus.QUOTATION_SENT.canTransitionTo(BookingStatus.COMPLETED)).isFalse();
    }

    @Test
    void occupyingStatusesHoldTheDate() {
        assertThat(BookingStatus.OCCUPYING).containsExactlyInAnyOrder(
                BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS);
    }

    @Test
    void estimatesFollowThePricingModel() {
        BigDecimal p = new BigDecimal("500");
        assertThat(ServiceCatalog.estimate("PER_PERSON", p, 20, null, null)).isEqualByComparingTo("10000");
        assertThat(ServiceCatalog.estimate("PER_PLATE", p, 120, null, null)).isEqualByComparingTo("60000");
        assertThat(ServiceCatalog.estimate("PER_100_GUESTS", p, 150, null, null)).isEqualByComparingTo("1000");
        assertThat(ServiceCatalog.estimate("PER_HOUR", p, 20, 4, null)).isEqualByComparingTo("2000");
        assertThat(ServiceCatalog.estimate("PER_DAY", p, 20, null, 2)).isEqualByComparingTo("1000");
        assertThat(ServiceCatalog.estimate("PER_EVENT", p, 500, null, null)).isEqualByComparingTo("500");
        assertThat(ServiceCatalog.estimate("CUSTOM_QUOTE", null, 20, null, null)).isNull();
    }

    @Test
    void everyCategoryAllowsACustomQuote() {
        ServiceCatalog.CATEGORIES.forEach(c -> assertThat(c.pricingModels()).as(c.code()).contains("CUSTOM_QUOTE"));
    }
}
