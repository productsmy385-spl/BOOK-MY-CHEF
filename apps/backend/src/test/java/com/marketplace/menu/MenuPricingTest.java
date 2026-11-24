package com.marketplace.menu;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class MenuPricingTest {

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }

    @Test
    void withoutMenuTheServicePriceIsTheEstimate() {
        MenuPricing.Breakdown b = MenuPricing.combine("PER_HOUR", bd("1500"), 20, 3, null, null);
        assertThat(b.mode()).isEqualTo(MenuPricing.Mode.SERVICE_ONLY);
        assertThat(b.total()).isEqualByComparingTo("4500");
        assertThat(b.foodCost()).isNull();
    }

    @Test
    void perPlateServiceIsReplacedByTheMenuPrice() {
        // Caterer at ₹300/plate; customer picks a ₹350/person menu for 200 guests: 200 × 350, not 200 × 650.
        MenuPricing.Breakdown b = MenuPricing.combine("PER_PLATE", bd("300"), 200, null, null, bd("350"));
        assertThat(b.mode()).isEqualTo(MenuPricing.Mode.MENU_REPLACES_SERVICE);
        assertThat(b.serviceCharge()).isNull();
        assertThat(b.foodCost()).isEqualByComparingTo("70000");
        assertThat(b.total()).isEqualByComparingTo("70000");
    }

    @Test
    void packagePriceIsAlsoReplacedByTheMenu() {
        MenuPricing.Breakdown b = MenuPricing.combine("PER_PACKAGE", bd("50000"), 100, null, null, bd("420"));
        assertThat(b.mode()).isEqualTo(MenuPricing.Mode.MENU_REPLACES_SERVICE);
        assertThat(b.total()).isEqualByComparingTo("42000");
    }

    @Test
    void timeBasedChefChargeIsAddedToFoodCost() {
        // Chef at ₹800/hour for 4 hours + ₹250/person food for 12 guests.
        MenuPricing.Breakdown b = MenuPricing.combine("PER_HOUR", bd("800"), 12, 4, null, bd("250"));
        assertThat(b.mode()).isEqualTo(MenuPricing.Mode.SERVICE_PLUS_MENU);
        assertThat(b.serviceCharge()).isEqualByComparingTo("3200");
        assertThat(b.foodCost()).isEqualByComparingTo("3000");
        assertThat(b.total()).isEqualByComparingTo("6200");
    }

    @Test
    void perEventChargeIsAddedToFoodCost() {
        MenuPricing.Breakdown b = MenuPricing.combine("PER_EVENT", bd("5000"), 30, null, null, bd("199.50"));
        assertThat(b.total()).isEqualByComparingTo("10985");
    }

    @Test
    void customQuoteStaysOnRequestButShowsFoodCostAsGuide() {
        MenuPricing.Breakdown b = MenuPricing.combine("CUSTOM_QUOTE", null, 50, null, null, bd("400"));
        assertThat(b.mode()).isEqualTo(MenuPricing.Mode.QUOTE_WITH_MENU);
        assertThat(b.total()).isNull();
        assertThat(b.foodCost()).isEqualByComparingTo("20000");
    }
}
