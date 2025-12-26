import apiClient from '../client';
import { offlineApiClient } from '../offline-client';

export interface Competitor {
  id: number;
  firstName: string;
  lastName: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface TimeEntry {
  id: number;
  eventCompetitorId: number;
  competitor: Competitor;
  category: Category | null;
  startDate: string;
  startDateLocal?: string;
  endDate: string | null;
  endDateLocal?: string;
  duration: number | null;
  timezone?: string;
}

export interface RecordFinishRequest {
  qrCode: string;
}

export interface RecordFinishResponse extends TimeEntry {}

export interface ValidateQRRequest {
  qrCode: string;
}

export interface ValidateQRResponse {
  eventCompetitorId: number;
  competitor: Competitor;
  category: Category | null;
}

export interface LeaderboardEntry {
  rank: number | null; // Overall rank
  categoryRank?: number | null; // Rank within category
  timeEntryId: number | null;
  competitor: Competitor;
  sequentialNumber?: number | null;
  category: Category | null;
  startDate: string | null;
  startDateLocal?: string;
  endDate: string | null;
  endDateLocal?: string;
  duration: number | null;
  status?: 'IN_PROGRESS' | 'NOT_FINISHED' | 'ABSENT';
  timezone?: string;
}

export interface LeaderboardResponse {
  event: {
    id: number;
    name: string;
    status: string;
  };
  finished: LeaderboardEntry[];
  inProgress: LeaderboardEntry[];
  total: number;
  finishedCount: number;
}

export const timeEntryService = {
  recordFinish: async (
    qrCode: string,
    eventId: number,
    timezone?: string,
  ): Promise<RecordFinishResponse> => {
    const params: any = { eventId };
    if (timezone) {
      params.timezone = timezone;
    }
    const response = await offlineApiClient.post<RecordFinishResponse>(
      '/time-entries/record-finish',
      { qrCode },
      { params },
    );
    return response as RecordFinishResponse;
  },

  recordStartBySequentialNumber: async (
    eventId: number,
    sequentialNumber: number,
    timezone?: string,
  ): Promise<RecordFinishResponse> => {
    const params: any = {};
    if (timezone) {
      params.timezone = timezone;
    }
    const localId = `offline-${Date.now()}-${Math.random()}`;
    const response = await offlineApiClient.post<RecordFinishResponse>(
      '/time-entries/record-start-by-sequential',
      { 
        eventId, 
        sequentialNumber,
        localId,
        operationType: 'START',
        startDate: new Date().toISOString(),
      },
      { params },
    );
    return response as RecordFinishResponse;
  },

  recordFinishBySequentialNumber: async (
    eventId: number,
    sequentialNumber: number,
    timezone?: string,
  ): Promise<RecordFinishResponse> => {
    const params: any = {};
    if (timezone) {
      params.timezone = timezone;
    }
    const localId = `offline-${Date.now()}-${Math.random()}`;
    const response = await offlineApiClient.post<RecordFinishResponse>(
      '/time-entries/record-finish-by-sequential',
      { 
        eventId, 
        sequentialNumber,
        localId,
        operationType: 'FINISH',
        endDate: new Date().toISOString(),
      },
      { params },
    );
    return response as RecordFinishResponse;
  },

  recordFinishById: async (
    eventId: number,
    ticketId: number,
    registrationId: number,
    timezone?: string,
  ): Promise<RecordFinishResponse> => {
    const params: any = {};
    if (timezone) {
      params.timezone = timezone;
    }
    const response = await apiClient.post<RecordFinishResponse>(
      '/time-entries/record-finish-by-id',
      { eventId, ticketId, registrationId },
      { params },
    );
    return response.data;
  },

  validateQR: async (
    qrCode: string,
    eventId: number,
  ): Promise<ValidateQRResponse> => {
    const response = await apiClient.post<ValidateQRResponse>(
      '/time-entries/validate-qr',
      { qrCode },
      { params: { eventId } },
    );
    return response.data;
  },

  getLeaderboard: async (
    eventId: number,
    timezone?: string,
  ): Promise<LeaderboardResponse> => {
    const params: any = {};
    if (timezone) {
      params.timezone = timezone;
    }
    const response = await apiClient.get<LeaderboardResponse>(
      `/time-entries/event/${eventId}/leaderboard`,
      { params },
    );
    return response.data;
  },

  getCompetitorTimeEntry: async (
    competitorId: number,
    eventId: number,
    timezone?: string,
  ): Promise<TimeEntry> => {
    const params: any = { eventId };
    if (timezone) {
      params.timezone = timezone;
    }
    const response = await apiClient.get<TimeEntry>(
      `/time-entries/competitor/${competitorId}`,
      { params },
    );
    return response.data;
  },
};



