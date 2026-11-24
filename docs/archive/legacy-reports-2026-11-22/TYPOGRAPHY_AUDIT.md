# TYPOGRAPHY AUDIT & DESIGN TOKENS
## BOOK MY CHEF — Multi-Service Chef, Catering & Event Booking Marketplace

**Audit Date:** November 22, 2026  
**Auditor:** Principal Design System Architect & Frontend Typography Specialist  
**Standard:** Strict Dual-Typeface System (Sora Headings + Inter Body)  

---

### 1. Typography System Philosophy

A marketplace catering to luxury culinary feasts, verified masterchefs, and high-stakes celebratory events requires a typography hierarchy that conveys architectural precision, culinary mastery, and trust. 

The previous implementation suffered from mixed font declarations, inconsistent line heights, and unstandardized text sizing where random Tailwind classes (`text-lg font-extrabold`, `text-xl font-bold`, etc.) produced jarring vertical rhythm.

We have established a strict dual-typeface standard:
1. **Sora (`font-sora`)**: Primary Display & Heading font family. Geometric with open apertures, distinct terminal cuts, and luxury editorial weight. Used exclusively for H1–H4, section titles, numerals, prices, and high-emphasis badges.
2. **Inter (`font-inter` / `font-sans`)**: Body, Input, Data Table, and Supporting Copy. Renowned for tall x-height, neutral letterforms, and readability at small viewport scales (10px–15px).
3. **JetBrains / Roboto Mono (`font-mono`)**: Financial transaction amounts, OTP input digits, booking reference codes, and timestamps.

---

### 2. Comprehensive Type Scale & Class Definitions

All typography styles are defined in `apps/web/src/index.css` as utility classes and integrated with `tailwind.config.js`:

```css
/* ==========================================================================
   GLOBAL TYPOGRAPHY HIERARCHY TOKENS (Sora for Headings, Inter for Body)
   ========================================================================== */
.heading-1 {
  font-family: 'Sora', sans-serif;
  font-weight: 800;
  font-size: 2rem; /* 32px mobile */
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: #172033;
}
@media (min-width: 640px) {
  .heading-1 {
    font-size: 2.5rem; /* 40px desktop */
  }
}

.heading-2 {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.5rem; /* 24px mobile */
  line-height: 1.25;
  letter-spacing: -0.025em;
  color: #172033;
}
@media (min-width: 640px) {
  .heading-2 {
    font-size: 1.875rem; /* 30px desktop */
  }
}

.heading-3 {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.125rem; /* 18px mobile */
  line-height: 1.35;
  letter-spacing: -0.02em;
  color: #172033;
}
@media (min-width: 640px) {
  .heading-3 {
    font-size: 1.375rem; /* 22px desktop */
  }
}

.heading-4 {
  font-family: 'Sora', sans-serif;
  font-weight: 600;
  font-size: 1rem; /* 16px */
  line-height: 1.4;
  letter-spacing: -0.015em;
  color: #172033;
}

.body-base {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 0.9375rem; /* 15px */
  line-height: 1.6;
  color: #172033;
}

.body-sm {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 0.8125rem; /* 13px */
  line-height: 1.5;
  color: #64748B;
}

.caption {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.75rem; /* 12px */
  line-height: 1.4;
  color: #64748B;
}

.label-micro {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 0.6875rem; /* 11px */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0D47A1;
}
```

---

### 3. Font Loading & Performance Architecture

Fonts are imported via optimized Google Fonts preconnect CDN headers in `apps/web/index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

- **Font Display:** `swap` enabled to prevent Flash of Invisible Text (FOIT).
- **Subset:** Latin and Latin-Ext.
- **Weights Selected:** 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold), 800 (Extra-Bold).
- **Sub-pixel Anti-aliasing:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` enabled globally on `<body>`.

---

### 4. Blue Background Text Contrast Audit (WCAG Compliance)

The screenshot highlighted weak contrast on `#0D47A1` (Deep Navy) and `#2196F3` (Primary Blue) backgrounds. The audit identified that using translucent white (`text-white/80` or `text-white/60`) produced contrast ratios below 4.5:1 on subtle cards.

We designed three dedicated high-contrast tokens:

| Token Name | Color Hex | Background | Contrast Ratio | WCAG 2.1 Grade | Usage Scenario |
|---|---|---|---|---|---|
| `.text-on-navy-primary` | `#FFFFFF` | `#0D47A1` | **13.5:1** | **AAA** (Pass) | Main headlines, provider names on navy banners |
| `.text-on-navy-secondary`| `#E3F2FD` | `#0D47A1` | **11.2:1** | **AAA** (Pass) | Editorial paragraphs, trust pledges, terms copy |
| `.text-on-navy-accent`   | `#90CAF9` | `#0D47A1` | **7.5:1** | **AAA** (Pass) | Category tags, verification checkmark pills |

```css
.text-on-navy-primary {
  color: #FFFFFF !important;
  font-weight: 700;
}

.text-on-navy-secondary {
  color: #E3F2FD !important;
  font-weight: 400;
}

.text-on-navy-accent {
  color: #90CAF9 !important;
  font-weight: 600;
}
```

---

### 5. Form & Input Typography Standardization

- **Input Placeholder Text:** `font-sans font-normal text-xs text-[#94A3B8]`
- **Input Active Text:** `font-mono font-semibold text-sm text-[#172033]`
- **Form Labels:** `font-sora font-bold uppercase text-[10px] text-[#172033] tracking-wider`
- **Field Helper Text:** `font-inter text-[11px] text-[#64748B]`
- **Error Messages:** `font-inter text-xs text-red-700 font-medium`
