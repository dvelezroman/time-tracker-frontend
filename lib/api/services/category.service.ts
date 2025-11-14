import apiClient from '../client';

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
    const response = await apiClient.post<Category>('/categories', data);
    return response.data;
  },

  getAll: async (params?: FilterCategoryParams): Promise<CategoryListResponse> => {
    const response = await apiClient.get<CategoryListResponse>('/categories', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Category> => {
    const response = await apiClient.get<Category>(`/categories/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await apiClient.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};

