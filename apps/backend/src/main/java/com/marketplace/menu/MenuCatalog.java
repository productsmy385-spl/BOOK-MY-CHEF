package com.marketplace.menu;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** Fixed option lists for menus. The V7 CHECK constraints mirror these codes. */
public final class MenuCatalog {

    private MenuCatalog() {
    }

    public static final Map<String, String> COURSES = ordered(
        "WELCOME_DRINK", "Welcome drink",
        "STARTER", "Starter",
        "SOUP", "Soup",
        "MAIN_COURSE", "Main course",
        "BREAD", "Breads",
        "RICE", "Rice",
        "SIDE", "Sides & accompaniments",
        "DESSERT", "Dessert",
        "SNACK", "Snacks",
        "BEVERAGE", "Beverage"
    );

    public static final Map<String, String> DIETS = ordered(
        "VEG", "Vegetarian",
        "EGG", "Contains egg",
        "NON_VEG", "Non-vegetarian",
        "VEGAN", "Vegan"
    );

    public static final Map<String, String> SPICE_LEVELS = ordered(
        "NONE", "Not spicy",
        "MILD", "Mild",
        "MEDIUM", "Medium",
        "HOT", "Hot"
    );

    public static final Map<String, String> ALLERGENS = ordered(
        "GLUTEN", "Gluten",
        "DAIRY", "Dairy",
        "NUTS", "Tree nuts",
        "PEANUTS", "Peanuts",
        "EGG", "Egg",
        "SOY", "Soy",
        "FISH", "Fish",
        "SHELLFISH", "Shellfish",
        "SESAME", "Sesame",
        "MUSTARD", "Mustard"
    );

    public static final Map<String, String> MEAL_TYPES = ordered(
        "BREAKFAST", "Breakfast",
        "LUNCH", "Lunch",
        "DINNER", "Dinner",
        "SNACKS", "Snacks / high tea",
        "ANY", "Any time"
    );

    private static Map<String, String> ordered(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
        return Collections.unmodifiableMap(m);
    }
}
