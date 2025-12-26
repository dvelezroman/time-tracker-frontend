import apiClient from '../client';
import { User } from '@/store/useAuthStore';

export interface UpdateUserRequest {
  email?: string;
  phone?: string;
  password?: string;
  role?: 'ADMIN' | 'OPERATOR';
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Extended User type for list views (includes dates from API)
export interface UserWithDates extends User {
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

/**
 * Helper function to check if current user is an operator
 * Operators should never be able to access user management endpoints
 */
const checkOperatorAccess = (endpoint: string): void => {
  if (typeof window === 'undefined') {
    return; // Server-side, skip check
  }

  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const auth = JSON.parse(authStorage);
      const userRole = auth?.state?.user?.role;
      if (userRole === 'OPERATOR') {
        console.error(`Operators are not allowed to call ${endpoint} endpoint`);
        throw new Error(`Access denied: Operators cannot access user management endpoints`);
      }
    } catch (error) {
      // If it's our access denied error, re-throw it
      if (error instanceof Error && error.message.includes('Access denied')) {
        throw error;
      }
      // If parsing fails, continue (might be first load or invalid storage)
    }
  }
};

export const userService = {
  getUsers: async (params?: { limit?: number; role?: string; status?: string }): Promise<UserWithDates[]> => {
    // Check if current user is an operator - operators should never call GET /users
    checkOperatorAccess('GET /users');

    const response = await apiClient.get<PaginatedResponse<UserWithDates>>('/users', { params });
    // API returns paginated response: { data: [...], total, page, limit, totalPages }
    // response.data is the response body, response.data.data is the array
    const paginatedResponse = response.data;
    if (Array.isArray(paginatedResponse)) {
      // If response is already an array (shouldn't happen, but handle it)
      return paginatedResponse;
    }
    // Extract the data array from paginated response
    return paginatedResponse.data || [];
  },

  getUserById: async (id: number): Promise<User> => {
    // Check if current user is an operator - operators should never call GET /users/:id
    checkOperatorAccess('GET /users/:id');

    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserRequest): Promise<User> => {
    // Check if current user is an operator - operators should never call PATCH /users/:id
    checkOperatorAccess('PATCH /users/:id');

    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    // Check if current user is an operator - operators should never call DELETE /users/:id
    checkOperatorAccess('DELETE /users/:id');

    await apiClient.delete(`/users/${id}`);
  },
};
