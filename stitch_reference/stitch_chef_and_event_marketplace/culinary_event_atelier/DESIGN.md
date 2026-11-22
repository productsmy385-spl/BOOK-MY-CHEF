---
name: Culinary & Event Atelier
colors:
  surface: '#f9f9ff'
  surface-dim: '#d1daf4'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d9e2fc'
  on-surface: '#121b2e'
  on-surface-variant: '#41474e'
  inverse-surface: '#273044'
  inverse-on-surface: '#edf0ff'
  outline: '#71787f'
  outline-variant: '#c1c7cf'
  surface-tint: '#21638d'
  primary: '#21638d'
  on-primary: '#ffffff'
  primary-container: '#90caf9'
  on-primary-container: '#08557e'
  inverse-primary: '#93cdfc'
  secondary: '#0061a4'
  on-secondary: '#ffffff'
  secondary-container: '#33a0fd'
  on-secondary-container: '#00355c'
  tertiary: '#2b5bb5'
  on-tertiary: '#ffffff'
  tertiary-container: '#acc3ff'
  on-tertiary-container: '#174ca6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cbe6ff'
  primary-fixed-dim: '#93cdfc'
  on-primary-fixed: '#001e30'
  on-primary-fixed-variant: '#004b71'
  secondary-fixed: '#d1e4ff'
  secondary-fixed-dim: '#9ecaff'
  on-secondary-fixed: '#001d36'
  on-secondary-fixed-variant: '#00497d'
  tertiary-fixed: '#d9e2ff'
  tertiary-fixed-dim: '#b0c6ff'
  on-tertiary-fixed: '#001945'
  on-tertiary-fixed-variant: '#00429c'
  background: '#f9f9ff'
  on-background: '#121b2e'
  surface-variant: '#d9e2fc'
typography:
  headline-xl:
    fontFamily: Epilogue
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Epilogue
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Epilogue
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Epilogue
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  metric-price:
    fontFamily: Epilogue
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 22px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system powers a premium on-demand marketplace connecting discerning hosts with elite private chefs, bespoke caterers, and luxury event service professionals across metropolitan India. Inspired by the frictionless utility of leading commerce platforms and the refined poise of high-end editorial culinary publications, the interface prioritizes trust, culinary craftsmanship, and effortless booking.

### Personality & Values
- **Refined Precision:** Every interaction conveys high hospitality standards, verified culinary credentials, and meticulous scheduling.
- **Airy Tactility:** Generous whitespace, clean architectural cards, and crisp micro-accents reflect pristine kitchens and structured event management.
- **Warm Authority:** Deep, authoritative indigo hues ground the experience, while dynamic sky-blue highlights inject fresh vitality without ever overpowering culinary photography.

### Visual Movement
Modern Culinary Editorial Minimalist: Built on a foundation of pure white canvas backgrounds, structural pill-shaped badges, deliberate hairline dividers, and atmospheric tonal blue layering. Food imagery remains vibrant, framed inside disciplined, pill-curved surfaces.

## Colors

The palette establishes an airy, pristine visual environment. The canvas strictly stays pure white `#FFFFFF` across all root surfaces and page backgrounds, ensuring the app never feels visually dense or saturated.

### Palette Architecture
- **Root Canvas (`#FFFFFF`):** Base screen background, primary card faces, and modal overlays.
- **Primary Accent (`#90CAF9`):** Luminous sky blue used for secondary visual anchors, soft badges, and interactive feedback rings.
- **Interactive Blue (`#2196F3`):** Action blue driving primary CTAs, booking action bars, active tabs, and link affordances.
- **Deep Navy (`#0D47A1`):** High-prestige brand accents, key headline emphasis, chef mastery labels, and authoritative trust markers.
- **Soft Sky Accent Surface (`#E3F2FD`):** Tonal surface for active filter pills, selected date chips, and subtle informative banners.
- **Neutral Dark (`#172033`):** Deep charcoal-slate for primary typographic legibility and monetary figures.
- **Neutral Slate (`#64748B`):** Secondary metadata, distance indicators, cuisine tags, and caption text.
- **Subtle Outline (`#E5E7EB`):** Crisp 1px structural framing for cards, inputs, and tab containers.

## Typography

The typographic hierarchy balances expressive editorial flair with systematic clarity.

- **Headlines & Prices (Epilogue):** Epilogue provides a bold, contemporary character with geometric precision. It highlights premier culinary studio names, banquet package titles, and pricing structures (`₹`). Its tight metrics ground the brand in modern Indian metropolitan hospitality.
- **Body & Controls (Inter):** Inter handles dense operational data—guest counts, dietary breakdowns, ingredient lists, prep schedules, and user reviews. High x-height ensures immediate parsing on mobile screens under direct daylight.
- **Rupee (₹) Presentation:** All prices are set with bold weight directly preceding the integer without spacing (e.g., `₹4,500/chef`), pairing Epilogue's numeric glyphs with Inter's descriptive qualifiers.

