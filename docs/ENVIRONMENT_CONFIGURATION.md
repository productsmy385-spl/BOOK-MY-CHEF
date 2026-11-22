# BOOK MY CHEF — Environment Configuration Guide

## 1. Environment Variable Architecture

| Variable | Scope | Target Service | Purpose & Guidelines |
| :--- | :--- | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Public** | `book-my-chef-web` | Public Clerk key (`pk_test_...` or `pk_live_...`). Embedded into the client bundle at build/runtime. Safe for browser exposure. |
| `VITE_API_BASE_URL` | **Public** | `book-my-chef-web` | Base URL for Spring Boot backend (e.g. `https://book-my-chef-backend-production.up.railway.app/api/v1`). |
| `CLERK_SECRET_KEY` | **Private** | `book-my-chef-backend` | Private server key (`sk_test_...` or `sk_live_...`). **NEVER expose to frontend or git.** |
| `CLERK_WEBHOOK_SECRET` | **Private** | `book-my-chef-backend` | Svix webhook signing secret (`whsec_...`) used to verify Clerk event authenticity. |
| `SPRING_DATASOURCE_URL` | **Private** | `book-my-chef-backend` | JDBC URL for PostgreSQL instance (`jdbc:postgresql://postgres:5432/book_my_chef`). |
| `SPRING_DATASOURCE_USERNAME` | **Private** | `book-my-chef-backend` | Database user (e.g. `postgres`). |
| `SPRING_DATASOURCE_PASSWORD` | **Private** | `book-my-chef-backend` | Database password. |
| `RAZORPAY_KEY_ID` | **Public/Private** | Both / Backend | Merchant ID from Razorpay Dashboard. |
| `RAZORPAY_KEY_SECRET` | **Private** | `book-my-chef-backend` | Merchant Secret used for HMAC-SHA256 signature verification. |
| `IMAGEKIT_PUBLIC_KEY` | **Public** | `book-my-chef-web` | Public key for CDN image rendering. |
| `IMAGEKIT_PRIVATE_KEY` | **Private** | `book-my-chef-backend` | Private key used to generate signed client upload tokens. |

---

## 2. Local Development Setup

Create `apps/web/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_CLERK_PUBLISHABLE_KEY
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Create `apps/backend/.env` or export in environment:
```env
CLERK_SECRET_KEY=sk_test_YOUR_CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_CLERK_WEBHOOK_SECRET
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/book_my_chef
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
RAZORPAY_KEY_ID=rzp_test_bookmychef123
RAZORPAY_KEY_SECRET=test_secret_key_placeholder
```

---

## 3. Production Railway Setup

In your Railway project **BOOK-MY-CHEF**:

### Service 1: `book-my-chef-web` (Frontend)
1. Go to **Variables** tab.
2. Ensure the following variables are set:
   - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_live_...` (or your active `pk_test_...`)
   - `VITE_API_BASE_URL`: `https://${{book-my-chef-backend.RAILWAY_PUBLIC_DOMAIN}}/api/v1`
3. Click **Redeploy** so the new Dockerfile build and `entrypoint.sh` inject the variables.

### Service 2: `book-my-chef-backend` (Backend)
1. Go to **Variables** tab.
2. Add:
   - `CLERK_SECRET_KEY`: `sk_live_...` (or active `sk_test_...`)
   - `CLERK_WEBHOOK_SECRET`: `whsec_...`
   - `RAZORPAY_KEY_ID`: `rzp_live_...`
   - `RAZORPAY_KEY_SECRET`: Live Razorpay Secret
