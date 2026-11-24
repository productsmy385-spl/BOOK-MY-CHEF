package com.marketplace.menu;

import com.marketplace.catalog.ServiceCatalog;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Set;

/**
 * How a booking estimate combines the service price with a chosen menu.
 *
 * <ul>
 *   <li>No menu: the service price alone ({@link ServiceCatalog#estimate}).</li>
 *   <li>Service priced per person, per plate, per 100 guests or per package: that
 *       price already stands for the food, so the menu price <b>replaces</b> it.</li>
 *   <li>Service priced per hour, per day or per event (the provider's time): the
 *       menu is the food cost and is <b>added</b> to the service charge.</li>
 *   <li>Service priced on quotation: there is no estimate; the menu cost is shown
 *       as a guide and the provider sends a quotation.</li>
 * </ul>
 */
public final class MenuPricing {

    private MenuPricing() {
    }

    public enum Mode { SERVICE_ONLY, MENU_REPLACES_SERVICE, SERVICE_PLUS_MENU, QUOTE_WITH_MENU }

    /** Pricing models whose price is itself the food offer. */
    static final Set<String> MENU_REPLACES = Set.of("PER_PERSON", "PER_PLATE", "PER_100_GUESTS", "PER_PACKAGE");

    /**
     * @param serviceCharge part of the total that is the service's own price (null when not applied)
     * @param foodCost      menu cost per person x guests (null when no menu)
     * @param total         the estimate, or null when the provider must quote
     */
    public record Breakdown(Mode mode, BigDecimal serviceCharge, BigDecimal foodCost, BigDecimal total) {
    }

    /**
     * @param menuPerPerson price per person of the chosen menu, or null when no menu was chosen
     */
    public static Breakdown combine(String pricingModel, BigDecimal servicePrice, int guests,
                                    Integer hours, Integer days, BigDecimal menuPerPerson) {
        BigDecimal serviceEstimate = ServiceCatalog.estimate(pricingModel, servicePrice, guests, hours, days);
        if (menuPerPerson == null) {
            return new Breakdown(Mode.SERVICE_ONLY, serviceEstimate, null, serviceEstimate);
        }
        BigDecimal food = menuPerPerson.multiply(BigDecimal.valueOf(guests)).setScale(2, RoundingMode.HALF_UP);
        if (serviceEstimate == null) {
            return new Breakdown(Mode.QUOTE_WITH_MENU, null, food, null);
        }
        if (MENU_REPLACES.contains(pricingModel)) {
            return new Breakdown(Mode.MENU_REPLACES_SERVICE, null, food, food);
        }
        return new Breakdown(Mode.SERVICE_PLUS_MENU, serviceEstimate, food, serviceEstimate.add(food));
    }
}
