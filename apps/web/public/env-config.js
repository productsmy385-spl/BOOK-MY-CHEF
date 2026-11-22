// Runtime environment injection fallback
window.__ENV__ = window.__ENV__ || {
  VITE_API_BASE_URL: 'https://book-my-chef-backend-production.up.railway.app/api/v1',
  VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2F1c2FsLXR1cnRsZS03NDM1LmNsZXJrLmFjY291bnRzLmRldiQ',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2F1c2FsLXR1cnRsZS03NDM1LmNsZXJrLmFjY291bnRzLmRldiQ',
  VITE_RAZORPAY_KEY_ID: 'rzp_test_bookmychef2026',
  VITE_IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/bookmychef',
  VITE_GOOGLE_MAPS_API_KEY: 'AIzaSyB_placeholder_google_maps_key',
};
