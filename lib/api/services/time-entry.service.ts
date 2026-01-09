import apiClient from '../client';
import { offlineApiClient } from '../offline-client';
import { publicApiClient } from '../public-client';

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
  eventCompetitorId?: number; // ID of the event-competitor relationship
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

export interface StageTimeEntry {
  id: number;
  timeEntryId: number;
  eventCompetitorId: number;
  stageNumber: number;
  recordedAt: string;
  recordedAtLocal?: string;
  duration: number | null;
  notes?: string | null;
  competitor: Competitor;
  category: Category | null;
  timezone?: string;
}

export interface StageLeaderboard {
  stageNumber: number;
  entries: LeaderboardEntry[];
  total: number;
}

export interface LeaderboardResponse {
  event: {
    id: number;
    name: string;
    status: string;
    numberOfStages?: number | null;
  };
  finished: LeaderboardEntry[];
  inProgress: LeaderboardEntry[];
  total: number;
  finishedCount: number;
  stageLeaderboards?: {
    [key: string]: StageLeaderboard; // e.g., "stage1", "stage2", etc.
  };
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

  createManualTimeEntry: async (
    eventId: number,
    eventCompetitorId: number,
    duration: string,
  ): Promise<TimeEntry> => {
    const response = await offlineApiClient.post<TimeEntry>('/time-entries/manual', {
      eventId,
      eventCompetitorId,
      duration,
    });
    return response;
  },

  getPublicTimeEntry: async (
    eventId: number,
    sequentialNumber: number,
    timezone?: string,
  ): Promise<{
    competitor: { firstName: string; lastName: string };
    category: { id: number; name: string } | null;
    sequentialNumber: number | null;
    status: 'FINISHED' | 'IN_PROGRESS' | 'NOT_STARTED';
    rank: number | null;
    startDate: string | null;
    startDateLocal?: string;
    endDate: string | null;
    endDateLocal?: string;
    duration: number | null;
    timezone?: string;
  }> => {
    const params: any = { eventId, sequentialNumber };
    if (timezone) {
      params.timezone = timezone;
    }
    const response = await publicApiClient.get<{
      competitor: { firstName: string; lastName: string };
      category: { id: number; name: string } | null;
      sequentialNumber: number | null;
      status: 'FINISHED' | 'IN_PROGRESS' | 'NOT_STARTED';
      rank: number | null;
      categoryRank?: number | null;
      startDate: string | null;
      startDateLocal?: string;
      endDate: string | null;
      endDateLocal?: string;
      duration: number | null;
      timezone?: string;
    }>('/time-entries/public/lookup', { params });
    return response.data;
  },

  getPublicLeaderboard: async (
    eventId: number,
    timezone?: string,
  ): Promise<LeaderboardResponse> => {
    const params: any = {};
    if (timezone) {
      params.timezone = timezone;
    }
    const response = await publicApiClient.get<LeaderboardResponse>(
      `/time-entries/public/event/${eventId}/leaderboard`,
      { params },
    );
    return response.data;
  },

  recordStageBySequentialNumber: async (
    eventId: number,
    sequentialNumber: number,
    stageNumber: number,
    timezone?: string,
    notes?: string,
  ): Promise<StageTimeEntry> => {
    const params: any = { eventId, sequentialNumber };
    if (timezone) {
      params.timezone = timezone;
    }
    const localId = `offline-stage-${Date.now()}-${Math.random()}`;
    const response = await offlineApiClient.post<StageTimeEntry>(
      '/time-entries/record-stage-by-sequential',
      {
        stageNumber,
        notes,
        localId,
        operationType: 'STAGE',
        recordedAt: new Date().toISOString(),
      },
      { params },
    );
    return response as StageTimeEntry;
  },
};



