package com.marketplace.booking;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class BookingRequests {

    private BookingRequests() {
    }

    /** Customer's booking request. Prices are always computed on the server. */
    public record Create(
            @NotNull(message = "Choose a provider") UUID providerId,
            @NotNull(message = "Choose a service") UUID serviceId,
            @NotNull(message = "Choose the event date") @FutureOrPresent(message = "Choose today or a future date") LocalDate eventDate,
            @NotNull(message = "Choose the event time") LocalTime eventTime,
            @NotBlank(message = "Enter the event address") @Size(max = 500) String eventAddress,
            @NotBlank(message = "Enter the city") @Size(max = 100) String eventCity,
            @NotNull(message = "Enter the number of guests") @Min(value = 1, message = "At least 1 guest") @Max(value = 100000) Integer guestCount,
            @Min(value = 1, message = "At least 1 hour") @Max(value = 24) Integer hours,
            @Min(value = 1, message = "At least 1 day") @Max(value = 30) Integer days,
            @Size(max = 150) String cuisinePreference,
            @DecimalMin(value = "0", message = "Budget cannot be negative") @DecimalMax("100000000") BigDecimal budget,
            @Size(max = 2000, message = "Instructions are too long") String specialInstructions,
            /* Category-specific answers (menu, occasion, dietary needs, ...). Small flat map of strings. */
            @Size(max = 20) Map<@Size(max = 50) String, @Size(max = 1000) String> details) {
    }

    public record Message(@NotBlank(message = "Write a message") @Size(max = 1000) String message) {
    }

    public record Reason(@Size(max = 1000) String reason) {
    }

    public record QuoteItem(
            @NotBlank(message = "Describe each item") @Size(max = 255) String description,
            @NotNull @DecimalMin(value = "0", message = "Price cannot be negative") @DecimalMax("10000000") BigDecimal unitPrice,
            @NotNull @Min(1) @Max(100000) Integer quantity) {
    }

    public record Quote(
            @NotEmpty(message = "Add at least one line item") @Size(max = 50) List<@Valid QuoteItem> items,
            @DecimalMin("0") @DecimalMax("10000000") BigDecimal travelCharges,
            @DecimalMin("0") @DecimalMax("10000000") BigDecimal ingredientCharges,
            @DecimalMin("0") @DecimalMax("10000000") BigDecimal staffCharges,
            @Size(max = 2000) String notes) {
    }
}
