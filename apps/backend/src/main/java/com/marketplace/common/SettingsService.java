package com.marketplace.common;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Reads platform settings from the system_settings table (seeded by V6). */
@Service
@RequiredArgsConstructor
public class SettingsService {

    public static final String PAYMENT_REQUIRED = "booking.payment_required";
    public static final String REQUEST_EXPIRY_HOURS = "booking.request_expiry_hours";
    public static final String REQUIRE_VERIFICATION_TO_LIST = "marketplace.require_verification_to_list";
    public static final String COMMISSION_RATE = "platform.commission_rate";

    private final NamedParameterJdbcTemplate jdbc;

    public String get(String key, String fallback) {
        List<String> values = jdbc.queryForList(
                "SELECT value FROM system_settings WHERE key = :k", Map.of("k", key), String.class);
        return values.isEmpty() ? fallback : values.get(0);
    }

    public boolean getBoolean(String key, boolean fallback) {
        return Boolean.parseBoolean(get(key, String.valueOf(fallback)));
    }

    public int getInt(String key, int fallback) {
        try {
            return Integer.parseInt(get(key, String.valueOf(fallback)));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public BigDecimal getDecimal(String key, BigDecimal fallback) {
        try {
            return new BigDecimal(get(key, fallback.toPlainString()));
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    public List<Map<String, Object>> all() {
        return jdbc.queryForList(
                "SELECT key, value, data_type AS \"dataType\", description, updated_at AS \"updatedAt\" FROM system_settings ORDER BY key",
                Map.of());
    }

    /** Updates an existing setting after validating the value against its declared type. */
    public Map<String, Object> update(String key, String value) {
        List<String> types = jdbc.queryForList(
                "SELECT data_type FROM system_settings WHERE key = :k", Map.of("k", key), String.class);
        if (types.isEmpty()) {
            throw ApiException.notFound("Setting");
        }
        String v = value == null ? "" : value.trim();
        switch (types.get(0)) {
            case "BOOLEAN" -> {
                if (!v.equals("true") && !v.equals("false")) throw ApiException.invalid("Value must be true or false.");
            }
            case "INTEGER" -> {
                try {
                    if (Integer.parseInt(v) < 0) throw ApiException.invalid("Value must be zero or more.");
                } catch (NumberFormatException e) {
                    throw ApiException.invalid("Value must be a whole number.");
                }
            }
            case "DECIMAL" -> {
                try {
                    BigDecimal d = new BigDecimal(v);
                    if (d.signum() < 0 || d.compareTo(BigDecimal.valueOf(100)) > 0)
                        throw ApiException.invalid("Value must be between 0 and 100.");
                } catch (NumberFormatException e) {
                    throw ApiException.invalid("Value must be a number.");
                }
            }
            default -> { }
        }
        jdbc.update("UPDATE system_settings SET value = :v, updated_at = now() WHERE key = :k", Map.of("v", v, "k", key));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("key", key);
        result.put("value", v);
        return result;
    }
}
