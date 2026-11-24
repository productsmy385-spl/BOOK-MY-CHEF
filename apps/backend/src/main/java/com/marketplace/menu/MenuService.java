package com.marketplace.menu;

import com.marketplace.common.ApiException;
import com.marketplace.provider.ProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Provider menus: dishes, set menus, and server-side pricing of a customer's
 * menu selection. The provider id for writes always comes from the
 * authenticated user, so one provider can never change another's menu.
 */
@Service
@RequiredArgsConstructor
public class MenuService {

    private static final List<String> COURSE_ORDER = List.copyOf(MenuCatalog.COURSES.keySet());

    private final NamedParameterJdbcTemplate jdbc;
    private final ProviderRepository providers;

    // ================================================================== reads

    @Transactional(readOnly = true)
    public Map<String, Object> ownerMenu(UUID userId) {
        return load(providers.requireIdByUserId(userId), true);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> publicMenu(UUID providerId) {
        if (!providers.isPubliclyListed(providerId)) throw ApiException.notFound("Provider");
        return load(providerId, false);
    }

    /**
     * @param ownerView true includes unavailable dishes, inactive menus and menus that
     *                  cannot currently be ordered (with the reason); false is the customer view.
     */
    private Map<String, Object> load(UUID providerId, boolean ownerView) {
        Map<String, Object> pid = Map.of("pid", providerId);
        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT id, name, description, course, diet, spice_level AS "spiceLevel", allergens,
                       price_per_person AS "pricePerPerson", min_servings AS "minServings",
                       image_url AS "imageUrl", is_available AS "available"
                FROM menu_items WHERE provider_id = :pid %s
                ORDER BY sort_order, lower(name)""".formatted(ownerView ? "" : "AND is_available"), pid)
                .stream().map(LinkedHashMap::new).collect(Collectors.toCollection(ArrayList::new));
        items.forEach(i -> i.put("allergens", splitAllergens((String) i.get("allergens"))));
        items.sort(Comparator.comparingInt((Map<String, Object> i) -> COURSE_ORDER.indexOf((String) i.get("course"))));

        List<Map<String, Object>> menus = jdbc.queryForList("""
                SELECT id, name, description, meal_type AS "mealType", price_per_person AS "pricePerPerson",
                       min_guests AS "minGuests", max_guests AS "maxGuests", is_active AS "active"
                FROM menus WHERE provider_id = :pid %s
                ORDER BY sort_order, created_at""".formatted(ownerView ? "" : "AND is_active"), pid)
                .stream().map(LinkedHashMap::new).collect(Collectors.toCollection(ArrayList::new));

        Map<Object, List<Map<String, Object>>> sectionsByMenu = new HashMap<>();
        Map<Object, Map<String, Object>> sectionById = new HashMap<>();
        for (Map<String, Object> s : jdbc.queryForList("""
                SELECT ms.id, ms.menu_id, ms.title, ms.choose_min AS "chooseMin", ms.choose_max AS "chooseMax"
                FROM menu_sections ms JOIN menus m ON m.id = ms.menu_id
                WHERE m.provider_id = :pid ORDER BY ms.sort_order""", pid)) {
            Map<String, Object> sec = new LinkedHashMap<>(s);
            Object menuId = sec.remove("menu_id");
            sec.put("items", new ArrayList<Map<String, Object>>());
            sectionsByMenu.computeIfAbsent(menuId, k -> new ArrayList<>()).add(sec);
            sectionById.put(sec.get("id"), sec);
        }
        for (Map<String, Object> si : jdbc.queryForList("""
                SELECT msi.section_id, mi.id AS "itemId", mi.name, mi.course, mi.diet, mi.image_url AS "imageUrl",
                       mi.is_available AS "available", msi.extra_price_per_person AS "extraPricePerPerson"
                FROM menu_section_items msi
                JOIN menu_items mi ON mi.id = msi.item_id
                JOIN menu_sections ms ON ms.id = msi.section_id
                JOIN menus m ON m.id = ms.menu_id
                WHERE m.provider_id = :pid ORDER BY msi.sort_order, lower(mi.name)""", pid)) {
            Map<String, Object> row = new LinkedHashMap<>(si);
            Map<String, Object> section = sectionById.get(row.remove("section_id"));
            if (section == null || (!ownerView && !Boolean.TRUE.equals(row.get("available")))) continue;
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> list = (List<Map<String, Object>>) section.get("items");
            list.add(row);
        }

        List<Map<String, Object>> visible = new ArrayList<>();
        for (Map<String, Object> m : menus) {
            List<Map<String, Object>> sections = sectionsByMenu.getOrDefault(m.get("id"), List.of());
            m.put("sections", sections);
            String problem = orderProblem(sections);
            if (ownerView) {
                m.put("orderable", problem == null);
                m.put("problem", problem);
                visible.add(m);
            } else if (problem == null) {
                visible.add(m);
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", items);
        out.put("menus", visible);
        return out;
    }

    /** Why a set menu cannot be ordered right now, or null when it can. */
    @SuppressWarnings("unchecked")
    private static String orderProblem(List<Map<String, Object>> sections) {
        if (sections.isEmpty()) return "Add at least one section.";
        for (Map<String, Object> s : sections) {
            long available = ((List<Map<String, Object>>) s.get("items")).stream()
                    .filter(i -> Boolean.TRUE.equals(i.get("available"))).count();
            int min = (Integer) s.get("chooseMin");
            if (available < Math.max(min, 1)) {
                return "“" + s.get("title") + "” has fewer available dishes than customers must choose.";
            }
        }
        return null;
    }

    // ================================================================== dishes

    @Transactional
    public Map<String, Object> createItem(UUID userId, MenuRequests.ItemUpsert r) {
        UUID pid = providers.requireIdByUserId(userId);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM menu_items WHERE provider_id = :pid", Map.of("pid", pid), Integer.class);
        if (count != null && count >= 300) throw ApiException.invalid("You can keep up to 300 dishes.");
        MapSqlParameterSource p = itemParams(r).addValue("pid", pid).addValue("sort", count == null ? 0 : count);
        try {
            jdbc.update("""
                    INSERT INTO menu_items (provider_id, name, description, course, diet, spice_level, allergens,
                        price_per_person, min_servings, image_url, is_available, sort_order)
                    VALUES (:pid, :name, :desc, :course, :diet, :spice, :allergens, :price, :minServ, :image, :available, :sort)""", p);
        } catch (DuplicateKeyException e) {
            throw duplicateDish(r.name());
        }
        return ownerMenu(userId);
    }

    @Transactional
    public Map<String, Object> updateItem(UUID userId, UUID itemId, MenuRequests.ItemUpsert r) {
        UUID pid = providers.requireIdByUserId(userId);
        int updated;
        try {
            updated = jdbc.update("""
                    UPDATE menu_items SET name = :name, description = :desc, course = :course, diet = :diet,
                        spice_level = :spice, allergens = :allergens, price_per_person = :price, min_servings = :minServ,
                        image_url = :image, is_available = :available, updated_at = now()
                    WHERE id = :id AND provider_id = :pid""", itemParams(r).addValue("pid", pid).addValue("id", itemId));
        } catch (DuplicateKeyException e) {
            throw duplicateDish(r.name());
        }
        if (updated == 0) throw ApiException.notFound("Dish");
        return ownerMenu(userId);
    }

    @Transactional
    public Map<String, Object> deleteItem(UUID userId, UUID itemId) {
        UUID pid = providers.requireIdByUserId(userId);
        List<String> usedIn = jdbc.queryForList("""
                SELECT DISTINCT m.name FROM menu_section_items msi
                JOIN menu_sections ms ON ms.id = msi.section_id JOIN menus m ON m.id = ms.menu_id
                WHERE msi.item_id = :id AND m.provider_id = :pid ORDER BY m.name""", Map.of("id", itemId, "pid", pid), String.class);
        if (!usedIn.isEmpty()) {
            throw ApiException.conflict("This dish is part of " + String.join(", ", usedIn)
                    + ". Remove it from those set menus first, or mark it unavailable.");
        }
        if (jdbc.update("DELETE FROM menu_items WHERE id = :id AND provider_id = :pid", Map.of("id", itemId, "pid", pid)) == 0) {
            throw ApiException.notFound("Dish");
        }
        return ownerMenu(userId);
    }

    private MapSqlParameterSource itemParams(MenuRequests.ItemUpsert r) {
        if (!MenuCatalog.COURSES.containsKey(r.course())) throw ApiException.invalid("Unknown course.");
        if (!MenuCatalog.DIETS.containsKey(r.diet())) throw ApiException.invalid("Choose veg, egg, non-veg or vegan.");
        String spice = r.spiceLevel() == null || r.spiceLevel().isBlank() ? "MEDIUM" : r.spiceLevel();
        if (!MenuCatalog.SPICE_LEVELS.containsKey(spice)) throw ApiException.invalid("Unknown spice level.");
        List<String> allergens = r.allergens() == null ? List.of() : r.allergens().stream().distinct().toList();
        if (allergens.stream().anyMatch(a -> !MenuCatalog.ALLERGENS.containsKey(a))) throw ApiException.invalid("Unknown allergen.");
        return new MapSqlParameterSource()
                .addValue("name", r.name().trim())
                .addValue("desc", blankToNull(r.description()))
                .addValue("course", r.course())
                .addValue("diet", r.diet())
                .addValue("spice", spice)
                .addValue("allergens", allergens.isEmpty() ? null : String.join(",", allergens))
                .addValue("price", r.pricePerPerson().setScale(2, RoundingMode.HALF_UP))
                .addValue("minServ", r.minServings())
                .addValue("image", blankToNull(r.imageUrl()))
                .addValue("available", r.available() == null || r.available());
    }

    // ================================================================== set menus

    @Transactional
    public Map<String, Object> createSetMenu(UUID userId, MenuRequests.SetMenuUpsert r) {
        UUID pid = providers.requireIdByUserId(userId);
        validateSetMenu(pid, r);
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM menus WHERE provider_id = :pid", Map.of("pid", pid), Integer.class);
        if (count != null && count >= 30) throw ApiException.invalid("You can keep up to 30 set menus.");
        UUID menuId;
        try {
            menuId = jdbc.queryForObject("""
                    INSERT INTO menus (provider_id, name, description, meal_type, price_per_person, min_guests, max_guests, is_active, sort_order)
                    VALUES (:pid, :name, :desc, :meal, :price, :minG, :maxG, :active, :sort) RETURNING id""",
                    setParams(r).addValue("pid", pid).addValue("sort", count == null ? 0 : count), UUID.class);
        } catch (DuplicateKeyException e) {
            throw duplicateMenu(r.name());
        }
        insertSections(menuId, r.sections());
        return ownerMenu(userId);
    }

    @Transactional
    public Map<String, Object> updateSetMenu(UUID userId, UUID menuId, MenuRequests.SetMenuUpsert r) {
        UUID pid = providers.requireIdByUserId(userId);
        validateSetMenu(pid, r);
        int updated;
        try {
            updated = jdbc.update("""
                    UPDATE menus SET name = :name, description = :desc, meal_type = :meal, price_per_person = :price,
                        min_guests = :minG, max_guests = :maxG, is_active = :active, updated_at = now()
                    WHERE id = :id AND provider_id = :pid""", setParams(r).addValue("pid", pid).addValue("id", menuId));
        } catch (DuplicateKeyException e) {
            throw duplicateMenu(r.name());
        }
        if (updated == 0) throw ApiException.notFound("Menu");
        // Bookings keep their own snapshot (booking_menu_lines), so sections can be replaced freely.
        jdbc.update("DELETE FROM menu_sections WHERE menu_id = :id", Map.of("id", menuId));
        insertSections(menuId, r.sections());
        return ownerMenu(userId);
    }

    @Transactional
    public Map<String, Object> deleteSetMenu(UUID userId, UUID menuId) {
        UUID pid = providers.requireIdByUserId(userId);
        if (jdbc.update("DELETE FROM menus WHERE id = :id AND provider_id = :pid", Map.of("id", menuId, "pid", pid)) == 0) {
            throw ApiException.notFound("Menu");
        }
        return ownerMenu(userId);
    }

    private void validateSetMenu(UUID pid, MenuRequests.SetMenuUpsert r) {
        String meal = r.mealType() == null || r.mealType().isBlank() ? "ANY" : r.mealType();
        if (!MenuCatalog.MEAL_TYPES.containsKey(meal)) throw ApiException.invalid("Unknown meal type.");
        if (r.minGuests() != null && r.maxGuests() != null && r.minGuests() > r.maxGuests()) {
            throw ApiException.invalid("Minimum guests cannot be more than maximum guests.");
        }
        Set<UUID> all = new HashSet<>();
        for (MenuRequests.Section s : r.sections()) {
            Set<UUID> ids = s.items().stream().map(MenuRequests.SectionItem::itemId).collect(Collectors.toSet());
            String title = "“" + s.title().trim() + "”";
            if (ids.size() != s.items().size()) throw ApiException.invalid(title + " lists the same dish twice.");
            if (s.chooseMin() > s.chooseMax()) throw ApiException.invalid(title + ": minimum choices cannot be more than maximum.");
            if (s.chooseMax() > ids.size()) {
                throw ApiException.invalid(title + " lets customers choose " + s.chooseMax() + " but offers only " + ids.size() + " dish(es).");
            }
            all.addAll(ids);
        }
        Integer owned = jdbc.queryForObject("SELECT COUNT(*) FROM menu_items WHERE provider_id = :pid AND id IN (:ids)",
                new MapSqlParameterSource().addValue("pid", pid).addValue("ids", all), Integer.class);
        if (owned == null || owned != all.size()) throw ApiException.invalid("Some dishes no longer exist. Refresh and try again.");
    }

    private MapSqlParameterSource setParams(MenuRequests.SetMenuUpsert r) {
        return new MapSqlParameterSource()
                .addValue("name", r.name().trim())
                .addValue("desc", blankToNull(r.description()))
                .addValue("meal", r.mealType() == null || r.mealType().isBlank() ? "ANY" : r.mealType())
                .addValue("price", r.pricePerPerson().setScale(2, RoundingMode.HALF_UP))
                .addValue("minG", r.minGuests())
                .addValue("maxG", r.maxGuests())
                .addValue("active", r.active() == null || r.active());
    }

    private void insertSections(UUID menuId, List<MenuRequests.Section> sections) {
        for (int i = 0; i < sections.size(); i++) {
            MenuRequests.Section s = sections.get(i);
            UUID sectionId = jdbc.queryForObject("""
                    INSERT INTO menu_sections (menu_id, title, choose_min, choose_max, sort_order)
                    VALUES (:mid, :title, :min, :max, :sort) RETURNING id""",
                    new MapSqlParameterSource().addValue("mid", menuId).addValue("title", s.title().trim())
                            .addValue("min", s.chooseMin()).addValue("max", s.chooseMax()).addValue("sort", i), UUID.class);
            for (int j = 0; j < s.items().size(); j++) {
                MenuRequests.SectionItem it = s.items().get(j);
                jdbc.update("""
                        INSERT INTO menu_section_items (section_id, item_id, extra_price_per_person, sort_order)
                        VALUES (:sid, :iid, :extra, :sort)""",
                        new MapSqlParameterSource().addValue("sid", sectionId).addValue("iid", it.itemId())
                                .addValue("extra", it.extraPricePerPerson() == null ? BigDecimal.ZERO : it.extraPricePerPerson())
                                .addValue("sort", j));
            }
        }
    }

    // ================================================================== pricing a selection

    public record Line(String type, UUID menuId, UUID itemId, String sectionTitle, String name,
                       String course, String diet, BigDecimal unitPricePerPerson) {
    }

    /** A validated, priced menu selection. perPerson is the sum of the lines' unit prices. */
    public record Priced(String kind, UUID menuId, String menuName, BigDecimal perPerson, List<Line> lines) {
    }

    /**
     * Validates the customer's selection against the provider's current menu and
     * prices it from the database. Returns null when no menu was chosen.
     */
    @Transactional(readOnly = true)
    public Priced price(UUID providerId, MenuRequests.Selection sel, int guests) {
        if (sel == null) return null;
        boolean setMenu = sel.menuId() != null;
        boolean custom = sel.items() != null && !sel.items().isEmpty();
        if (!setMenu && !custom) return null;
        if (setMenu && custom) throw ApiException.invalid("Choose a set menu or your own dishes, not both.");
        return setMenu ? priceSetMenu(providerId, sel, guests) : priceCustom(providerId, sel.items(), guests);
    }

    private Priced priceSetMenu(UUID providerId, MenuRequests.Selection sel, int guests) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT id, name, price_per_person, min_guests, max_guests FROM menus
                WHERE id = :id AND provider_id = :pid AND is_active""", Map.of("id", sel.menuId(), "pid", providerId));
        if (rows.isEmpty()) throw ApiException.notFound("Menu");
        Map<String, Object> menu = rows.get(0);
        String menuName = (String) menu.get("name");
        Integer minG = (Integer) menu.get("min_guests");
        Integer maxG = (Integer) menu.get("max_guests");
        if (minG != null && guests < minG) throw ApiException.invalid(menuName + " is for at least " + minG + " guests.");
        if (maxG != null && guests > maxG) throw ApiException.invalid(menuName + " is for at most " + maxG + " guests.");

        List<Map<String, Object>> sections = jdbc.queryForList("""
                SELECT id, title, choose_min, choose_max FROM menu_sections WHERE menu_id = :id ORDER BY sort_order""",
                Map.of("id", sel.menuId()));
        Map<UUID, Map<String, Map<String, Object>>> offered = new HashMap<>();
        for (Map<String, Object> o : jdbc.queryForList("""
                SELECT msi.section_id, mi.id AS item_id, mi.name, mi.course, mi.diet, mi.is_available, mi.min_servings,
                       msi.extra_price_per_person
                FROM menu_section_items msi JOIN menu_items mi ON mi.id = msi.item_id
                JOIN menu_sections ms ON ms.id = msi.section_id
                WHERE ms.menu_id = :id""", Map.of("id", sel.menuId()))) {
            offered.computeIfAbsent((UUID) o.get("section_id"), k -> new HashMap<>()).put(o.get("item_id").toString(), o);
        }

        List<MenuRequests.Choice> choices = sel.choices() == null ? List.of() : sel.choices();
        Set<UUID> sectionIds = sections.stream().map(s -> (UUID) s.get("id")).collect(Collectors.toSet());
        if (choices.stream().anyMatch(c -> !sectionIds.contains(c.sectionId()))) {
            throw ApiException.invalid("This menu has changed. Refresh and choose again.");
        }

        List<Line> lines = new ArrayList<>();
        BigDecimal perPerson = (BigDecimal) menu.get("price_per_person");
        lines.add(new Line("SET_MENU", sel.menuId(), null, null, menuName, null, null, perPerson));
        for (Map<String, Object> s : sections) {
            UUID sid = (UUID) s.get("id");
            String title = (String) s.get("title");
            List<UUID> picked = choices.stream().filter(c -> c.sectionId().equals(sid)).map(MenuRequests.Choice::itemId).distinct().toList();
            int min = (Integer) s.get("choose_min");
            int max = (Integer) s.get("choose_max");
            if (picked.size() < min || picked.size() > max) {
                String n = min == max ? String.valueOf(min) : min + "–" + max;
                throw ApiException.invalid("Choose " + n + " from “" + title + "”.");
            }
            for (UUID itemId : picked) {
                Map<String, Object> o = offered.getOrDefault(sid, Map.of()).get(itemId.toString());
                if (o == null || !Boolean.TRUE.equals(o.get("is_available"))) {
                    throw ApiException.invalid("A dish you chose in “" + title + "” is no longer available. Refresh and choose again.");
                }
                assertServings(o, guests);
                BigDecimal extra = (BigDecimal) o.get("extra_price_per_person");
                perPerson = perPerson.add(extra);
                lines.add(new Line("MENU_CHOICE", sel.menuId(), itemId, title, (String) o.get("name"),
                        (String) o.get("course"), (String) o.get("diet"), extra));
            }
        }
        return new Priced("SET_MENU", sel.menuId(), menuName, perPerson, lines);
    }

