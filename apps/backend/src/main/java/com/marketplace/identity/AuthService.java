package com.marketplace.identity;

import com.marketplace.identity.dto.AuthSyncRequest;
import com.marketplace.identity.dto.AuthSyncResponse;
import com.marketplace.identity.dto.UserProfileDto;
import com.marketplace.provider.ProviderProfile;
import com.marketplace.provider.ProviderProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProviderProfileRepository providerProfileRepository;

    @Transactional
    public AuthSyncResponse syncUser(String clerkId, AuthSyncRequest req) {
        log.info("Syncing user for clerkId: {}, role: {}", clerkId, req.getIntendedRole());

        // Security rule: Platform administrators cannot publicly self-register
        if ("ADMIN".equalsIgnoreCase(req.getIntendedRole())) {
            Optional<User> existingUser = userRepository.findByClerkId(clerkId);
            if (existingUser.isEmpty() || !"ADMIN".equalsIgnoreCase(existingUser.get().getUserType())) {
                log.warn("Unauthorized attempt to self-register as ADMIN: clerkId={}", clerkId);
                throw new AccessDeniedException("Platform administrators can only be invited by existing super-administrators.");
            }
        }

        User user = userRepository.findByClerkId(clerkId)
                .orElseGet(() -> {
                    // Check if email already registered with another account
                    if (req.getEmail() != null && !req.getEmail().isBlank() && userRepository.existsByEmail(req.getEmail())) {
                        log.info("Email {} exists, updating clerk mapping", req.getEmail());
                        User existingByEmail = userRepository.findByEmail(req.getEmail()).get();
                        existingByEmail.setClerkId(clerkId);
                        return userRepository.save(existingByEmail);
                    }

                    // Check if phone already registered with another account
                    if (req.getPhone() != null && !req.getPhone().isBlank() && userRepository.existsByPhone(req.getPhone())) {
                        log.info("Phone {} exists, updating clerk mapping", req.getPhone());
                        User existingByPhone = userRepository.findByPhone(req.getPhone()).get();
                        existingByPhone.setClerkId(clerkId);
                        return userRepository.save(existingByPhone);
                    }

                    String role = "PROVIDER".equalsIgnoreCase(req.getIntendedRole()) ? "PROVIDER" : "CUSTOMER";
                    String resolvedPhone = (req.getPhone() != null && !req.getPhone().isBlank())
                            ? req.getPhone()
                            : "usr_" + UUID.randomUUID().toString().substring(0, 12);

                    User newUser = User.builder()
                            .clerkId(clerkId)
                            .phone(resolvedPhone)
                            .email(req.getEmail())
                            .userType(role)
                            .accountStatus("ACTIVE")
                            .build();
                    return userRepository.save(newUser);
                });

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProfile newProfile = UserProfile.builder()
                            .user(user)
                            .fullName(req.getFullName())
                            .preferredLanguage("en")
                            .build();
                    return userProfileRepository.save(newProfile);
                });

        UUID providerProfileId = null;
        if ("PROVIDER".equalsIgnoreCase(user.getUserType())) {
            Optional<ProviderProfile> providerProfile = providerProfileRepository.findByUserId(user.getId());
            if (providerProfile.isPresent()) {
                providerProfileId = providerProfile.get().getId();
            }
        }

        return AuthSyncResponse.builder()
                .userId(user.getId())
                .clerkId(user.getClerkId())
                .roles(List.of("ROLE_" + user.getUserType()))
                .profileCompleted(profile != null && profile.getFullName() != null)
                .providerProfileId(providerProfileId)
                .fullName(profile != null ? profile.getFullName() : req.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .build();
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUser(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with clerkId: " + clerkId));

        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);

        UUID providerProfileId = null;
        if ("PROVIDER".equalsIgnoreCase(user.getUserType())) {
            Optional<ProviderProfile> providerProfile = providerProfileRepository.findByUserId(user.getId());
            if (providerProfile.isPresent()) {
                providerProfileId = providerProfile.get().getId();
            }
        }

        return UserProfileDto.builder()
                .id(user.getId())
                .clerkId(user.getClerkId())
                .phone(user.getPhone())
                .email(user.getEmail())
                .userType(user.getUserType())
                .accountStatus(user.getAccountStatus())
                .fullName(profile != null ? profile.getFullName() : "User")
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .roles(List.of("ROLE_" + user.getUserType()))
                .providerProfileId(providerProfileId)
                .build();
    }
}
