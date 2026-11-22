# COMPONENT ALIGNMENT REPORT
## BOOK MY CHEF — Multi-Service Chef, Catering & Event Booking Marketplace

**Audit Date:** November 22, 2026  
**Auditor:** Principal Frontend Engineer & Design System Architect  
**Focus:** Input Alignment Defect Resolution, Button Symmetry & Structural Grid Alignment  

---

### 1. Root Cause Analysis: Mobile Phone Input Overlap Defect

#### 1.1 The Identified Bug
In the user's provided screenshot, the country code section (`IN +91`) overlapped directly onto the placeholder text (`Enter 10-digit mobile number`), causing visual collision and severe readability failure.

#### 1.2 The Root Cause
Inspection of `CustomerAuth.jsx`, `PartnerAuth.jsx`, and `AdminLogin.jsx` revealed the following fragile implementation pattern:

```jsx
/* DEFECTIVE PATTERN */
<div className="relative flex items-center">
  <div className="absolute left-3.5 flex items-center gap-1.5 border-r border-[#CBD5E1] pr-2">
    <span className="text-sm">🇮🇳</span>
    <span className="font-sora font-bold text-xs text-[#0D47A1]">+91</span>
  </div>
  <input
    type="tel"
    required
    value={mobileNumber}
    placeholder="Enter 10-digit mobile number"
    className="input-sharp w-full pl-20 font-mono font-bold tracking-wider"
  />
</div>
```

**Why this breaks:**
1. **Absolute Positioning Decoupling:** Placing the prefix in an `absolute` layer removed it from the flex document flow.
2. **Font Rendering Inconsistencies:** The width of the flag emoji (`🇮🇳`) varies dramatically across Windows 10/11 (rendering a 2-letter fallback or colored glyph), iOS (Apple Color Emoji), Android (Noto Color Emoji), and macOS. On Windows and high-DPI screens, the combined width of `left-3.5 (14px) + flag (20px) + space (6px) + "+91" (26px) + border (1px) + padding (8px)` totaled **75px–85px**.
3. **Padding Underflow:** Fixed padding `pl-20` (80px) left only zero to five pixels before placeholder text began, causing immediate visual overlapping.

#### 1.3 Architectural Fix: The Pure Flexbox `<PhoneInput />` Component
We permanently resolved this defect by creating a dedicated, reusable component: `apps/web/src/components/common/PhoneInput.jsx`.

```jsx
/* ARCHITECTURAL SOLUTION (Pure Flexbox Container) */
<div className="flex items-center h-12 w-full bg-white border border-[#CBD5E1] rounded-md focus-within:border-[#2196F3] focus-within:ring-2 focus-within:ring-[#2196F3]/25 transition-all overflow-hidden shadow-xs">
  {/* Isolated Country Code Prefix Container with Crisp Right Border */}
  <div className="h-full px-3.5 bg-[#F8FAFC] border-r border-[#CBD5E1] flex items-center gap-1.5 shrink-0 select-none">
    <span className="text-base leading-none" role="img" aria-label="India Flag">🇮🇳</span>
    <span className="font-sora font-bold text-xs text-[#0D47A1] tracking-wide">+91</span>
  </div>

  {/* Fully Independent Input Area - Overlap Physically Impossible */}
  <input
    type="tel"
    inputMode="numeric"
    pattern="[0-9]*"
    maxLength={10}
    value={cleanDigits}
    onChange={handleInputChange}
    placeholder="Enter 10-digit mobile number"
    className="flex-1 h-full px-3.5 bg-transparent border-0 outline-none font-mono font-semibold text-sm text-[#172033] placeholder:text-[#94A3B8] placeholder:font-sans placeholder:font-normal placeholder:text-xs"
  />

  {/* Verified Digit Counter Pill (e.g. 10/10) */}
  {cleanDigits.length > 0 && (
    <div className="pr-3 shrink-0 select-none">
      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
        {cleanDigits.length}/10
      </span>
    </div>
  )}
</div>
```

**Why this solution is bulletproof:**
- **Zero Absolute Positioning:** The prefix and input are direct sibling flex items.
- **Physical Boundary Divider:** The right border `border-r border-[#CBD5E1]` physically separates the prefix container from the input area.
- **Independent Input Origin:** The input field begins exactly at the right border divider with its own `px-3.5` (14px) internal padding.
- **Dynamic Content Scaling:** Regardless of flag rendering, emoji font metrics, or zoom percentage, the input dynamically consumes the remainder (`flex-1`) of the 100% container width.
- **10-Digit Constraint:** Automatically strips `+91` if pasted by user, accepts only numeric digits, and presents a neat `X/10` status indicator.

---

### 2. Button Alignment & Geometric Standards

To eliminate pill buttons (`rounded-full`) and inconsistent button heights, the platform enforces 4 standardized button classes:

| Class Name | Height | Padding | Border Radius | Background | Text Color | Typography |
|---|---|---|---|---|---|---|
| `.btn-primary` | `46px` (2.875rem) | `0 1.25rem` (20px) | `6px` (`rounded-md`) | `#2196F3` | `#FFFFFF` | Sora 14px, Bold (600) |
| `.btn-navy` | `46px` (2.875rem) | `0 1.25rem` (20px) | `6px` (`rounded-md`) | `#0D47A1` | `#FFFFFF` | Sora 14px, Bold (600) |
| `.btn-secondary` | `46px` (2.875rem) | `0 1.25rem` (20px) | `6px` (`rounded-md`) | `#FFFFFF` (1px `#2196F3`) | `#2196F3` | Sora 14px, Bold (600) |
| `.btn-ghost` | `40px` (2.5rem) | `0 0.875rem` (14px) | `6px` (`rounded-md`) | `transparent` | `#64748B` | Sora 14px, Medium (500) |
| `.btn-destructive`| `46px` (2.875rem) | `0 1.25rem` (20px) | `6px` (`rounded-md`) | `#DC2626` | `#FFFFFF` | Sora 14px, Bold (600) |

#### Standard Button Layout Code:
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.875rem;
  min-height: 44px; /* Mobile touch minimum target */
  padding: 0 1.25rem;
  background-color: #2196F3;
  color: #ffffff;
  font-family: 'Sora', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.15s ease-in-out;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) {
  background-color: #0D47A1;
}
.btn-primary:active:not(:disabled) {
  transform: scale(0.98);
}
```

---

### 3. Form Input Standards (`.input-sharp`)

All text inputs, email fields, numeric fields, and textareas adhere to:
- **Height:** 48px (`h-12`) for single-line inputs.
- **Padding:** 14px horizontal (`px-3.5`).
- **Border:** 1px solid `#CBD5E1` (`border-[#CBD5E1]`).
- **Corner Radius:** 6px (`rounded-md`).
- **Focus State:** 2px ring `#2196F3` with 20% opacity (`focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/25`).
- **Typography:** Inter 14px, `#172033`.

---

### 4. Card & Container Alignment (`.card-sharp`)

- **Border Radius:** 8px (`rounded-lg`).
- **Border:** 1px solid `#E5E7EB`.
- **Background:** `#FFFFFF`.
- **Shadow:** 0 1px 3px 0 rgba(0, 0, 0, 0.04) (`shadow-xs`).
- **Internal Padding Scale:** 16px (`p-4`) on mobile, 20px–24px (`p-5` to `p-6`) on desktop.
