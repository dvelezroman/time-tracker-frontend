import apiClient from '../client';
import { offlineApiClient } from '../offline-client';

export interface EventCompetitor {
  id: number;
  eventId: number;
  competitorId: number;
  categoryId: number | null;
  sequentialNumber?: number | null;
  qrCode: string | null;
  registeredAt: string;
  event?: {
    id: number;
    name: string;
    description?: string;
  };
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

export interface FilterEventCompetitorParams {
  page?: number;
  limit?: number;
  eventId?: number;
  competitorId?: number;
  categoryId?: number;
}

export interface EventCompetitorListResponse {
  data: EventCompetitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const eventCompetitorService = {
  getAll: async (params?: FilterEventCompetitorParams): Promise<EventCompetitorListResponse> => {
    const response = await apiClient.get<EventCompetitorListResponse>('/event-competitors', {
      params,
    });
    return response.data;
  },

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

  downloadQRCodesPDF: async (eventId: number): Promise<void> => {
    const response = await apiClient.get(`/event-competitors/event/${eventId}/download-qr-codes-pdf`, {
      responseType: 'blob',
    });

    // Create blob and download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_Codes_Event_${eventId}_${new Date().getTime()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  importExcel: async (
    file: File,
    eventId?: number,
  ): Promise<{
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
    total: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const params = eventId ? { eventId: eventId.toString() } : {};
    const response = await apiClient.post('/event-competitors/import-excel', formData, {
      params,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};



