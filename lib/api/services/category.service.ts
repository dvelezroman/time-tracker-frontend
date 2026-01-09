import apiClient from '../client';
import { offlineApiClient } from '../offline-client';
import { publicApiClient } from '../public-client';

export interface Category {
  id: number;
  eventId: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  event?: {
    id: number;
    name: string;
  };
}

export interface CreateCategoryRequest {
  eventId: number;
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
}

export interface FilterCategoryParams {
  page?: number;
  limit?: number;
  eventId?: number;
  search?: string;
}

export interface CategoryListResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const categoryService = {
  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await offlineApiClient.post<Category>('/categories', data);
    return response as Category;
  },

  getAll: async (params?: FilterCategoryParams): Promise<CategoryListResponse> => {
    const response = await offlineApiClient.get<CategoryListResponse>('/categories', { params });
    // Handle both direct response and response.data
    if ('data' in response && Array.isArray(response.data)) {
      return response as CategoryListResponse;
    }
    return response as CategoryListResponse;
  },

  getPublicAll: async (params?: FilterCategoryParams): Promise<CategoryListResponse> => {
    const response = await publicApiClient.get<CategoryListResponse>('/categories', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await offlineApiClient.get<Category>(`/categories/${id}`);
    return response as Category;
  },

  update: async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await offlineApiClient.patch<Category>(`/categories/${id}`, data);
    return response as Category;
  },

  delete: async (id: number): Promise<void> => {
    await offlineApiClient.delete(`/categories/${id}`);
  },
};

