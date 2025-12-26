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

export const userService = {
  getUsers: async (params?: { limit?: number; role?: string; status?: string }): Promise<UserWithDates[]> => {
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
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
