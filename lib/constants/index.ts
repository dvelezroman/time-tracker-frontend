export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
  },
  EVENTS: {
    BASE: '/events',
    BY_ID: (id: number) => `/events/${id}`,
    START: (id: number) => `/events/${id}/start`,
    STOP: (id: number) => `/events/${id}/stop`,
  },
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  EVENTS: '/events',
  EVENTS_CREATE: '/events/create',
  USERS: '/users',
  USERS_CREATE: '/users/create',
} as const;

export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  UI: 'ui-storage',
} as const;