    private Priced priceCustom(UUID providerId, List<UUID> itemIds, int guests) {
        List<UUID> ids = itemIds.stream().distinct().toList();
        Map<UUID, Map<String, Object>> byId = new HashMap<>();
        for (Map<String, Object> row : jdbc.queryForList("""
                SELECT id, name, course, diet, price_per_person, min_servings, is_available
                FROM menu_items WHERE provider_id = :pid AND id IN (:ids)""",
                new MapSqlParameterSource().addValue("pid", providerId).addValue("ids", ids))) {
            byId.put((UUID) row.get("id"), row);
        }
        List<Line> lines = new ArrayList<>();
        BigDecimal perPerson = BigDecimal.ZERO;
        for (UUID id : ids) {
            Map<String, Object> d = byId.get(id);
            if (d == null || !Boolean.TRUE.equals(d.get("is_available"))) {
                throw ApiException.invalid("Some dishes you chose are no longer available. Refresh the menu and try again.");
            }
            assertServings(d, guests);
            BigDecimal price = (BigDecimal) d.get("price_per_person");
            perPerson = perPerson.add(price);
            lines.add(new Line("A_LA_CARTE", null, id, null, (String) d.get("name"), (String) d.get("course"), (String) d.get("diet"), price));
        }
        lines.sort(Comparator.comparingInt(l -> COURSE_ORDER.indexOf(l.course())));
        return new Priced("CUSTOM", null, null, perPerson, lines);
    }

