# End-to-end tests

Browser tests (Playwright) run against a real backend and PostgreSQL. Clerk is
replaced by `support/fake-clerk.mjs`, a local RS256 token issuer; the backend
verifies its tokens with exactly the same code path it uses for Clerk.

## Run locally

1. PostgreSQL: `docker compose up -d postgres` (from the repo root). Use a
   throwaway database — the tests create providers, customers and bookings.
2. Fake Clerk: `node e2e/support/fake-clerk.mjs` (port 9999).
3. Backend on 8081, pointed at the fake issuer:

   ```bash
   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/<test-db> \
   CLERK_ISSUER=http://localhost:9999 \
   CLERK_JWKS_URL=http://localhost:9999/.well-known/jwks.json \
   CLERK_SECRET_KEY=sk_test_local CLERK_API_URL=http://localhost:9999/v1 \
   CORS_ALLOWED_ORIGINS=http://localhost:5179 \
   APP_RATE_LIMIT_AUTH_PER_MINUTE=2000 APP_RATE_LIMIT_WRITE_PER_MINUTE=2000 \
   PORT=8081 java -jar ../backend/target/book-my-chef-backend-1.0.0.jar
   ```

4. Web app on 5179 with Clerk disabled and the API proxied to 8081
   (from PowerShell or cmd — Git Bash rewrites `/api/v1` into a Windows path):

   ```powershell
   $env:API_PROXY_TARGET='http://localhost:8081'; $env:VITE_API_BASE_URL='/api/v1'; $env:VITE_CLERK_PUBLISHABLE_KEY='none'
   npx vite --port 5179 --strictPort
   ```

5. `npm run test:e2e`
6. Optional API-level checks for menus and menu pricing (needs steps 1–3 only):
   `node e2e/support/menu-scenarios.mjs`

Signed-in tests inject a `window.Clerk` session object that returns tokens from
the fake issuer; see `support/api.js`.
