# BOOK MY CHEF — Multi-Service Culinary & Event Marketplace

A production-ready, full-stack marketplace connecting customers with professional service providers: Home Chefs, Professional Chefs, Personal Chefs, Caterers, Event Planners, Event Managers, Decorators, Photographers, Videographers, Bartenders, Waiters/Servers, and Kitchen Assistants.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Frontend Web** | React 19, Vite, Tailwind CSS, Lucide Icons, Sora typography | 24 pixel-perfect screens adhering to Stitch design system and pure white background (#FFFFFF) |
| **Mobile App** | Capacitor 7 | Native Android & iOS wrappers with native hardware bridge |
| **Backend API** | Java 21, Spring Boot 3.3.5, Spring Security, Hibernate | 53 compiled classes, 9 packages, pessimistic write-locking, 17-state booking FSM |
| **Database** | PostgreSQL 16, Flyway | 74 normalized tables, ACID transactions, UUID keys, strict state constraints |
| **Authentication** | Clerk Phone OTP + PostgreSQL user sync | Real SMS OTP delivery (+91 India allowlist), zero plaintext passwords/secrets |
| **Payments** | Razorpay Gateway | Advance payment creation, escrow holding, webhook/HMAC-SHA256 signature verification |
| **Deployment** | Railway PaaS | Automated multi-service deployment (Postgres + Spring Boot + React Web) |

---

## 📱 Three Independent Consoles & Strict Route Enforcing

1. **Customer Console (`/customer/home`, `/explore`, `/chef/:id`, `/booking/*`, `/tracking/:id`, `/review/:id`)**
   - High-fidelity discovery, instant filters by cuisine, dietary badges, and service mode (Host's Home, Prep & Delivery, Chef's Studio).
   - Real-time milestone tracker (`PENDING` → `PROVIDER_ACCEPTED` → `IN_PROGRESS` → `COMPLETED`).
   - Multi-criteria rating submission (Taste, Hygiene, Punctuality, Hospitality).

2. **Service Provider Console (`/provider/dashboard`, `/provider/services`, `/provider/wallet`, `/provider/calendar`)**
   - Multi-role profile registration (support for up to 12 distinct roles with individual pricing models).
   - Inbound quotation request negotiation, booking acceptance/rejection.
   - Escrow earnings wallet with release verification.

3. **Platform Administrator Console (`/admin`, `/admin/verification`, `/admin/bookings`, `/admin/finance`, `/admin/audit`)**
   - Invitation-only authentication (no public self-registration).
   - Provider KYC & FSSAI document verification approval workflow.
   - Marketplace-wide GMV, net commissions, transaction dispute arbitration, and immutable audit logs.

---

## 🚀 Quickstart Local Development

### 1. Prerequisites
- Java 21 LTS
- Node.js 20+ & npm 10+
- Docker (for PostgreSQL 16)

### 2. Database Setup
```bash
docker run --name book_my_chef_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=book_my_chef -p 5432:5432 -d postgres:16-alpine
```

### 3. Backend (Spring Boot)
```bash
cd apps/backend
mvn clean spring-boot:run
# Server runs on http://localhost:8080 (Swagger UI at http://localhost:8080/swagger-ui.html)
```

### 4. Frontend Web (React + Vite)
```bash
cd apps/web
npm install
npm run dev
# Web application runs on http://localhost:5173
```

### 5. Native Android (Capacitor)
```bash
cd apps/web
npm run build
npx cap sync android
npx cap open android
```

---

## 🔐 Environment Variables

See `.env.example` for the complete configuration schema for Railway, Clerk, Razorpay, and ImageKit.

---

## 📄 License
Proprietary & Confidential — Book My Chef Inc.
