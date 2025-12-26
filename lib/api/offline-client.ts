import apiClient from './client';
import { offlineStorage } from '../storage/offline-storage';
import { isOnline } from '../utils/network';

interface QueuedOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  endpoint: string;
  payload: any;
  timestamp: string;
}

class OfflineApiClient {
  private async isOfflineMode(): Promise<boolean> {
    return await offlineStorage.getOfflineMode();
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const offlineMode = await this.isOfflineMode();
    const online = isOnline();

    if (offlineMode || !online) {
      // Try to get from local storage
      const resource = this.getResourceFromUrl(url);
      if (resource === 'events') {
        const events = await offlineStorage.getAllEvents();
        return events as T;
      } else if (resource === 'competitors') {
        const competitors = await offlineStorage.getAllCompetitors();
        return competitors as T;
      } else if (resource === 'categories') {
        const categories = await offlineStorage.getAllCategories();
        return categories as T;
      }
      throw new Error('Resource not available offline');
    }

    try {
      const response = await apiClient.get<T>(url, config);
      // Cache response for offline use
      await this.cacheResponse(url, response.data);
      return response.data;
    } catch (error: any) {
      if (!error.response && !online) {
        // Network error and offline - try local storage
        return this.getFromLocalStorage<T>(url);
      }
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const offlineMode = await this.isOfflineMode();
    const online = isOnline();

    if (offlineMode || !online) {
      // Queue operation for sync
      const operationId = await offlineStorage.addToSyncQueue({
        type: 'CREATE',
        resource: this.getResourceFromUrl(url),
        endpoint: url,
        payload: data,
      });

      // Store locally
      await this.storeLocally(url, data, operationId);

      // Return mock response
      return {
        ...data,
        localId: operationId,
        synced: false,
      } as T;
    }

    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      if (!error.response && !online) {
        // Network error - queue for sync
        const operationId = await offlineStorage.addToSyncQueue({
          type: 'CREATE',
          resource: this.getResourceFromUrl(url),
          endpoint: url,
          payload: data,
        });
        await this.storeLocally(url, data, operationId);
        return {
          ...data,
          localId: operationId,
          synced: false,
        } as T;
      }
      throw error;
    }
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const offlineMode = await this.isOfflineMode();
    const online = isOnline();

    if (offlineMode || !online) {
      const operationId = await offlineStorage.addToSyncQueue({
        type: 'UPDATE',
        resource: this.getResourceFromUrl(url),
        endpoint: url,
        payload: data,
      });
      await this.storeLocally(url, data, operationId);
      return {
        ...data,
        localId: operationId,
        synced: false,
      } as T;
    }

    try {
      const response = await apiClient.patch<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      if (!error.response && !online) {
        const operationId = await offlineStorage.addToSyncQueue({
          type: 'UPDATE',
          resource: this.getResourceFromUrl(url),
          endpoint: url,
          payload: data,
        });
        await this.storeLocally(url, data, operationId);
        return {
          ...data,
          localId: operationId,
          synced: false,
        } as T;
      }
      throw error;
    }
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const offlineMode = await this.isOfflineMode();
    const online = isOnline();

    if (offlineMode || !online) {
      const operationId = await offlineStorage.addToSyncQueue({
        type: 'DELETE',
        resource: this.getResourceFromUrl(url),
        endpoint: url,
        payload: null,
      });
      return {
        localId: operationId,
        synced: false,
      } as T;
    }

    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data || response;
    } catch (error: any) {
      if (!error.response && !online) {
        const operationId = await offlineStorage.addToSyncQueue({
          type: 'DELETE',
          resource: this.getResourceFromUrl(url),
          endpoint: url,
          payload: null,
        });
        return {
          localId: operationId,
          synced: false,
        } as T;
      }
      throw error;
    }
  }

  private getResourceFromUrl(url: string): string {
    if (url.includes('/events')) return 'event';
    if (url.includes('/competitors')) return 'competitor';
    if (url.includes('/time-entries')) return 'timeEntry';
    if (url.includes('/categories')) return 'category';
    if (url.includes('/event-competitors')) return 'eventCompetitor';
    return 'unknown';
  }

  private async cacheResponse(url: string, data: any): Promise<void> {
    const resource = this.getResourceFromUrl(url);
    if (resource === 'event' && data.id) {
      await offlineStorage.saveEvent(data);
    } else if (resource === 'competitor' && data.id) {
      await offlineStorage.saveCompetitor(data);
    } else if (resource === 'category' && data.id) {
      await offlineStorage.saveCategory(data);
    }
  }

  private async storeLocally(url: string, data: any, operationId: string): Promise<void> {
    const resource = this.getResourceFromUrl(url);
    if (resource === 'timeEntry') {
      await offlineStorage.saveTimeEntry({
        ...data,
        localId: operationId,
      });
    } else if (resource === 'event' && data.id) {
      await offlineStorage.saveEvent(data);
    } else if (resource === 'competitor' && data.id) {
      await offlineStorage.saveCompetitor(data);
    } else if (resource === 'category' && data.id) {
      await offlineStorage.saveCategory(data);
    }
  }

  private async getFromLocalStorage<T>(url: string): Promise<T> {
    const resource = this.getResourceFromUrl(url);
    if (resource === 'event') {
      const events = await offlineStorage.getAllEvents();
      return events as T;
    } else if (resource === 'competitor') {
      const competitors = await offlineStorage.getAllCompetitors();
      return competitors as T;
    } else if (resource === 'category') {
      const categories = await offlineStorage.getAllCategories();
      return categories as T;
    }
    throw new Error('Resource not available offline');
  }
}

export const offlineApiClient = new OfflineApiClient();

