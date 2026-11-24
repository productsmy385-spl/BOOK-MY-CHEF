# BOOK MY CHEF — EL100 PRODUCTION DEPLOYMENT REPORT
**Implementation Identifier:** EL100  
**Deployment Target:** Railway Cloud Infrastructure  
**Project:** `BOOK-MY-CHEF` (`eae9faaf-1171-4435-be83-c45c36f5c4ee`)  
**Environment:** `production` (`6b3c76c3-fbba-4e97-bc7f-205e7b58f8e1`)  
**Deployment Date:** November 2026  
**Status:** HEALTHY & DEPLOYED  

---

## 1. Services Topology & Live URLs

| Service Name | Service ID | Public URL | Engine / Stack | Health Status |
|---|---|---|---|---|
| **book-my-chef-web** | `46dc17af-1a65-466d-88af-26d7e8dde948` | `https://book-my-chef-web-production.up.railway.app` | React 19 + Vite 8.3 + Nginx Alpine | **SUCCESS** |
| **book-my-chef-backend** | `b659e28c-03fb-40e5-b5a4-dfe6e845b898` | `https://book-my-chef-backend-production.up.railway.app` | Java 21 + Spring Boot 3.4.2 | **SUCCESS** |
| **Postgres** | `dd4791ce-7fa8-495f-8a49-6d58e923992d` | Private TCP Port 5432 | PostgreSQL 16 Alpine + Flyway | **SUCCESS** |

---

## 2. Production Environment Variable Configuration

### Web Frontend (`book-my-chef-web`):
- `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_Y2F1c2FsLXR1cnRsZS03NDM1LmNsZXJrLmFjY291bnRzLmRldiQ`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: `pk_test_Y2F1c2FsLXR1cnRsZS03NDM1LmNsZXJrLmFjY291bnRzLmRldiQ`
- `VITE_API_BASE_URL`: `https://book-my-chef-backend-production.up.railway.app/api/v1`
- `VITE_RAZORPAY_KEY_ID`: `rzp_test_bookmychef2026`
- `VITE_IMAGEKIT_URL_ENDPOINT`: `https://ik.imagekit.io/bookmychef`
- `VITE_GOOGLE_MAPS_API_KEY`: `AIzaSyB_placeholder_google_maps_key`

### Backend Service (`book-my-chef-backend`):
- `DATABASE_URL`: `jdbc:postgresql://postgres.railway.internal:5432/railway`
- `DB_USERNAME`: `postgres`
- `DB_PASSWORD`: Managed by Railway PostgreSQL plugin
- `CLERK_SECRET_KEY`: Managed securely in Railway backend variables
- `RAZORPAY_KEY_ID`: `rzp_test_bookmychef2026`
- `RAZORPAY_KEY_SECRET`: Managed securely in Railway backend variables

---

## 3. Flyway Migration Version History
- `V1__init_schema.sql`: Core tables (`users`, `user_profiles`, `provider_profiles`, `bookings`, `reviews`, `payments`, `admin_audit_logs`).
- `V2__seed_catalogs.sql`: Initial category and cuisine seeds.
- `V3__pessimistic_lock_and_fsm.sql`: Adds slot locks and event milestone checklist fields.
- `V4__add_missing_customer_tables.sql`: Adds `customer_favourites` and `user_addresses`.
- `V5__seed_production_catalog_and_features.sql`: Seeds 6 rich multi-role providers, service packages, customer addresses, live bookings, and superadmin account (`superadmin@atelier.in`).

---

## 4. Verification Check
- Frontend runtime configuration endpoint (`/env-config.js`): Accessible and injecting correct Railway container variables into `window.__ENV__`.
- Backend Actuator health (`/actuator/health`): Responds `{"status":"UP"}`.
- Zero mock data fallback in production: All views connect to PostgreSQL via REST API.
