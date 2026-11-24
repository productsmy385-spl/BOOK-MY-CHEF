package com.marketplace.provider;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Validated request bodies for provider self-management. */
public final class ProviderRequests {

    private ProviderRequests() {
    }

    public record ProfileUpdate(
            @NotBlank(message = "Your name is required") @Size(max = 150) String name,
            @Size(max = 150) String businessName,
            @Size(max = 2000, message = "Description is too long") String bio,
            @Min(value = 0, message = "Experience cannot be negative") @Max(value = 70, message = "Experience looks too high") Integer experienceYears,
            @Size(max = 1024) @Pattern(regexp = "^$|^https://.+", message = "Photo must be an https link") String avatarUrl,
            @Size(max = 1024) @Pattern(regexp = "^$|^https://.+", message = "Cover must be an https link") String coverImageUrl,
            @NotBlank(message = "City is required") @Size(max = 100) String city,
            @Size(max = 150) String locality,
            @DecimalMin("-90") @DecimalMax("90") BigDecimal baseLatitude,
            @DecimalMin("-180") @DecimalMax("180") BigDecimal baseLongitude,
            @Min(value = 1, message = "Service radius must be at least 1 km") @Max(value = 200, message = "Service radius can be at most 200 km") Integer maxTravelDistanceKm,
            @Size(max = 64) String fssaiLicenseNumber,
            Boolean acceptingBookings) {
    }

    public record Categories(
            @NotEmpty(message = "Choose at least one service") @Size(max = 13) List<@NotBlank String> categories) {
    }

    public record Cuisines(
            @Size(max = 20) List<@NotBlank String> cuisines,
            @Size(max = 255, message = "Custom cuisines text is too long") String customCuisines) {
    }

    public record ServiceUpsert(
            @NotBlank(message = "Choose the service category") String category,
            @NotBlank(message = "Service name is required") @Size(max = 150) String title,
            @Size(max = 2000) String description,
            @NotBlank(message = "Choose how you deliver this service") String deliveryMode,
            @NotBlank(message = "Choose a pricing model") String pricingModel,
            @DecimalMin(value = "1", message = "Price must be at least ₹1") @DecimalMax(value = "10000000", message = "Price is too high") BigDecimal price,
            @Min(value = 1, message = "Minimum guests must be at least 1") Integer minGuests,
            @Min(value = 1, message = "Maximum guests must be at least 1") @Max(value = 100000) Integer maxGuests,
            Boolean active) {
    }

    public record WeeklySlot(
            @Min(1) @Max(7) int dayOfWeek,
            @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Use HH:MM time") String startTime,
            @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Use HH:MM time") String endTime,
            boolean active) {
    }

    public record Availability(
            @NotNull @Size(max = 7) List<@Valid WeeklySlot> weekly,
            @NotNull @Min(value = 0, message = "Advance notice cannot be negative") @Max(value = 720) Integer advanceNoticeHours,
            @NotNull @Min(value = 1, message = "Allow at least one booking per day") @Max(value = 20) Integer maxDailyBookings,
            @NotNull @Min(value = 1) @Max(value = 730) Integer maxAdvanceDays) {
    }

    public record BlockedDate(
            @NotNull(message = "Choose a date") @FutureOrPresent(message = "Choose today or a future date") LocalDate date,
            @Size(max = 255) String reason) {
    }

    public record PortfolioItem(
            @NotBlank @Pattern(regexp = "IMAGE|VIDEO") String mediaType,
            @NotBlank @Size(max = 1024) @Pattern(regexp = "^https://.+", message = "Media must be an https link") String url,
            @Size(max = 150) String title) {
    }

    public record Document(
            @NotBlank @Pattern(regexp = "FSSAI|AADHAAR_KYC|PAN|POLICE_BACKGROUND|CULINARY_DEGREE|BUSINESS_REGISTRATION|OTHER") String documentType,
            @NotBlank @Size(max = 1024) @Pattern(regexp = "^https://.+", message = "Document must be an https link") String url,
            @NotBlank @Size(max = 255) String fileName) {
    }
}
