import { API_BASE_URL } from '../config';

const REQUEST_TIMEOUT_MS = 20000; // generous for 3G

// Listeners notified when the server rejects our token (expired/revoked) so the app can log out.
const unauthorizedListeners = new Set();
export const onUnauthorized = (fn) => {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
};

const NETWORK_ERROR = {
  success: false,
  networkError: true,
  message: 'इन्टरनेट जडान जाँच गर्नुहोस् (Network error — check your connection)'
};

// Single fetch wrapper: JSON in/out, auth header, timeout, and consistent { success, message } errors.
// Always resolves (never throws) so callers can just check `res.success`.
const request = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    return NETWORK_ERROR;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: `Server error (${res.status})` };
  }

  if (res.status === 401 && token) {
    unauthorizedListeners.forEach(fn => fn());
  }
  if (!res.ok && data.success === undefined) data.success = false;
  return data;
};

const qs = (params) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

export const api = {
  // Auth
  registerPatient: (data) => request('/auth/register/patient', { method: 'POST', body: data }),
  registerProvider: (data) => request('/auth/register/provider', { method: 'POST', body: data }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  adminLogin: (credentials) => request('/auth/admin/login', { method: 'POST', body: credentials }),
  getMe: (token) => request('/auth/me', { token }),
  updatePatientProfile: (data, token) => request('/auth/profile', { method: 'PATCH', body: data, token }),

  // Service Types
  getServices: () => request('/services'),
  getService: (id) => request(`/services/${id}`),

  // Providers
  getAvailableProviders: (query = {}) => request(`/providers/available${qs(query)}`),
  getProvider: (id) => request(`/providers/${id}`),
  updateProviderProfile: (data, token) => request('/providers/profile', { method: 'PATCH', body: data, token }),
  updateProviderAvailability: (data, token) => request('/providers/availability', { method: 'PATCH', body: data, token }),

  // Bookings
  createBooking: (data, token) => request('/bookings', { method: 'POST', body: data, token }),
  getMyBookings: (token) => request('/bookings/my', { token }),
  getProviderBookings: (token) => request('/bookings/provider/my', { token }),
  getBooking: (id, token) => request(`/bookings/${id}`, { token }),
  updateBookingStatus: (id, status, cancellationReason = '', token = '', visitReport = null) => {
    const body = { status, cancellationReason };
    if (visitReport) body.visitReport = visitReport;
    return request(`/bookings/${id}/status`, { method: 'PATCH', body, token });
  },
  assignProvider: (bookingId, providerId, token) =>
    request(`/bookings/${bookingId}/assign`, { method: 'PATCH', body: { providerId }, token }),

  // Admin
  getAdminStats: (token) => request('/admin/dashboard/stats', { token }),
  getPendingProviders: (token) => request('/admin/providers/pending', { token }),
  getAllProviders: (token, status = '') => request(`/admin/providers${qs({ status })}`, { token }),
  verifyProvider: (id, status, notes, token) =>
    request(`/admin/providers/${id}/verify`, { method: 'PATCH', body: { status, notes }, token }),
  getAllBookings: (token, status = '', limit) => request(`/admin/bookings${qs({ status, limit })}`, { token }),
  createPhoneInBooking: (data, token) => request('/admin/bookings/phone-in', { method: 'POST', body: data, token }),
  verifyPayment: (bookingId, paymentStatus, paymentMethod = 'cash', amount = 0, notes = '', token) =>
    request(`/admin/bookings/${bookingId}/payment`, {
      method: 'PATCH',
      body: { paymentStatus, paymentMethod, amount, notes },
      token
    }),
  getUsersAndAdmins: (token) => request('/admin/users', { token }),
  updateUserRole: (userId, role, userType, token) =>
    request(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role, userType }, token }),
  getAuditLogs: (token) => request('/admin/audit-logs', { token }),
  getAdminServiceTypes: (token) => request('/admin/service-types', { token }),
  createServiceType: (data, token) => request('/admin/service-types', { method: 'POST', body: data, token }),
  updateServiceType: (id, data, token) => request(`/admin/service-types/${id}`, { method: 'PATCH', body: data, token }),

  // FlapMain IoT proxy (admin only)
  triggerFlapMainDevice: (payload, token) => request('/admin/telemetry/trigger', { method: 'POST', body: payload, token }),
  getFlapMainTriggerStatus: (payload, token) => request('/admin/telemetry/status', { method: 'POST', body: payload, token }),
  lookupFlapMainTag: (payload, token) => request('/admin/telemetry/tag-lookup', { method: 'POST', body: payload, token }),

  // Reviews
  createReview: (data, token) => request('/reviews', { method: 'POST', body: data, token }),
  getProviderReviews: (providerId) => request(`/reviews/provider/${providerId}`)
};
