package com.marketplace.menu;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class MenuRequests {

    private MenuRequests() {
    }

    /** A dish in the provider's menu. */
    public record ItemUpsert(
            @NotBlank(message = "Enter the dish name") @Size(max = 150) String name,
            @Size(max = 500, message = "Keep the description under 500 characters") String description,
            @NotBlank(message = "Choose the course") String course,
            @NotBlank(message = "Choose veg or non-veg") String diet,
            String spiceLevel,
            @Size(max = 10) List<@NotBlank String> allergens,
            @NotNull(message = "Enter the price per person")
            @DecimalMin(value = "0", message = "Price cannot be negative") @DecimalMax("100000") BigDecimal pricePerPerson,
            @Min(value = 1, message = "At least 1") @Max(100000) Integer minServings,
            @Size(max = 1024) @Pattern(regexp = "^https://.*", message = "Upload the photo again") String imageUrl,
            Boolean available) {
    }

    public record SectionItem(
            @NotNull UUID itemId,
            @DecimalMin(value = "0", message = "Surcharge cannot be negative") @DecimalMax("100000") BigDecimal extraPricePerPerson) {
    }

    public record Section(
            @NotBlank(message = "Name each section, e.g. Starters") @Size(max = 100) String title,
            @NotNull @Min(0) @Max(50) Integer chooseMin,
            @NotNull @Min(1) @Max(50) Integer chooseMax,
            @NotEmpty(message = "Add dishes to each section") @Size(max = 60) List<@Valid SectionItem> items) {
    }

    /** A set menu: fixed price per person, made of sections the customer picks from. */
    public record SetMenuUpsert(
            @NotBlank(message = "Enter the menu name") @Size(max = 150) String name,
            @Size(max = 1000) String description,
            String mealType,
            @NotNull(message = "Enter the price per person")
            @DecimalMin(value = "1", message = "Price must be at least ₹1") @DecimalMax("100000") BigDecimal pricePerPerson,
            @Min(1) @Max(100000) Integer minGuests,
            @Min(1) @Max(100000) Integer maxGuests,
            Boolean active,
            @NotEmpty(message = "Add at least one section") @Size(max = 15) List<@Valid Section> sections) {
    }

    public record Choice(@NotNull UUID sectionId, @NotNull UUID itemId) {
    }

    /**
     * The customer's menu for a booking: either a set menu with their choices,
     * or their own selection of dishes ("build your own").
     */
    public record Selection(
            UUID menuId,
            @Size(max = 200) List<@Valid Choice> choices,
            @Size(max = 60) List<@NotNull UUID> items) {
    }

    /** Live price calculation before booking. */
    public record EstimateRequest(
            @NotNull(message = "Choose a service") UUID serviceId,
            @NotNull(message = "Enter the number of guests") @Min(value = 1, message = "At least 1 guest") @Max(100000) Integer guests,
            @Min(1) @Max(24) Integer hours,
            @Min(1) @Max(30) Integer days,
            @Valid Selection menu) {
    }
}
