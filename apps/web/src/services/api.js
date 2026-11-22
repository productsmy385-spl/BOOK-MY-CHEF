/**
 * REST API Client for BOOK MY CHEF (Culinary & Event Atelier)
 * Connects React frontend directly to Java Spring Boot Backend (/api/v1/*)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach auth token if present
  const token = localStorage.getItem('bmc_clerk_token') || localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || errData?.message || `HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Request to ${endpoint} failed: ${err.message}. Using client fallback.`);
    throw err;
  }
}

export const api = {
  // Authentication & Identity
  auth: {
    syncUser: (data) => request('/auth/sync', { method: 'POST', body: JSON.stringify(data) }),
    getCurrentUser: () => request('/auth/me', { method: 'GET' }),
  },

  // Service Provider Discovery & Profiles
  providers: {
    search: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') searchParams.append(k, v);
      });
      return request(`/search/providers?${searchParams.toString()}`);
    },
    getById: (providerId) => request(`/providers/${providerId}`),
    setupProfile: (userId, profileData) =>
      request(`/providers/profile?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify(profileData),
      }),
  },

  // Bookings & Negotiations
  bookings: {
    create: (bookingData, customerId) => {
      const q = customerId ? `?customerId=${customerId}` : '';
      return request(`/bookings${q}`, {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },
    getById: (bookingId) => request(`/bookings/${bookingId}`),
    getMyBookings: (params = {}) => {
      const sp = new URLSearchParams(params).toString();
      return request(`/bookings/my${sp ? `?${sp}` : ''}`);
    },
    respond: (bookingId, providerId, action, rejectionReason) =>
      request(`/bookings/${bookingId}/respond?providerId=${providerId}`, {
        method: 'POST',
        body: JSON.stringify({ action, rejectionReason }),
      }),
    submitQuotation: (bookingId, providerId, items, providerNotes) =>
      request(`/bookings/${bookingId}/quotation?providerId=${providerId}`, {
        method: 'POST',
        body: JSON.stringify({ items, providerNotes }),
      }),
    lockAndCheckout: (bookingId) =>
      request(`/bookings/${bookingId}/lock-and-checkout`, { method: 'POST' }),
    updateChecklist: (bookingId, statusStep, latitude, longitude) =>
      request(`/bookings/${bookingId}/checklist`, {
        method: 'POST',
        body: JSON.stringify({ statusStep, latitude, longitude }),
      }),
    complete: (bookingId) =>
      request(`/bookings/${bookingId}/complete`, { method: 'POST' }),
  },

  // Payments & Escrow
  payments: {
    createOrder: (bookingId, paymentStage = 'ADVANCE_30') =>
      request('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId, paymentStage }),
      }),
    verify: (paymentPayload) =>
      request('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(paymentPayload),
      }),
  },

  // Reviews & Ratings
  reviews: {
    submit: (reviewData) =>
      request('/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }),
    getByProvider: (providerId) => request(`/reviews/provider/${providerId}`),
  },

  // Availability & Calendar
  availability: {
    getSlots: (providerId, startDate, endDate) => {
      const q = new URLSearchParams();
      if (startDate) q.append('startDate', startDate);
      if (endDate) q.append('endDate', endDate);
      return request(`/availability/provider/${providerId}?${q.toString()}`);
    },
    blockDate: (providerId, date, timeSlot = 'FULL_DAY') =>
      request(`/availability/provider/${providerId}/block?date=${date}&timeSlot=${timeSlot}`, {
        method: 'POST',
      }),
  },

  // Platform Administration
  admin: {
    getDashboardMetrics: () => request('/admin/dashboard'),
    getPendingKYC: () => request('/admin/kyc/pending'),
    verifyProvider: (providerId, decision, remarks) =>
      request(`/admin/providers/${providerId}/verify`, {
        method: 'POST',
        body: JSON.stringify({ decision, remarks }),
      }),
    getAuditLogs: () => request('/admin/audit-logs'),
  },
};

export default api;
