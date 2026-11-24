package com.marketplace.catalog;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Static marketplace taxonomy: which service categories exist, how they are
 * grouped, which pricing models and delivery modes each one may use. The
 * database CHECK constraints (V6) mirror these codes.
 */
public final class ServiceCatalog {

    private ServiceCatalog() {
    }

    public record Category(String code, String label, String group, boolean culinary,
                           List<String> pricingModels, List<String> deliveryModes) {
    }

    public record Option(String code, String label) {
    }

    private static final List<String> CHEF_PRICING = List.of("PER_PERSON", "PER_HOUR", "PER_DAY", "PER_EVENT", "CUSTOM_QUOTE");
    private static final List<String> CHEF_MODES = List.of("CHEF_VISITS_HOME", "PROVIDER_KITCHEN", "COOK_AND_DELIVER", "VENUE_BANQUET");

    public static final List<Category> CATEGORIES = List.of(
        new Category("HOME_CHEF", "Home Chef", "CULINARY", true, CHEF_PRICING, CHEF_MODES),
        new Category("PRO_CHEF", "Professional Chef", "CULINARY", true, CHEF_PRICING, CHEF_MODES),
        new Category("PERSONAL_CHEF", "Personal & Private Dining Chef", "CULINARY", true, CHEF_PRICING, List.of("CHEF_VISITS_HOME", "VENUE_BANQUET")),
        new Category("CATERER", "Catering", "CULINARY", true,
            List.of("PER_PLATE", "PER_PERSON", "PER_100_GUESTS", "PER_PACKAGE", "CUSTOM_QUOTE"),
            List.of("COOK_AND_DELIVER", "VENUE_BANQUET")),
        new Category("EVENT_PLANNER", "Event Planner", "EVENTS", false, List.of("PER_EVENT", "PER_PACKAGE", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("WEDDING_PLANNER", "Wedding Planner", "EVENTS", false, List.of("PER_EVENT", "PER_PACKAGE", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("EVENT_MANAGER", "Event Manager", "EVENTS", false, List.of("PER_EVENT", "PER_DAY", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("DECORATOR", "Decoration", "EVENTS", false, List.of("PER_SETUP", "PER_EVENT", "PER_PACKAGE", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("PHOTOGRAPHER", "Photography", "MEDIA", false, List.of("PER_HOUR", "PER_DAY", "PER_EVENT", "PER_PACKAGE", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("VIDEOGRAPHER", "Videography", "MEDIA", false, List.of("PER_HOUR", "PER_DAY", "PER_EVENT", "PER_PACKAGE", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("BARTENDER", "Bartender", "STAFF", false, List.of("PER_HOUR", "PER_EVENT", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("WAITER", "Serving Staff", "STAFF", false, List.of("PER_HOUR", "PER_DAY", "PER_EVENT", "CUSTOM_QUOTE"), List.of("ON_SITE")),
        new Category("KITCHEN_ASSISTANT", "Kitchen Assistant", "STAFF", false, List.of("PER_HOUR", "PER_DAY", "CUSTOM_QUOTE"), List.of("ON_SITE"))
    );

    public static final List<Option> GROUPS = List.of(
        new Option("CULINARY", "Food & chefs"),
        new Option("EVENTS", "Event planning & décor"),
        new Option("MEDIA", "Photo & video"),
        new Option("STAFF", "Event staff")
    );

    public static final Map<String, String> PRICING_LABELS = orderedMap(
        "PER_PERSON", "per person",
        "PER_PLATE", "per plate",
        "PER_HOUR", "per hour",
        "PER_DAY", "per day",
        "PER_EVENT", "per event",
        "PER_100_GUESTS", "per 100 guests",
        "PER_PACKAGE", "per package",
        "PER_SETUP", "per setup",
        "CUSTOM_QUOTE", "custom quote"
    );

    public static final Map<String, String> DELIVERY_MODE_LABELS = orderedMap(
        "CHEF_VISITS_HOME", "Cooks at your home",
        "PROVIDER_KITCHEN", "Cooks in own kitchen, you collect",
        "COOK_AND_DELIVER", "Prepares and delivers",
        "VENUE_BANQUET", "Serves at your event venue",
        "ON_SITE", "On-site at your event"
    );

    public static Optional<Category> find(String code) {
        if (code == null) return Optional.empty();
        return CATEGORIES.stream().filter(c -> c.code().equals(code)).findFirst();
    }

    public static boolean isCategory(String code) {
        return find(code).isPresent();
    }

    /** Pricing models whose price scales with the number of guests. */
    public static boolean isPerGuest(String pricingModel) {
        return "PER_PERSON".equals(pricingModel) || "PER_PLATE".equals(pricingModel);
    }

    /**
     * Estimated price for a request, or null when the service is quoted on request.
     * hours/days default to 1 when the pricing model needs them but they were not given.
     */
    public static BigDecimal estimate(String pricingModel, BigDecimal amount, int guests, Integer hours, Integer days) {
        if (amount == null || pricingModel == null || "CUSTOM_QUOTE".equals(pricingModel)) return null;
        BigDecimal multiplier = switch (pricingModel) {
            case "PER_PERSON", "PER_PLATE" -> BigDecimal.valueOf(guests);
            case "PER_100_GUESTS" -> BigDecimal.valueOf((guests + 99) / 100);
            case "PER_HOUR" -> BigDecimal.valueOf(hours != null && hours > 0 ? hours : 1);
            case "PER_DAY" -> BigDecimal.valueOf(days != null && days > 0 ? days : 1);
            default -> BigDecimal.ONE; // PER_EVENT, PER_PACKAGE, PER_SETUP
        };
        return amount.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    private static Map<String, String> orderedMap(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
        return java.util.Collections.unmodifiableMap(m);
    }
}
