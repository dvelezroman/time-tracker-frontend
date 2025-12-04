import apiClient from '../client';

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

export interface Competitor {
  id: number;
  eventCompetitorId: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  sequentialNumber?: number | null;
  category?: string | null;
  hasFinished: boolean;
  time?: string | null;
}

export interface SendNotificationsRequest {
  eventId: number;
  type: 'EMAIL' | 'WHATSAPP';
  template?: string;
  customMessage?: string;
  competitorIds?: number[];
}

export interface SendNotificationsResponse {
  queued: number;
  skipped: number;
}

export const notificationsService = {
  getTemplates: async (): Promise<NotificationTemplate[]> => {
    const response = await apiClient.get<NotificationTemplate[]>('/notifications/templates');
    return response.data;
  },

  getEventCompetitors: async (eventId: number): Promise<Competitor[]> => {
    const response = await apiClient.get<Competitor[]>(`/notifications/event/${eventId}/competitors`);
    return response.data;
  },

  sendNotifications: async (
    data: SendNotificationsRequest,
  ): Promise<SendNotificationsResponse> => {
    const response = await apiClient.post<SendNotificationsResponse>('/notifications/send', data);
    return response.data;
  },
};
