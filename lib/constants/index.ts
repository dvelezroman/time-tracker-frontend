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
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: number) => `/categories/${id}`,
  },
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  EVENTS: '/events',
  EVENTS_CREATE: '/events/create',
  EVENTS_DETAIL: (id: number) => `/events/${id}`,
  EVENTS_EDIT: (id: number) => `/events/${id}/edit`,
  EVENTS_TIMER: (id: number) => `/events/${id}/timer`,
  CATEGORIES: '/categories',
  CATEGORIES_CREATE: '/categories/create',
  USERS: '/users',
  USERS_CREATE: '/users/create',
} as const;

export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  UI: 'ui-storage',
} as const;
