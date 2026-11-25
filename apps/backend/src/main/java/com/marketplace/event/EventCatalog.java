package com.marketplace.event;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Event types and the services each one usually needs. The suggestions are a
 * fixed, transparent rule set (not AI); customers add or remove services freely.
 * The V8 CHECK constraint on customer_events.event_type mirrors these codes.
 */
public final class EventCatalog {

    private EventCatalog() {
    }

    public record EventType(String code, String label, List<String> suggested) {
    }

    public static final List<EventType> TYPES = List.of(
        new EventType("WEDDING", "Wedding", List.of("CATERER", "WEDDING_PLANNER", "DECORATOR", "PHOTOGRAPHER", "VIDEOGRAPHER", "WAITER")),
        new EventType("ENGAGEMENT", "Engagement", List.of("CATERER", "DECORATOR", "PHOTOGRAPHER", "WAITER")),
        new EventType("BIRTHDAY", "Birthday party", List.of("HOME_CHEF", "DECORATOR", "PHOTOGRAPHER")),
        new EventType("HOUSEWARMING", "Housewarming", List.of("CATERER", "DECORATOR", "PHOTOGRAPHER")),
        new EventType("FAMILY_GATHERING", "Family gathering", List.of("HOME_CHEF", "WAITER")),
        new EventType("DINNER_PARTY", "Dinner party", List.of("PERSONAL_CHEF", "BARTENDER", "WAITER")),
        new EventType("CORPORATE", "Corporate event", List.of("CATERER", "EVENT_MANAGER", "PHOTOGRAPHER", "WAITER")),
        new EventType("FESTIVAL", "Festival / puja", List.of("CATERER", "DECORATOR")),
        new EventType("OTHER", "Other", List.of())
    );

    public static Optional<EventType> find(String code) {
        return TYPES.stream().filter(t -> t.code().equals(code)).findFirst();
    }

    public static Map<String, String> labels() {
        Map<String, String> m = new java.util.LinkedHashMap<>();
        TYPES.forEach(t -> m.put(t.code(), t.label()));
        return m;
    }
}
