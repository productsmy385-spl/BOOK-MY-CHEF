package com.marketplace.event;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public final class EventRequests {

    private EventRequests() {
    }

    public record Upsert(
            @NotBlank(message = "Give your event a name") @Size(max = 120) String title,
            @NotBlank(message = "Choose the type of event") String eventType,
            @NotNull(message = "Choose the date") LocalDate eventDate,
            LocalTime eventTime,
            @NotBlank(message = "Enter the city") @Size(max = 100) String city,
            @Size(max = 500) String venue,
            @NotNull(message = "Enter the number of guests") @Min(value = 1, message = "At least 1 guest") @Max(100000) Integer guestCount,
            @DecimalMin(value = "0", message = "Budget cannot be negative") @DecimalMax("1000000000") BigDecimal budget,
            @Size(max = 2000) String notes,
            /* On create only: the services to start the checklist with. Null = use the suggestions for the type. */
            @Size(max = 13) List<@NotBlank String> needs) {
    }

    public record Need(
            @NotBlank(message = "Choose a service") String category,
            @DecimalMin(value = "0", message = "Budget cannot be negative") @DecimalMax("1000000000") BigDecimal budgetAllocation,
            @Size(max = 500) String notes) {
    }

    public record Status(@NotBlank @Pattern(regexp = "PLANNING|COMPLETED|CANCELLED", message = "Unknown status") String status) {
    }
}
