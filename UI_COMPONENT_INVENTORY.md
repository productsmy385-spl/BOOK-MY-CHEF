# Book My Chef — UI Component Inventory

**Design System:** Premium Marketplace UI with Sharp Geometry  
**Base Colors:** `#FFFFFF`, `#0D47A1`, `#2196F3`, `#90CAF9`, `#E3F2FD`  
**Typography:** `Sora` (Headings & Numbers), `Inter` (Body & Inputs)  

---

## 1. Button Components (Zero Pill Buttons)

| Button Class / Element | Border Radius | Background | Text Color | Hover / Active State | Typical Usage |
|---|---|---|---|---|---|
| `.btn-primary` | `6px` (`rounded-md`) | `#2196F3` | `#FFFFFF` | Background `#0D47A1`, scale `0.98` | Primary call to action, "Book Now", "Reserve Tasting", "Confirm & Pay" |
| `.btn-secondary` | `6px` (`rounded-md`) | `#FFFFFF` | `#2196F3` | Border `#2196F3`, Background `#E3F2FD` | Secondary actions, "View Profile", "View Atelier", "Return Home" |
| `.btn-ghost` | `6px` (`rounded-md`) | Transparent | `#64748B` | Text `#0D47A1`, Background `#E3F2FD` | Navigation icons, filters, back buttons, audit links |
| `.btn-destructive` | `6px` (`rounded-md`) | `#EF4444` | `#FFFFFF` | Background `#DC2626`, scale `0.98` | Reject application, suspend user, cancel booking |
| Filter Chip Button | `6px` (`rounded-md`) | `#FFFFFF` / `#E3F2FD` | `#64748B` / `#0D47A1` | Border `#2196F3`, Ring 1px | Cuisine scroller, availability filter, booking tabs |

---

## 2. Input & Form Components

| Component | Border Radius | Styling & States | Usage Screen |
|---|---|---|---|
| `.input-sharp` | `6px` (`rounded-md`) | Border `#E5E7EB`, focus ring `#2196F3`, bg `#FFFFFF` | Customer auth phone input, Partner details |
| Search Bar Container | `6px` (`rounded-md`) | Border `#E5E7EB`, shadow-sm, focus-within ring 2px `#2196F3` | `CustomerHome.jsx`, `CustomerExplore.jsx` |
| Textarea Sharp | `6px` (`rounded-md`) | Border `#E5E7EB`, font-sans, leading-relaxed | `BookingStep2ServiceMode.jsx` (Special Notes) |
| Select Sharp | `6px` (`rounded-md`) | Border `#E5E7EB`, font-sans, focus ring `#2196F3` | Meal slot selector, pricing model selector |
| Date Picker Sharp | `6px` (`rounded-md`) | Border `#E5E7EB`, native date picker, font-sans | Event date booking step 1 |

---

## 3. Card & Container Components

| Component | Border Radius | Shadow / Border | Usage Screen |
|---|---|---|---|
| `.card-sharp` | `8px` (`rounded-lg`) | Border `#E5E7EB`, shadow-sm, bg `#FFFFFF` | Provider cards, quotation breakdown, metrics cards |
| Carousel Promo Card | `8px` (`rounded-lg`) | Border `#90CAF9`/50, subtle blue gradient `#f8faff` to `#E3F2FD` | `CustomerHome.jsx` (Screen 01) |
| Provider List Card | `8px` (`rounded-lg`) | Border `#E5E7EB`, hover shadow-md, cover image height 48 | `CustomerExplore.jsx` (Screen 02) |
| Menu Package Card | `8px` (`rounded-lg`) | Selected border 2px `#2196F3`, bg `#E3F2FD`/20 | `ChefProfile.jsx` |
| Escrow Guarantee Seal| `6px` (`rounded-md`) | Border `#90CAF9`, bg `#E3F2FD`, text `#0D47A1` | `BookingStep3Quotation.jsx`, `BookingStep4Payment.jsx` |
| Admin Metric Card | `8px` (`rounded-lg`) | Border `#E5E7EB`, shadow-sm, metric font-sora 24px | `AdminDashboard.jsx`, `AdminFinance.jsx` |

---

## 4. Navigation Components

| Component | Selector / File | Geometry | Key Features |
|---|---|---|---|
| Customer Bottom Nav | `CustomerBottomNav.jsx` | Fixed bottom, border-t `#E5E7EB` | Rectangular indicator `w-10 h-1 bg-[#2196F3] rounded-t-sm`, active blue text |
| Provider Bottom Nav | `ProviderBottomNav.jsx` | Fixed bottom, border-t `#E5E7EB` | Rectangular indicator `w-10 h-1 bg-[#0D47A1] rounded-t-sm`, active navy text |
| Admin Desktop Sidebar | `AdminLayout.jsx` | Width 64, bg `#0D47A1`, hidden on mobile | Sharp navigation buttons `rounded-md`, active highlight `#2196F3` |
