# UI/UX Design System & Typography Guidelines

**Project:** Culinary & Event Atelier ("BOOK MY CHEF") — Multi-Service Chef, Catering & Event Services Marketplace  
**Design Archetype:** Modern Culinary Editorial Minimalist  
**Authoritative Font Standard:** **Sora** (Primary Brand, Display & UI Font)  
**Authoritative Color Palette Reference:** Uploaded Palette Card (`#E3F2FD`, `#90CAF9`, `#2196F3`, `#0D47A1`, `#FFFFFF`)  

---

## 1. Design Philosophy: Modern Culinary Editorial Minimalist

The BOOK MY CHEF design system merges the operational clarity of India's leading consumer logistics platforms (Swiggy, Zomato, BookMyShow) with the understated elegance of luxury culinary magazines. 

### Mandatory Cardinal Rules
1. **The Root Canvas Must Be Pure White (`#FFFFFF`):** The entire application background across all customer, provider, and administrative screens must remain pure white. Never tint the root page canvas blue or gray.
2. **Blue As Functional Accent:** Blue tones are strictly reserved for primary action buttons, active navigation indicators, rating star outlines, verification badges, and focus rings.
3. **Typography Standard: Sora Font:** All screen headlines, hero banners, price numbers (`₹`), card titles, button labels, and body text must render with the **Sora** typeface.
4. **Photographic Primacy:** High-resolution culinary plating, chef portraits, and banquet settings are framed with pill-shaped corners (`rounded-2xl` / 16px-24px) and subtle 1px hairline perimeters.

---

## 2. Color Tokens & Semantic Application

```css
:root {
  /* Canvas Surfaces */
  --color-canvas-root: #FFFFFF;              /* Pure White page background */
  --color-surface-card: #FFFFFF;             /* Elevated card faces */
  --color-surface-soft: #E3F2FD;             /* Very Light Blue - soft cards & filter pills */
  --color-surface-tint: #F1F5F9;             /* Light gray surface for table strips */
  
  /* Brand Blue Hierarchy */
  --color-blue-light: #E3F2FD;              /* Subtle backgrounds & chip fills */
  --color-blue-sky: #90CAF9;                /* Secondary highlights, focus halos */
  --color-blue-primary: #2196F3;            /* Primary buttons, booking CTAs, active tabs */
  --color-blue-deep: #0D47A1;               /* Deep Navy - titles, verified badges, drawer */
  
  /* Typographic Contrast */
  --color-text-main: #172033;               /* High-contrast charcoal for titles & prices */
  --color-text-muted: #64748B;              /* Slate for subtitles, cuisines, and captions */
  --color-text-inverse: #FFFFFF;            /* White text on solid blue buttons */
  
  /* Borders & Dividers */
  --color-border-subtle: #E5E7EB;           /* Clean 1px card perimeters */
  --color-border-focus: #90CAF9;            /* Input focus perimeter */
  
  /* Status Feedback */
  --color-success: #10B981;                 /* Green - confirmed bookings, verified badge */
  --color-rating-star: #FFB300;             /* Amber gold - star ratings */
  --color-alert: #EF4444;                   /* Red - cancellation warnings, dispute badges */
}
```

---

## 3. Sora Typography Architecture

The application loads **Sora** from Google Fonts, utilizing its geometric structure and distinctive character for maximum legibility on mobile screens.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

### Typographic Hierarchy Specification

| Semantic Role | Sora Weight | Size | Line Height | Tracking | CSS Class | Sample Application |
|---|---|---|---|---|---|---|
| **Display Hero** | 800 (ExtraBold) | 32px | 38px | -0.02em | `font-display-hero` | Hero banner promo headlines |
| **Screen Title** | 700 (Bold) | 24px | 30px | -0.015em | `font-screen-title` | Screen headers ("Explore Ateliers") |
| **Section Header** | 600 (SemiBold) | 20px | 26px | -0.01em | `font-section-head` | "Trending Masterchefs", "Menu Packages" |
| **Card Title** | 600 (SemiBold) | 17px | 22px | 0 | `font-card-title` | "Chef Raghavendra Rao" |
| **Price Tag** | 700 (Bold) | 18px-22px | 24px | -0.01em | `font-price` | `₹1,499/person`, `₹25,000` |
| **Body Regular** | 400 (Regular) | 14px | 20px | 0 | `font-body-regular` | Bios, dietary descriptions |
| **Body Small** | 400 (Regular) | 12px | 16px | 0 | `font-body-sm` | Distance indicators, captions |
| **Button Label** | 600 (SemiBold) | 14px | 18px | +0.01em | `font-btn-label` | "Book Now", "Reserve Chef" |
| **Micro Badge** | 700 (Bold) | 10px-11px | 14px | +0.02em | `font-badge-micro` | "FSSAI VERIFIED", "POPULAR" |

