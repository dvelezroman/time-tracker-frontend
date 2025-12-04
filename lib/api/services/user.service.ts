import apiClient from '../client';
import { User } from '@/store/useAuthStore';

export interface UpdateUserRequest {
  email?: string;
  phone?: string;
  password?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<PaginatedResponse<User>>('/users');
    // API returns paginated response, extract the data array
    return response.data.data || response.data;
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
