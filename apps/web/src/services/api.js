/**
 * REST client for the Book My Chef API (/api/v1).
 * Every request carries a fresh Clerk session token; nothing about the user's
 * identity or role is ever sent from the client as data.
 */

export function getApiBaseUrl() {
  const runtimeUrl = typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL;
  if (runtimeUrl && !runtimeUrl.startsWith('${') && runtimeUrl.trim() !== '') return runtimeUrl.trim();
  const buildTimeUrl = import.meta.env.VITE_API_BASE_URL;
  if (buildTimeUrl && buildTimeUrl.trim() !== '') return buildTimeUrl.trim();
  return '/api/v1'; // Vite dev server proxies /api to the backend
}

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || null;
  }
}

async function sessionToken() {
  try {
    // Clerk caches and refreshes short-lived session tokens itself.
    return (await window.Clerk?.session?.getToken()) || null;
  } catch {
    return null;
  }
}

async function request(method, path, body, { auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = await sessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const fallback = {
      401: 'Please sign in again.',
      403: 'You do not have access to this.',
      404: 'Not found.',
      429: 'Too many requests. Please wait a moment.',
    }[res.status] || 'Something went wrong. Please try again.';
    throw new ApiError(json?.message || fallback, res.status, json?.data && typeof json.data === 'object' ? json.data : null);
  }
  return json?.data;
}

const get = (p, o) => request('GET', p, undefined, o);
const post = (p, b) => request('POST', p, b === undefined ? {} : b);
const put = (p, b) => request('PUT', p, b);
const del = (p) => request('DELETE', p);

