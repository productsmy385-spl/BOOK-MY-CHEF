package com.marketplace.event;

import com.marketplace.catalog.ServiceCatalog;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EventRulesTest {

    @Test
    void everySuggestedServiceIsARealCategory() {
        EventCatalog.TYPES.forEach(t -> t.suggested().forEach(c ->
                assertThat(ServiceCatalog.isCategory(c)).as(t.code() + " suggests " + c).isTrue()));
    }

    @Test
    void weddingChecklistCoversFoodDecorAndPhotos() {
        assertThat(EventCatalog.find("WEDDING").orElseThrow().suggested())
                .contains("CATERER", "DECORATOR", "PHOTOGRAPHER");
        assertThat(EventCatalog.find("OTHER").orElseThrow().suggested()).isEmpty();
    }

    @Test
    void checklistItemStateFollowsItsBookings() {
        assertThat(EventService.needState(List.of())).isEqualTo("NOT_STARTED");
        assertThat(EventService.needState(List.of(Map.of("status", "PROVIDER_REJECTED")))).isEqualTo("NOT_STARTED");
        assertThat(EventService.needState(List.of(Map.of("status", "QUOTATION_SENT")))).isEqualTo("REQUESTED");
        assertThat(EventService.needState(List.of(Map.of("status", "PENDING_PROVIDER_CONFIRMATION"), Map.of("status", "CONFIRMED"))))
                .isEqualTo("BOOKED");
        assertThat(EventService.needState(List.of(Map.of("status", "COMPLETED")))).isEqualTo("BOOKED");
    }
}
