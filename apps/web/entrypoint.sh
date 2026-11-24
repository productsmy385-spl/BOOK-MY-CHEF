#!/bin/sh
# Writes runtime configuration for the SPA from the container environment.
# Only public values belong here (publishable key, API URL) — never secrets.

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_CLERK_PUBLISHABLE_KEY: "${VITE_CLERK_PUBLISHABLE_KEY}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}"
};
EOF

exec nginx -g "daemon off;"