---

## 4. Spacing System & Mobile Layout Ergonomics

- **8px Grid System:** Every spacing token is a multiple of 8px (`8px`, `16px`, `24px`, `32px`, `40px`, `48px`).
- **Standard Outer Gutter:** Exactly `16px` (`1rem`) on left and right margins of mobile viewport.
- **Minimum Touch Footprint:** Every button, tab, chip, and interactive toggle has a minimum clickable area of `44px × 44px`.
- **Card Padding:**
  - Content cards: `16px` internal padding.
  - Promotional banners: `16px` to `20px` internal padding.
- **Border Radii Geometry:**
  - Action buttons, filter pills, search input: `rounded-full` (`9999px`).
  - Service cards, profile containers, modal sheets: `rounded-2xl` (`16px` to `20px`).
  - Thumbnail images: `rounded-xl` (`12px`).

---

## 5. Component Library Specifications

### 5.1 Buttons
- **Primary Action CTA:** Full pill (`rounded-full`), solid `#2196F3` background, `#FFFFFF` Sora 14px font, minimum height 48px, subtle shadow `0 4px 14px rgba(33, 150, 243, 0.25)`. Active press state shifts to Deep Navy `#0D47A1`.
- **Secondary CTA:** Full pill (`rounded-full`), `#FFFFFF` background, 1.5px `#2196F3` outline, `#2196F3` text.
- **Quick-Add Micro Button:** Compact 36px pill with `#E3F2FD` fill, `#0D47A1` label, active scale down `active:scale-95`.

### 5.2 Filter Chips & Pills
- **Unselected:** `#FFFFFF` fill, 1px `#E5E7EB` outline, `#64748B` text, 36px height.
- **Selected:** Tinted Sky fill `#E3F2FD`, 1px `#90CAF9` border, `#0D47A1` text with embedded checkmark icon.

### 5.3 Service Listing Cards
- Edge-to-edge 16:9 ratio high-resolution culinary photography.
- Floating top badges: Verified shield (`#0D47A1`), Star rating (`#172033` pill with `#FFB300` star).
- Bottom metadata container on pure white face: Provider name in Sora 17px SemiBold, cuisine tag row, starting price in bold, and instant CTA button.

### 5.4 Metric Cards (Provider & Admin)
- Pure white container with 1px `#E5E7EB` border.
- 40px circular icon badge in `#E3F2FD` with `#2196F3` icon.
- Metric figure in Sora 22px Bold `#172033`.
- Descriptive label in Slate `#64748B`.

---

## 6. Mobile Navigation Architecture

### 6.1 Customer Bottom Navigation (Strict 5 Items)
Fixed at screen bottom with `backdrop-blur-xl`, safe area bottom padding, and 64px height.
1. **Home:** `home` icon | Label: "Home"
2. **Explore:** `compass` / `explore` icon | Label: "Explore"
3. **Bookings:** `calendar_month` icon | Label: "Bookings"
4. **Favourites:** `favorite` icon | Label: "Favourites"
5. **Profile:** `person` icon | Label: "Profile"

*Active state: Solid Primary Blue `#2196F3` icon and bold label with subtle blue active dot.*

### 6.2 Provider Bottom Navigation (Strict 5 Items)
1. **Dashboard:** `dashboard` icon | Label: "Dashboard"
2. **Services:** `restaurant_menu` icon | Label: "Services"
3. **Bookings:** `receipt_long` icon | Label: "Bookings"
4. **Calendar:** `calendar_today` icon | Label: "Calendar"
5. **Profile:** `account_circle` icon | Label: "Profile"

### 6.3 Side Drawers (Contextual Navigation)
Triggered by tapping avatar or menu button. Pure white sheet sliding in from left/right containing secondary account links:
- My Profile
- Saved Addresses
- Payment Methods
- Escrow Wallet
- Notification Preferences
- Help & Support (FAQ)
- Terms of Service & Cancellation Policy
- Logout
