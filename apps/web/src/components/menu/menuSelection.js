/** Customer menu-picker state helpers (shared by MenuPicker and the booking form). */

export const EMPTY_PICK = { mode: 'none', menuId: null, choices: {}, items: [] };

/** What still has to be chosen before the selection can be priced. Empty = complete. */
export function missingChoices(value, menu) {
  if (value.mode === 'custom') return value.items.length ? [] : ['Pick at least one dish'];
  if (value.mode !== 'set') return [];
  const m = menu?.menus.find((x) => x.id === value.menuId);
  if (!m) return ['Choose a set menu'];
  return m.sections
    .filter((s) => (value.choices[s.id] || []).length < s.chooseMin)
    .map((s) => `${s.title} (${(value.choices[s.id] || []).length} of ${s.chooseMin})`);
}

/** API payload for a picker value, or undefined for "no menu". */
export function toSelection(value) {
  if (value.mode === 'set' && value.menuId) {
    return { menuId: value.menuId, choices: Object.entries(value.choices).flatMap(([sectionId, ids]) => ids.map((itemId) => ({ sectionId, itemId }))) };
  }
  if (value.mode === 'custom' && value.items.length) return { items: value.items };
  return undefined;
}