/** Builds a query string, dropping empty values and joining arrays with commas. */
export function toQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return;
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(','));
    } else sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  auth: {
    me: () => get('/auth/me'),
    sync: (data) => post('/auth/sync', data),
  },
  catalog: () => get('/catalog', { auth: false }),
  search: (params) => get(`/search/providers${toQuery(params)}`, { auth: false }),
  providers: {
    get: (id) => get(`/providers/${id}`, { auth: false }),
    reviews: (id, page = 0) => get(`/reviews/provider/${id}?page=${page}`, { auth: false }),
  },
  me: {
    get: () => get('/providers/me'),
    dashboard: () => get('/providers/me/dashboard'),
    profile: (d) => put('/providers/me/profile', d),
    categories: (categories) => put('/providers/me/categories', { categories }),
    cuisines: (d) => put('/providers/me/cuisines', d),
    addService: (d) => post('/providers/me/services', d),
    updateService: (id, d) => put(`/providers/me/services/${id}`, d),
    deleteService: (id) => del(`/providers/me/services/${id}`),
    availability: (d) => put('/providers/me/availability', d),
    blockDate: (d) => post('/providers/me/blocked-dates', d),
    unblockDate: (date) => del(`/providers/me/blocked-dates/${date}`),
    addPortfolio: (d) => post('/providers/me/portfolio', d),
    deletePortfolio: (id) => del(`/providers/me/portfolio/${id}`),
    addDocument: (d) => post('/providers/me/documents', d),
    publish: () => post('/providers/me/publish'),
    unpublish: () => post('/providers/me/unpublish'),
  },
  customer: {
    favourites: () => get('/customer/favourites'),
    favouriteIds: () => get('/customer/favourites/ids'),
    addFavourite: (id) => put(`/customer/favourites/${id}`),
    removeFavourite: (id) => del(`/customer/favourites/${id}`),
    addresses: () => get('/customer/addresses'),
    addAddress: (d) => post('/customer/addresses', d),
    updateAddress: (id, d) => put(`/customer/addresses/${id}`, d),
    deleteAddress: (id) => del(`/customer/addresses/${id}`),
    updateProfile: (d) => put('/customer/profile', d),
  },
  bookings: {
    create: (d) => post('/bookings', d),
    list: (scope = 'all', page = 0) => get(`/bookings?scope=${scope}&page=${page}`),
    get: (id) => get(`/bookings/${id}`),
    accept: (id, reason) => post(`/bookings/${id}/accept`, { reason }),
    reject: (id, reason) => post(`/bookings/${id}/reject`, { reason }),
    clarify: (id, message) => post(`/bookings/${id}/clarify`, { message }),
    quote: (id, d) => post(`/bookings/${id}/quotation`, d),
    complete: (id) => post(`/bookings/${id}/complete`),
    acceptQuote: (id) => post(`/bookings/${id}/quotation/accept`),
    declineQuote: (id, reason) => post(`/bookings/${id}/quotation/decline`, { reason }),
    cancel: (id, reason) => post(`/bookings/${id}/cancel`, { reason }),
  },
  reviews: {
    submit: (d) => post('/reviews', d),
  },
  notifications: {
    list: (page = 0) => get(`/notifications?page=${page}`),
    unread: () => get('/notifications/unread-count'),
    read: (id) => post(`/notifications/${id}/read`),
    readAll: () => post('/notifications/read-all'),
  },
  payments: {
    config: () => get('/payments/config'),
    order: (bookingId) => post('/payments/orders', { bookingId }),
    verify: (d) => post('/payments/verify', d),
  },
  media: {
    uploadAuth: (purpose) => get(`/media/upload-auth${purpose ? `?purpose=${purpose}` : ''}`),
    register: (fileId, purpose) => post('/media/assets', { fileId, purpose }),
    list: (purpose, page = 0) => get(`/media/assets${toQuery({ purpose, page })}`),
    remove: (id) => del(`/media/assets/${id}`),
  },
  public: {
    banners: (placement, category) => get(`/public/banners${toQuery({ placement, category })}`, { auth: false }),
    promotions: (params = {}) => get(`/public/providers/promotions${toQuery(params)}`, { auth: false }),
    featured: (limit = 10) => get(`/public/providers/featured?limit=${limit}`, { auth: false }),
    topRated: (params = {}) => get(`/public/providers/top-rated${toQuery(params)}`, { auth: false }),
    nearby: (params) => get(`/public/providers/nearby${toQuery(params)}`, { auth: false }),
    event: (id, type, body) => request('POST', `/public/banners/${id}/${type}`, body, { auth: false }),
  },
  myBanners: {
    list: () => get('/providers/me/banners'),
    create: (d) => post('/providers/me/banners', d),
    update: (id, d) => put(`/providers/me/banners/${id}`, d),
    submit: (id) => post(`/providers/me/banners/${id}/submit`),
    pause: (id) => post(`/providers/me/banners/${id}/pause`),
    resume: (id) => post(`/providers/me/banners/${id}/resume`),
    remove: (id) => del(`/providers/me/banners/${id}`),
  },
  admin: {
    dashboard: () => get('/admin/dashboard'),
    providers: (params) => get(`/admin/providers${toQuery(params)}`),
    provider: (id) => get(`/admin/providers/${id}`),
    verify: (id, decision, note) => post(`/admin/providers/${id}/verification`, { decision, note }),
    customers: (params) => get(`/admin/customers${toQuery(params)}`),
    setUserStatus: (id, status, reason) => post(`/admin/users/${id}/status`, { status, reason }),
    bookings: (params) => get(`/admin/bookings${toQuery(params)}`),
    finance: () => get('/admin/finance'),
    team: () => get('/admin/invitations'),
    invite: (email, role) => post('/admin/invitations', { email, role }),
    revokeInvite: (id) => del(`/admin/invitations/${id}`),
    settings: () => get('/admin/settings'),
    updateSetting: (key, value) => put(`/admin/settings/${encodeURIComponent(key)}`, { value }),
    audit: (page = 0) => get(`/admin/audit-logs?page=${page}`),
    campaigns: (status, page = 0) => get(`/admin/banners${toQuery({ status, page })}`),
    createCampaign: (d) => post('/admin/banners', d),
    updateCampaign: (id, d) => put(`/admin/banners/${id}`, d),
    campaignAction: (id, action) => post(`/admin/banners/${id}/${action}`),
    deleteCampaign: (id) => del(`/admin/banners/${id}`),
    promotionQueue: (status, page = 0) => get(`/admin/provider-promotions${toQuery({ status, page })}`),
    reviewPromotion: (id, decision, note) => post(`/admin/provider-banners/${id}/${decision}`, { note }),
    featured: () => get('/admin/featured-providers'),
    feature: (providerId, d) => post(`/admin/providers/${providerId}/feature`, d),
    unfeature: (providerId, placement) => del(`/admin/providers/${providerId}/feature?placement=${placement}`),
    bannerAnalytics: (days = 30) => get(`/admin/banner-analytics?days=${days}`),
    aiConfig: () => get('/admin/ai-images/config'),
    aiGenerate: (d) => post('/admin/ai-images', d),
  },
};

export default api;
