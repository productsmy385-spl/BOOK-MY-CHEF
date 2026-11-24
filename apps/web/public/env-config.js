// Runtime configuration. In production, entrypoint.sh overwrites this file with
// values from the container environment. Locally it stays empty so the Vite
// build-time variables from apps/web/.env are used.
window.__ENV__ = window.__ENV__ || {};
