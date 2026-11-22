package com.marketplace.provider;

import com.marketplace.identity.User;
import com.marketplace.identity.UserRepository;
import com.marketplace.provider.dto.ProviderCardDto;
import com.marketplace.provider.dto.ProviderDetailDto;
import com.marketplace.provider.dto.ProviderSetupRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderService {

    private final ProviderProfileRepository providerProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProviderDetailDto setupProviderProfile(UUID userId, ProviderSetupRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        ProviderProfile profile = providerProfileRepository.findByUserId(userId)
                .orElseGet(() -> ProviderProfile.builder().user(user).build());

        profile.setProfessionalName(req.getProfessionalName());
        profile.setBusinessName(req.getBusinessName());
        profile.setBio(req.getBio());
        profile.setExperienceYears(req.getExperienceYears() != null ? req.getExperienceYears() : 0);
        profile.setAvatarUrl(req.getAvatarUrl());
        profile.setCoverImageUrl(req.getCoverImageUrl());
        profile.setMinBookingAmount(req.getMinBookingAmount() != null ? req.getMinBookingAmount() : BigDecimal.valueOf(1500));
        profile.setMaxTravelDistanceKm(req.getMaxTravelDistanceKm() != null ? req.getMaxTravelDistanceKm() : 25);
        profile.setBaseLatitude(req.getBaseLatitude() != null ? req.getBaseLatitude() : BigDecimal.valueOf(17.4325));
        profile.setBaseLongitude(req.getBaseLongitude() != null ? req.getBaseLongitude() : BigDecimal.valueOf(78.4071));
        profile.setFssaiLicenseNumber(req.getFssaiLicenseNumber());
        if (profile.getVerificationStatus() == null) {
            profile.setVerificationStatus("PENDING");
        }

        ProviderProfile saved = providerProfileRepository.save(profile);

        return mapToDetailDto(saved);
    }

    @Transactional(readOnly = true)
    public ProviderDetailDto getProviderById(UUID providerId) {
        ProviderProfile profile = providerProfileRepository.findById(providerId)
                .orElseThrow(() -> new IllegalArgumentException("Provider profile not found: " + providerId));
        return mapToDetailDto(profile);
    }

    @Transactional(readOnly = true)
    public List<ProviderCardDto> searchProviders(String query, String category, String cuisine,
                                                BigDecimal lat, BigDecimal lng, Integer radiusKm) {
        List<ProviderProfile> profiles = providerProfileRepository.findAll();

        return profiles.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsAcceptingBookings()))
                .filter(p -> {
                    if (query == null || query.isBlank()) return true;
                    String q = query.toLowerCase();
                    boolean matchName = p.getProfessionalName() != null && p.getProfessionalName().toLowerCase().contains(q);
                    boolean matchBio = p.getBio() != null && p.getBio().toLowerCase().contains(q);
                    boolean matchBusiness = p.getBusinessName() != null && p.getBusinessName().toLowerCase().contains(q);
                    return matchName || matchBio || matchBusiness;
                })
                .map(this::mapToCardDto)
                .collect(Collectors.toList());
    }

    private ProviderCardDto mapToCardDto(ProviderProfile p) {
        return ProviderCardDto.builder()
                .id(p.getId())
                .professionalName(p.getProfessionalName())
                .businessName(p.getBusinessName())
                .bio(p.getBio())
                .experienceYears(p.getExperienceYears())
                .avatarUrl(p.getAvatarUrl() != null ? p.getAvatarUrl() : "https://images.unsplash.com/photo-1577219491135-ce391730fb2c")
                .coverImageUrl(p.getCoverImageUrl() != null ? p.getCoverImageUrl() : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5")
                .primaryRole("Professional Chef")
                .averageRating(4.9)
                .totalReviews(84)
                .cuisines(List.of("Andhra", "Telangana", "Royal Hyderabadi"))
                .startingPrice(p.getMinBookingAmount() != null ? p.getMinBookingAmount() : BigDecimal.valueOf(1499))
                .pricingModel("PER_PERSON")
                .distanceKm(3.8)
                .verificationStatus(p.getVerificationStatus())
                .isAcceptingBookings(p.getIsAcceptingBookings())
                .build();
    }

    private ProviderDetailDto mapToDetailDto(ProviderProfile p) {
        return ProviderDetailDto.builder()
                .id(p.getId())
                .userId(p.getUser() != null ? p.getUser().getId() : null)
                .professionalName(p.getProfessionalName())
                .businessName(p.getBusinessName())
                .bio(p.getBio())
                .experienceYears(p.getExperienceYears())
                .avatarUrl(p.getAvatarUrl())
                .coverImageUrl(p.getCoverImageUrl())
                .verificationStatus(p.getVerificationStatus())
                .isAcceptingBookings(p.getIsAcceptingBookings())
                .minBookingAmount(p.getMinBookingAmount())
                .maxTravelDistanceKm(p.getMaxTravelDistanceKm())
                .baseLatitude(p.getBaseLatitude())
                .baseLongitude(p.getBaseLongitude())
                .fssaiLicenseNumber(p.getFssaiLicenseNumber())
                .fssaiExpiryDate(p.getFssaiExpiryDate())
                .averageRating(4.95)
                .totalReviews(124)
                .roles(List.of("Professional Chef", "Catering Specialist"))
                .cuisines(List.of("Andhra Royal", "Telangana Home-Style", "North Indian Awadhi"))
                .serviceDeliveryModes(List.of("CHEF_VISITS_HOME", "PREPARE_AND_DELIVER", "EVENT_VENUE_LIVE"))
                .portfolioImages(List.of(
                        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
                        "https://images.unsplash.com/photo-1544025162-d76694265947",
                        "https://images.unsplash.com/photo-1504674900247-0877df9cc836"
                ))
                .portfolioVideos(List.of("https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"))
                .build();
    }
}
