import apiClient from '../client';

export interface EventCompetitor {
  id: number;
  eventId: number;
  competitorId: number;
  categoryId: number | null;
  qrCode: string | null;
  registeredAt: string;
  competitor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  category: {
    id: number;
    name: string;
    description: string | null;
  } | null;
}

export const eventCompetitorService = {
  getByEvent: async (eventId: number): Promise<EventCompetitor[]> => {
    const response = await apiClient.get<EventCompetitor[]>(
      `/event-competitors/event/${eventId}`,
    );
    return response.data;
  },

  generateQRCode: async (eventCompetitorId: number): Promise<EventCompetitor> => {
    const response = await apiClient.post<EventCompetitor>(
      `/event-competitors/${eventCompetitorId}/generate-qr`,
    );
    return response.data;
  },

  generateQRCodesForEvent: async (eventId: number): Promise<{
    generated: number;
    message: string;
  }> => {
    const response = await apiClient.post<{ generated: number; message: string }>(
      `/event-competitors/event/${eventId}/generate-qr-codes`,
    );
    return response.data;
  },
};



