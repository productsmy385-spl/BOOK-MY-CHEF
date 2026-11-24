# Global Form Design System & Sharp Geometry Specification

## Philosophy
Book My Chef adheres to a **Sharp Geometry & High-Contrast Editorial Design System**:
- **Geometry**: Precise 6px corners (`rounded-md`). No bubble or pill shapes (`rounded-full` prohibited for form inputs/containers).
- **Typography**: 
  - Headings: Sora (Extrabold 800 / Bold 700) with tight tracking (`-0.03em`).
  - Body & Form Controls: Inter (Regular 400 / Medium 500 / Semi-Bold 600).
- **Color Palette**:
  - Primary Action / Deep Navy: `#0D47A1`
  - Interactive Accent / Cerulean Blue: `#2196F3`
  - High-Contrast Background: Pure White (`#FFFFFF`) / Dark Navy Atelier (`#0D47A1`)
  - Neutral Borders: `#CBD5E1` (Default) / `#94A3B8` (Hover)
  - Text Primary: `#172033` (WCAG AAA compliant on white)
  - Text On Dark: `#FFFFFF` (WCAG AAA compliant on `#0D47A1`)
  - Error Accent: `#EF4444` / Crimson Alert (`#B91C1C`)

---

## 1. Universal Form Input Architecture (`FormInput`)

All inputs across the platform must utilize the centralized `FormInput` component (`apps/web/src/components/common/FormInput.jsx`).

### Component Hierarchy
```
FormInput
├── Label (<label htmlFor={id} className="font-sora font-bold uppercase text-[10px] text-[#172033]">)
├── InputContainer (div.w-full.h-12.bg-white.rounded-md.border.flex.items-center)
│   ├── LeadingIcon (div.w-11.h-full.flex.items-center.justify-center.shrink-0.text-[#64748B])
│   ├── NativeInput (input.flex-1.h-full.bg-transparent.border-0.outline-none.text-[#172033].text-sm)
│   └── TrailingAction (div.h-full.flex.items-center.pr-3.shrink-0)
├── HelperText (span.text-[11px].text-[#64748B])
└── ErrorMessage (span.text-xs.text-red-600.flex.items-center.gap-1)
```

### Visual Specifications
- **Height**: 48px (`h-12`).
- **Border Radius**: 6px (`rounded-md`).
- **Border**: 1px solid `#CBD5E1`.
- **Hover State**: Border `#94A3B8`.
- **Focus State**: Border `#2196F3`, outer ring `2px rgba(33, 150, 243, 0.2)`.
- **Error State**: Border `#F87171`, focus ring `2px rgba(239, 68, 68, 0.1)`.
- **Leading Icon**: Dedicated flex item with width 44px (`w-11`), pointer-events-none, ensuring zero text overlap.

---

## 2. Six-Digit OTP Input Specification (`OtpInput6`)

For OTP verification workflows, the platform provides `OtpInput6`:
- **6 Individual Numeric Boxes**: Each box is `w-12 h-14` (or responsive `w-10 sm:w-12`), centered text, 20px font, 6px radius (`rounded-md`).
- **Input Filtering**: Digits 0–9 only (`inputMode="numeric"`, `pattern="[0-9]*"`, `autoComplete="one-time-code"`).
- **Navigation**:
  - Auto-advance to next input on digit entry.
  - Auto-focus previous input on backspace.
  - Left / Right arrow navigation.
  - Clipboard paste support (parses 6-digit text from clipboard and auto-populates all 6 boxes).
- **Auto-Submission**: Automatically triggers verification when the 6th digit is filled.
- **Cooldown Timer**: 60-second animated resend countdown to prevent spam and rate limits.

---

## 3. Dark Section Typography Rules

When rendering typography on dark or saturated blue surfaces (`#0D47A1`):
1. **Never** combine `.heading-1` with Tailwind `.text-white` directly, as `.heading-1` declares hardcoded `#172033`.
2. **Always** use `.heading-1-on-dark`:
   ```html
   <h2 class="heading-1-on-dark">Discover verified masterchefs...</h2>
   ```
3. Subtitles and supporting copy must use `#E3F2FD` or `#90CAF9` to maintain minimum 4.5:1 contrast.
