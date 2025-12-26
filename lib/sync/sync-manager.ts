import apiClient from '../api/client';
import { offlineStorage } from '../storage/offline-storage';
import { isOnline } from '../utils/network';

export interface SyncResult {
  successful: number;
  failed: number;
  conflicts: number;
  errors: string[];
}

export const syncManager = {
  async syncAll(): Promise<SyncResult> {
    if (!isOnline()) {
      throw new Error('Cannot sync while offline');
    }

    const result: SyncResult = {
      successful: 0,
      failed: 0,
      conflicts: 0,
      errors: [],
    };

    const queue = await offlineStorage.getSyncQueue('pending');
    
    // Group by resource type
    const timeEntries: any[] = [];
    const events: any[] = [];
    const competitors: any[] = [];
    const categories: any[] = [];
    const eventCompetitors: any[] = [];

    for (const item of queue) {
      if (item.resource === 'timeEntry') {
        timeEntries.push(item);
      } else if (item.resource === 'event') {
        events.push(item);
      } else if (item.resource === 'competitor') {
        competitors.push(item);
      } else if (item.resource === 'category') {
        categories.push(item);
      } else if (item.resource === 'eventCompetitor') {
        eventCompetitors.push(item);
      }
    }

    // Sync time entries
    if (timeEntries.length > 0) {
      try {
        await offlineStorage.updateSyncQueueStatus(timeEntries[0].id, 'syncing');
        const syncData = timeEntries.map((item) => ({
          localId: item.id,
          eventId: item.payload.eventId,
          sequentialNumber: item.payload.sequentialNumber,
          startDate: item.payload.startDate,
          endDate: item.payload.endDate,
          duration: item.payload.duration,
          operationType: item.payload.operationType || (item.payload.endDate ? 'FINISH' : 'START'),
          offlineTimestamp: item.timestamp,
        }));

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await apiClient.post('/time-entries/sync', { entries: syncData }, { params: { timezone } });
        const syncResult = response.data;

        result.successful += syncResult.data.successful?.length || 0;
        result.failed += syncResult.data.failed?.length || 0;
        result.conflicts += syncResult.data.conflicts?.length || 0;

        // Update queue status
        for (const item of timeEntries) {
          const syncItem = syncResult.data.successful?.find((s: any) => s.localId === item.id);
          if (syncItem) {
            await offlineStorage.updateSyncQueueStatus(item.id, 'synced');
            await offlineStorage.removeFromSyncQueue(item.id);
          } else {
            await offlineStorage.updateSyncQueueStatus(item.id, 'failed');
            result.errors.push(`Failed to sync time entry ${item.id}`);
          }
        }
      } catch (error: any) {
        result.failed += timeEntries.length;
        result.errors.push(`Time entries sync failed: ${error.message}`);
        for (const item of timeEntries) {
          await offlineStorage.updateSyncQueueStatus(item.id, 'failed');
        }
      }
    }

    // Sync other resources (events, competitors, categories, eventCompetitors)
    // For now, we'll handle them individually
    for (const item of [...events, ...competitors, ...categories, ...eventCompetitors]) {
      try {
        await offlineStorage.updateSyncQueueStatus(item.id, 'syncing');
        
        let response;
        if (item.type === 'CREATE') {
          response = await apiClient.post(item.endpoint, item.payload);
        } else if (item.type === 'UPDATE') {
          response = await apiClient.patch(item.endpoint, item.payload);
        } else if (item.type === 'DELETE') {
          response = await apiClient.delete(item.endpoint);
        }

        await offlineStorage.updateSyncQueueStatus(item.id, 'synced');
        await offlineStorage.removeFromSyncQueue(item.id);
        result.successful++;
      } catch (error: any) {
        await offlineStorage.updateSyncQueueStatus(item.id, 'failed');
        await offlineStorage.incrementSyncQueueRetries(item.id);
        result.failed++;
        result.errors.push(`Failed to sync ${item.resource} ${item.id}: ${error.message}`);
      }
    }

    return result;
  },

  async getPendingCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue('pending');
    return queue.length;
  },

  async getFailedCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue('failed');
    return queue.length;
  },
};

