import apiClient from '../client';
import { offlineApiClient } from '../offline-client';
import { publicApiClient } from '../public-client';
import { offlineStorage } from '../../storage/offline-storage';
import { eventCompetitorService } from './event-competitor.service';
import { categoryService } from './category.service';
import { isOnline } from '../../utils/network';

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
  assignedTo?: number | null;
  assignee?: {
    id: number;
    email: string;
  } | null;
}

export interface CreateEventRequest {
  name: string;
  description?: string;
  startDate: string; // ISO 8601 UTC
  endDate: string; // ISO 8601 UTC
  location?: string;
  assignedTo?: number; // Operator ID (Admin only)
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  status?: EventStatus;
  assignedTo?: number | null; // Operator ID or null to unassign (Admin only)
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
  timerType?: 'collective' | 'individual';
}

export interface StopEventRequest {
  timezone?: string;
}

export const eventService = {
  create: async (data: CreateEventRequest, timezone?: string): Promise<Event> => {
    const params = timezone ? { timezone } : {};
    const response = await offlineApiClient.post<Event>('/events', data, { params });
    return response as Event;
  },

  getAll: async (params?: FilterEventParams): Promise<EventListResponse> => {
    const response = await offlineApiClient.get<EventListResponse>('/events', { params });
    // Handle both direct response and response.data
    if ('data' in response && Array.isArray(response.data)) {
      return response as EventListResponse;
    }
    return response as EventListResponse;
  },

  getById: async (id: number, timezone?: string): Promise<Event> => {
    const params = timezone ? { timezone } : {};
    const response = await offlineApiClient.get<Event>(`/events/${id}`, { params });
    const event = response as Event;
    
    // Automatically preload event data if online
    if (isOnline()) {
      // Preload in background without blocking
      eventService.preloadEventData(id, event).catch(err => {
        console.warn('Failed to preload event data:', err);
      });
    }
    
    return event;
  },

  // Preload event data (competitors, categories) for offline use
  preloadEventData: async (eventId: number, event?: Event): Promise<void> => {
    try {
      // Get event if not provided
      let eventData = event;
      if (!eventData) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        eventData = await offlineApiClient.get<Event>(`/events/${eventId}`, { 
          params: { timezone } 
        }) as Event;
      }

      // Preload competitors and categories in parallel
      const [competitors, categories] = await Promise.all([
        eventCompetitorService.getByEvent(eventId).catch(() => []),
        categoryService.getAll({ eventId }).then(res => res.data || []).catch(() => []),
      ]);

      // Save to offline storage
      await offlineStorage.preloadEvent(eventId, eventData, competitors, categories);
      
      console.log(`[EventService] Preloaded event ${eventId}: ${competitors.length} competitors, ${categories.length} categories`);
    } catch (error) {
      console.error(`[EventService] Failed to preload event ${eventId}:`, error);
      throw error;
    }
  },

  update: async (id: number, data: UpdateEventRequest, timezone?: string): Promise<Event> => {
    const params = timezone ? { timezone } : {};
    const response = await offlineApiClient.patch<Event>(`/events/${id}`, data, { params });
    return response as Event;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  start: async (id: number, data?: StartEventRequest): Promise<Event> => {
    const response = await offlineApiClient.post<Event>(`/events/${id}/start`, data || {});
    return response as Event;
  },

  stop: async (id: number, data?: StopEventRequest): Promise<Event> => {
    const response = await offlineApiClient.post<Event>(`/events/${id}/stop`, data || {});
    return response as Event;
  },

  sendWhatsAppTimes: async (id: number): Promise<{ queued: number; skipped: number }> => {
    const response = await apiClient.post<{ queued: number; skipped: number }>(
      `/events/${id}/send-whatsapp-times`,
    );
    return response.data;
  },

  getPublicEvents: async (timezone?: string): Promise<
    Array<{
      id: number;
      name: string;
      status: string;
      startDate: string;
      endDate: string | null;
      location: string | null;
      startDateLocal?: string;
      endDateLocal?: string | null;
      timezone?: string;
    }>
  > => {
    const params: any = {};
    if (timezone) {
      params.timezone = timezone;
    }
    const response = await publicApiClient.get<
      Array<{
        id: number;
        name: string;
        status: string;
        startDate: string;
        endDate: string | null;
        location: string | null;
        startDateLocal?: string;
        endDateLocal?: string | null;
        timezone?: string;
      }>
    >('/events/public', { params });
    return response.data;
  },
};

