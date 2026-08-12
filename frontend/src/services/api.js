const API_BASE_URL = 'http://localhost:5004/api';

const getHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  registerPatient: async (data) => {
    const res = await fetch(`${API_BASE_URL}/auth/register/patient`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  registerProvider: async (data) => {
    const res = await fetch(`${API_BASE_URL}/auth/register/provider`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  login: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  adminLogin: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  getMe: async (token) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  // Service Types
  getServices: async () => {
    const res = await fetch(`${API_BASE_URL}/services`);
    return res.json();
  },

  getService: async (id) => {
    const res = await fetch(`${API_BASE_URL}/services/${id}`);
    return res.json();
  },

  // Providers
  getAvailableProviders: async (query = {}) => {
    const params = new URLSearchParams(query).toString();
    const res = await fetch(`${API_BASE_URL}/providers/available?${params}`);
    return res.json();
  },

  getProvider: async (id) => {
    const res = await fetch(`${API_BASE_URL}/providers/${id}`);
    return res.json();
  },

  updateProviderProfile: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/providers/profile`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateProviderAvailability: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/providers/availability`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Bookings
  createBooking: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getMyBookings: async (token) => {
    const res = await fetch(`${API_BASE_URL}/bookings/my`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  getProviderBookings: async (token) => {
    const res = await fetch(`${API_BASE_URL}/bookings/provider/my`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  getBooking: async (id, token) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  updatePatientProfile: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateBookingStatus: async (id, status, cancellationReason = '', token = '', visitReport = null) => {
    const payload = { status, cancellationReason };
    if (visitReport) payload.visitReport = visitReport;

    const res = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  assignProvider: async (bookingId, providerId, token) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/assign`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ providerId }),
    });
    return res.json();
  },

  // Admin
  getAdminStats: async (token) => {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  getPendingProviders: async (token) => {
    const res = await fetch(`${API_BASE_URL}/admin/providers/pending`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  getAllProviders: async (token, status = '') => {
    const res = await fetch(`${API_BASE_URL}/admin/providers?status=${status}`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  verifyProvider: async (id, status, notes, token) => {
    const res = await fetch(`${API_BASE_URL}/admin/providers/${id}/verify`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status, notes }),
    });
    return res.json();
  },

  getAllBookings: async (token, status = '') => {
    const res = await fetch(`${API_BASE_URL}/admin/bookings?status=${status}`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  createPhoneInBooking: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/phone-in`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  verifyPayment: async (bookingId, paymentStatus, paymentMethod = 'cash', amount = 0, notes = '', token) => {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/payment`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ paymentStatus, paymentMethod, amount, notes }),
    });
    return res.json();
  },

  getUsersAndAdmins: async (token) => {
    const res = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  updateUserRole: async (userId, role, userType, token) => {
    const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ role, userType }),
    });
    return res.json();
  },

  getAuditLogs: async (token) => {
    const res = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  getAdminServiceTypes: async (token) => {
    const res = await fetch(`${API_BASE_URL}/admin/service-types`, {
      headers: getHeaders(token),
    });
    return res.json();
  },

  createServiceType: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/admin/service-types`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Reviews
  createReview: async (data, token) => {
    const res = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getProviderReviews: async (providerId) => {
    const res = await fetch(`${API_BASE_URL}/reviews/provider/${providerId}`);
    return res.json();
  }
};
