import apiClient from '../client';

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface Event {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  startDateLocal?: string;
  endDate: string;
  endDateLocal?: string;
  location?: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  timezone?: string;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  startDate: string; // ISO 8601 UTC
  endDate: string; // ISO 8601 UTC
  location?: string;
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  status?: EventStatus;
}

export interface FilterEventParams {
  page?: number;
  limit?: number;
  name?: string;
  status?: EventStatus;
  startDateFrom?: string;
  startDateTo?: string;
  timezone?: string;
}

export interface EventListResponse {
  data: Event[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StartEventRequest {
  timezone?: string;
}

export interface StopEventRequest {
  timezone?: string;
}

export const eventService = {
  create: async (data: CreateEventRequest, timezone?: string): Promise<Event> => {
    const params = timezone ? { timezone } : {};
    const response = await apiClient.post<Event>('/events', data, { params });
    return response.data;
  },

  getAll: async (params?: FilterEventParams): Promise<EventListResponse> => {
    const response = await apiClient.get<EventListResponse>('/events', { params });
    return response.data;
  },

  getById: async (id: number, timezone?: string): Promise<Event> => {
    const params = timezone ? { timezone } : {};
    const response = await apiClient.get<Event>(`/events/${id}`, { params });
    return response.data;
  },

  update: async (id: number, data: UpdateEventRequest, timezone?: string): Promise<Event> => {
    const params = timezone ? { timezone } : {};
    const response = await apiClient.patch<Event>(`/events/${id}`, data, { params });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  start: async (id: number, data?: StartEventRequest): Promise<Event> => {
    const response = await apiClient.post<Event>(`/events/${id}/start`, data || {});
    return response.data;
  },

  stop: async (id: number, data?: StopEventRequest): Promise<Event> => {
    const response = await apiClient.post<Event>(`/events/${id}/stop`, data || {});
    return response.data;
  },
};