    private static void assertServings(Map<String, Object> dish, int guests) {
        Integer min = (Integer) dish.get("min_servings");
        if (min != null && guests < min) {
            throw ApiException.invalid("“" + dish.get("name") + "” is prepared for at least " + min + " guests.");
        }
    }

    // ================================================================== booking snapshot

    public void saveBookingLines(UUID bookingId, Priced priced, int guests) {
        for (int i = 0; i < priced.lines().size(); i++) {
            Line l = priced.lines().get(i);
            jdbc.update("""
                    INSERT INTO booking_menu_lines (booking_id, line_type, menu_id, menu_item_id, section_title, name, course, diet,
                        unit_price_per_person, guests, line_total, sort_order)
                    VALUES (:bid, :type, :mid, :iid, :sec, :name, :course, :diet, :unit, :guests, :total, :sort)""",
                    new MapSqlParameterSource().addValue("bid", bookingId).addValue("type", l.type())
                            .addValue("mid", l.menuId()).addValue("iid", l.itemId()).addValue("sec", l.sectionTitle())
                            .addValue("name", l.name()).addValue("course", l.course()).addValue("diet", l.diet())
                            .addValue("unit", l.unitPricePerPerson()).addValue("guests", guests)
                            .addValue("total", lineTotal(l, guests)).addValue("sort", i));
        }
    }

    public List<Map<String, Object>> bookingLines(UUID bookingId) {
        return jdbc.queryForList("""
                SELECT line_type AS "type", section_title AS "sectionTitle", name, course, diet,
                       unit_price_per_person AS "unitPricePerPerson", guests, line_total AS "lineTotal"
                FROM booking_menu_lines WHERE booking_id = :id ORDER BY sort_order""", Map.of("id", bookingId));
    }

    public static BigDecimal lineTotal(Line l, int guests) {
        return l.unitPricePerPerson().multiply(BigDecimal.valueOf(guests)).setScale(2, RoundingMode.HALF_UP);
    }

    // ================================================================== helpers

    private static List<String> splitAllergens(String csv) {
        return csv == null || csv.isBlank() ? List.of() : Arrays.asList(csv.split(","));
    }

    private static ApiException duplicateDish(String name) {
        return ApiException.conflict("You already have a dish called “" + name.trim() + "”.");
    }

    private static ApiException duplicateMenu(String name) {
        return ApiException.conflict("You already have a set menu called “" + name.trim() + "”.");
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
