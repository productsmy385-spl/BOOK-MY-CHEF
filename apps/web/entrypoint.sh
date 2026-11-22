#!/bin/sh
# Generate runtime environment configuration for production SPA deployment
# Injects Railway container environment variables into window.__ENV__

cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  VITE_CLERK_PUBLISHABLE_KEY: "${VITE_CLERK_PUBLISHABLE_KEY}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_RAZORPAY_KEY_ID: "${VITE_RAZORPAY_KEY_ID}",
  VITE_IMAGEKIT_URL_ENDPOINT: "${VITE_IMAGEKIT_URL_ENDPOINT}",
  VITE_GOOGLE_MAPS_API_KEY: "${VITE_GOOGLE_MAPS_API_KEY}"
};
EOF

exec nginx -g "daemon off;"
