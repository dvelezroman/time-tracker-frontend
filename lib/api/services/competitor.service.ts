import apiClient from '../client';
import { offlineApiClient } from '../offline-client';

export interface Competitor {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
}

export interface CreateCompetitorRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface UpdateCompetitorRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface FilterCompetitorParams {
  page?: number;
  limit?: number;
  search?: string;
  email?: string;
}

export interface CompetitorListResponse {
  data: Competitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const competitorService = {
  create: async (data: CreateCompetitorRequest): Promise<Competitor> => {
    const response = await offlineApiClient.post<Competitor>('/competitors', data);
    return response;
  },

  getAll: async (params?: FilterCompetitorParams): Promise<CompetitorListResponse> => {
    const response = await apiClient.get<CompetitorListResponse>('/competitors', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Competitor> => {
    const response = await apiClient.get<Competitor>(`/competitors/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateCompetitorRequest): Promise<Competitor> => {
    const response = await offlineApiClient.patch<Competitor>(`/competitors/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await offlineApiClient.delete(`/competitors/${id}`);
  },
};

