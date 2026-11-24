package com.marketplace.identity;

import com.marketplace.catalog.ServiceCatalog;
import com.marketplace.common.ApiException;
import com.marketplace.identity.dto.AuthSyncRequest;
import com.marketplace.identity.dto.UserProfileDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Links a verified Clerk identity to the application's PostgreSQL account.
 *
 * Rules:
 * - The Clerk user id always comes from the verified session token.
 * - An existing account keeps its role; sync never changes CUSTOMER <-> PROVIDER.
 * - Accounts are never linked by an email/phone typed into the client.
 * - ADMIN requires a Clerk-verified email that matches a pending invitation or
 *   the BOOTSTRAP_ADMIN_EMAILS allow-list (used once to create the first admin).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ClerkBackendClient clerk;
    private final NamedParameterJdbcTemplate jdbc;

    @Value("${app.bootstrap-admin-emails:}")
    private String bootstrapAdminEmails;

    @Transactional
    public UserProfileDto sync(String clerkId, AuthSyncRequest req) {
        String intended = req.getIntendedRole();
        User existing = userRepository.findByClerkId(clerkId).orElse(null);

        if ("ADMIN".equals(intended)) {
            return syncAdmin(clerkId, existing);
        }
        if (existing != null) {
            return getCurrentUser(clerkId);
        }

        Contact contact = resolveContact(clerkId, req);
        String fullName = firstNonBlank(req.getFullName(), contact.fullName);
        if (fullName == null) {
            throw ApiException.invalid("Please enter your full name.");
        }
        assertContactAvailable(contact);

        User user = userRepository.saveAndFlush(User.builder()
                .clerkId(clerkId)
                .phone(contact.phone)
                .email(contact.email)
                .userType(intended)
                .accountStatus("ACTIVE")
                .build());

        userProfileRepository.saveAndFlush(UserProfile.builder()
                .user(user)
                .fullName(fullName.trim())
                .city(blankToNull(req.getCity()))
                .preferredLanguage("en")
                .build());

        if ("PROVIDER".equals(intended)) {
            createDraftProviderProfile(user.getId(), fullName.trim(), req);
        }
        log.info("Registered new {} account {}", intended, user.getId());
        return getCurrentUser(clerkId);
    }

    private UserProfileDto syncAdmin(String clerkId, User existing) {
        if (existing != null && "ADMIN".equals(existing.getUserType())) {
            return getCurrentUser(clerkId);
        }
        // Admin access is decided only on a Clerk-verified email address.
        ClerkBackendClient.VerifiedContact verified = clerk.getVerifiedContact(clerkId);
        String email = verified.email() == null ? null : verified.email().toLowerCase(Locale.ROOT);
        if (email == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Administrator access requires a verified email address.");
        }

        List<Map<String, Object>> invitation = jdbc.queryForList("""
                SELECT id, admin_role FROM admin_invitations
                WHERE lower(email) = :email AND status = 'PENDING' AND expires_at > now()
                ORDER BY created_at DESC LIMIT 1""", Map.of("email", email));
        boolean bootstrap = bootstrapEmails().contains(email);
        if (invitation.isEmpty() && !bootstrap) {
            log.warn("Rejected admin sign-in for {} (no invitation)", clerkId);
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "This account has not been invited as a platform administrator.");
        }
        String adminRole = bootstrap ? "SUPER_ADMIN" : (String) invitation.get(0).get("admin_role");

        User user;
        if (existing != null) {
            if (!"CUSTOMER".equals(existing.getUserType())) {
                throw ApiException.conflict("This account is registered as a service provider and cannot be an administrator.");
            }
            existing.setUserType("ADMIN");
            user = userRepository.saveAndFlush(existing);
        } else {
            user = userRepository.saveAndFlush(User.builder()
                    .clerkId(clerkId).email(email).phone(verified.phone())
                    .userType("ADMIN").accountStatus("ACTIVE").build());
            userProfileRepository.saveAndFlush(UserProfile.builder()
                    .user(user)
                    .fullName(firstNonBlank(verified.fullName(), email))
                    .preferredLanguage("en")
                    .build());
        }

        jdbc.update("""
                INSERT INTO admin_users (user_id, admin_role, status)
                VALUES (:uid, :role, 'ACTIVE')
                ON CONFLICT (user_id) DO UPDATE SET status = 'ACTIVE', admin_role = EXCLUDED.admin_role""",
                Map.of("uid", user.getId(), "role", adminRole));
        invitation.forEach(inv -> jdbc.update(
                "UPDATE admin_invitations SET status = 'ACCEPTED' WHERE id = :id", Map.of("id", inv.get("id"))));
        log.info("Administrator access granted to user {} ({})", user.getId(), bootstrap ? "bootstrap" : "invitation");
        return getCurrentUser(clerkId);
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUser(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account setup is not complete."));
        UserProfile profile = userProfileRepository.findByUserId(user.getId()).orElse(null);

        UserProfileDto.UserProfileDtoBuilder dto = UserProfileDto.builder()
                .id(user.getId())
                .userType(user.getUserType())
                .accountStatus(user.getAccountStatus())
                .fullName(profile != null ? profile.getFullName() : null)
                .email(user.getEmail())
                .phone(user.getPhone())
                .city(profile != null ? profile.getCity() : null)
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null);

        if ("PROVIDER".equals(user.getUserType())) {
            jdbc.query("""
                    SELECT id, onboarding_status, verification_status, avatar_url
                    FROM provider_profiles WHERE user_id = :uid""", Map.of("uid", user.getId()), rs -> {
                dto.providerProfileId(rs.getObject("id", UUID.class))
                   .providerOnboardingStatus(rs.getString("onboarding_status"))
                   .providerVerificationStatus(rs.getString("verification_status"));
                if (rs.getString("avatar_url") != null) dto.avatarUrl(rs.getString("avatar_url"));
            });
        } else if ("ADMIN".equals(user.getUserType())) {
            List<String> roles = jdbc.queryForList(
                    "SELECT admin_role FROM admin_users WHERE user_id = :uid AND status = 'ACTIVE'",
                    Map.of("uid", user.getId()), String.class);
            dto.adminRole(roles.isEmpty() ? null : roles.get(0));
        }
        return dto.build();
    }

    private void createDraftProviderProfile(UUID userId, String fullName, AuthSyncRequest req) {
        UUID providerId = jdbc.queryForObject("""
                INSERT INTO provider_profiles (user_id, professional_name, business_name, city, onboarding_status, verification_status)
                VALUES (:uid, :name, :business, :city, 'DRAFT', 'PENDING') RETURNING id""",
                new MapSqlParameterSource()
                        .addValue("uid", userId)
                        .addValue("name", fullName)
                        .addValue("business", blankToNull(req.getBusinessName()))
                        .addValue("city", blankToNull(req.getCity())),
                UUID.class);

        List<String> roles = req.getRoles() == null ? List.of() : req.getRoles().stream()
                .filter(ServiceCatalog::isCategory).distinct().toList();
        for (int i = 0; i < roles.size(); i++) {
            jdbc.update("""
                    INSERT INTO provider_roles (provider_id, role_type, is_primary, is_active)
                    VALUES (:pid, :role, :primary, TRUE) ON CONFLICT (provider_id, role_type) DO NOTHING""",
                    new MapSqlParameterSource()
                            .addValue("pid", providerId)
                            .addValue("role", roles.get(i))
                            .addValue("primary", i == 0));
        }
    }

    private record Contact(String email, String phone, String fullName) {
    }

    private Contact resolveContact(String clerkId, AuthSyncRequest req) {
        if (clerk.isConfigured()) {
            ClerkBackendClient.VerifiedContact v = clerk.getVerifiedContact(clerkId);
            // Sign-up verifies email by OTP; the mobile number is contact information typed at
            // registration unless Clerk has a verified one. It is never used to link accounts.
            String phone = v.phone() != null ? v.phone() : req.getPhone();
            return new Contact(lower(v.email()), normalizePhone(phone), v.fullName());
        }
        // Without the Clerk secret key we can only record what the user typed.
        return new Contact(lower(blankToNull(req.getEmail())), normalizePhone(req.getPhone()), null);
    }

    private void assertContactAvailable(Contact c) {
        if (c.phone != null && userRepository.existsByPhone(c.phone)) {
            throw ApiException.conflict("This mobile number is already registered with another account. Please sign in instead.");
        }
        if (c.email != null && userRepository.existsByEmail(c.email)) {
            throw ApiException.conflict("This email address is already registered with another account. Please sign in instead.");
        }
    }

    private Set<String> bootstrapEmails() {
        return Arrays.stream(bootstrapAdminEmails.split(","))
                .map(s -> s.trim().toLowerCase(Locale.ROOT)).filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("[^0-9+]", "");
        if (!digits.startsWith("+")) {
            digits = digits.length() == 10 ? "+91" + digits : "+" + digits;
        }
        return digits;
    }

    private static String lower(String s) {
        return s == null ? null : s.toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String firstNonBlank(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return b != null && !b.isBlank() ? b : null;
    }
}
