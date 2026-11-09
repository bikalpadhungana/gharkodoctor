// Central app configuration. Values come from Vite env (frontend/.env*) with safe defaults.

// Relative by default: in production the SPA is served by the API server (same origin);
// in development Vite proxies /api to the backend (see vite.config.js).
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// 24/7 dispatch / emergency line shown in the emergency button and call-to-book CTAs.
// TODO(ops): set VITE_HOTLINE to the real staffed number before launch.
export const HOTLINE = import.meta.env.VITE_HOTLINE || '9800000000';
export const HOTLINE_DISPLAY = import.meta.env.VITE_HOTLINE_DISPLAY || HOTLINE;

// Nepal's national ambulance number — always reachable even if our dispatch is not.
export const AMBULANCE = '102';

export const STAFF_ROLES = ['admin', 'superadmin', 'dispatcher'];
// Mirrors backend ADMIN_ROLES (middleware/auth.js): roles allowed to make trust decisions.
export const ADMIN_ROLES = ['admin', 'superadmin'];

export const homePathForRole = (role) => {
  if (STAFF_ROLES.includes(role)) return '/admin/dashboard';
  if (role === 'provider') return '/provider/dashboard';
  return '/';
};