## Layout & Spacing

The layout is anchored on an 8px rhythmic grid with a 4px baseline sub-grid for badges, micro-tags, and inline rating elements.

### Screen Architecture
- **Mobile Fluid Frame:** Standard 16px (`1rem`) outer margins ensure safe interaction zones while maximizing card image visibility.
- **Section Rhythm:**
  - `space-xs` (4px): Micro gaps between star icons and numeric ratings or verified badge icons and titles.
  - `space-sm` (8px): Spacing within chip arrays, culinary tag groups, and metadata rows.
  - `space-md` (16px): Standard internal padding for cards, search input containers, and vertical list items.
  - `space-lg` (24px): Separation between stacked modular marketplace collections (e.g., "Trending Masterchefs" to "Live Catering Counters").
  - `space-xl` (32px): Deep breathing room preceding major multi-step booking sections.
- **Touch Ergonomics:** All interactive buttons, chip selectors, counter controls, and bottom navigation tabs adhere strictly to a minimum touch footprint of 44×44px.

## Elevation & Depth

Visual hierarchy is maintained via clean planar separation rather than muddy drop shadows, ensuring the pure white backdrop remains crisp and luminous.

### Elevation Levels
- **Level 0 (Flat Surface):** Default canvas background `#FFFFFF` with zero elevation.
- **Level 1 (Card & Content Blocks):** Pure white container surfaces bounded by a crisp 1px `#E5E7EB` border and an ultra-diffused, ambient shadow: `0 2px 8px rgba(23, 32, 51, 0.04)`.
- **Level 2 (Interactive Floating Elements & Trays):** Active filters, date selector pills, and segmented toggles using `#FFFFFF` resting over a faint `#90CAF9` tint: `0 4px 14px rgba(33, 150, 243, 0.08)`.
- **Level 3 (Fixed Booking Bottom Bars & Overlays):** Bottom sheets and sticky checkout bars using a 1px top border of `#E5E7EB` coupled with `0 -4px 20px rgba(13, 71, 161, 0.06)`.

## Shapes

The interface embraces a distinctive pill-shaped and generously rounded geometry.

- **Primary Pill Components:** All primary action buttons, filter tags, search bars, and status labels employ full circular pill caps (`rounded-full` / `9999px`).
- **Surface Cards & Modals:** Service listing cards, booking summaries, and chef profile containers feature `rounded-2xl` (16px to 24px) corners, framing food and plating photography with soft, organic curves.
- **Media Containers:** Recipe thumbnails and live kitchen verification images utilize matching pill-corner radiuses to maintain harmony with surrounding cards.

## Components

### Buttons
- **Primary CTA:** Full pill shape (`rounded-full`), solid `#2196F3` fill with white text (`#FFFFFF`), Inter SemiBold 14px, minimum 48px height. Active press state shifts to `#0D47A1`.
- **Secondary CTA:** Full pill shape with a pure `#FFFFFF` background, 1.5px `#2196F3` outline, and `#2196F3` label.
- **Quick-Add Micro Buttons:** Compact 36px pill buttons with `#E3F2FD` fill, `#0D47A1` text, and subtle hover transition.

### Chips & Filter Pills
- **Unselected:** Pure white background, 1px `#E5E7EB` border, `#64748B` label text.
- **Selected:** Tinted sky-accent background `#E3F2FD`, 1px border `#90CAF9`, `#0D47A1` label text with an embedded check icon.
- **Geometry:** Height 36px, horizontal padding 14px, fully pill-shaped.

### Cards (Chef, Caterer & Event Services)
- **Base Style:** `#FFFFFF` background, 1px `#E5E7EB` perimeter outline, `rounded-2xl` corners, subtle ambient Level 1 elevation.
- **Layout:** Edge-to-edge aspect ratio 16:9 imagery topped with floating status badges (e.g., "FSSAI Verified", "⭐ 4.9 (1.2k)").
- **Metadata Matrix:** Chef name in Epilogue 18px SemiBold, followed by cuisine types in `#64748B` Inter 13px, completed with a clear price tag (`₹1,800/event`) in Epilogue 16px Bold.

### Form Inputs & Search Fields
- **Search Header:** Pill-shaped 48px container, `#FFFFFF` surface with a 1px `#E5E7EB` border, featuring a soft blue focus ring (`#90CAF9` 2px offset).
- **Date & Guest Pickers:** Segmented card inputs with clear icon affordances and high-contrast numerical readouts.

### Trust Badges & Verified Markers
- **Verified Shield:** Crisp deep-navy badge (`#0D47A1`) or sky-blue icon (`#2196F3`) displaying checkmark certifications.
- **Rating Marker:** Pill shape, `#172033` background with an amber star `#FFB300` and crisp white 12px bold score.