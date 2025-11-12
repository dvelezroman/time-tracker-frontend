import apiClient from '../client';
import { User } from '@/store/useAuthStore';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  role: 'ADMIN' | 'OPERATOR';
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/users/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const { confirmPassword, ...registerData } = data;
    const response = await apiClient.post<LoginResponse>('/users/register', registerData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiClient.post<{ token: string }>('/auth/refresh');
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/users/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/users/reset-password', {
      token,
      password,
    });
    return response.data;
  },
};
