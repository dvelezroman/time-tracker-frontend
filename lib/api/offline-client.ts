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
      return this.getFromLocalStorage<T>(url);
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
      const resourceInfo = this.getResourceFromUrl(url);
      const operationId = await offlineStorage.addToSyncQueue({
        type: 'CREATE',
        resource: resourceInfo.resource as 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor',
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
          resource: this.getResourceFromUrl(url) as 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor',
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
        resource: this.getResourceFromUrl(url) as 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor',
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
        const resourceInfo = this.getResourceFromUrl(url);
        const operationId = await offlineStorage.addToSyncQueue({
          type: 'UPDATE',
          resource: resourceInfo.resource as 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor',
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
        resource: this.getResourceFromUrl(url) as 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor',
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
      return (response.data || response) as T;
    } catch (error: any) {
      if (!error.response && !online) {
        const resourceInfo = this.getResourceFromUrl(url);
        const operationId = await offlineStorage.addToSyncQueue({
          type: 'DELETE',
          resource: resourceInfo.resource as 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor',
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

  private getResourceFromUrl(url: string): { resource: string; id?: number; subResource?: string } {
    // Parse URL to extract resource type and ID
    const urlParts = url.split('?')[0].split('/').filter(Boolean);
    
    // Handle /events
    if (url.includes('/events') && !url.includes('/event-competitors')) {
      const eventIndex = urlParts.indexOf('events');
      if (eventIndex !== -1) {
        const eventId = urlParts[eventIndex + 1] ? parseInt(urlParts[eventIndex + 1], 10) : undefined;
        const subResource = urlParts[eventIndex + 2];
        return { 
          resource: 'event', 
          id: eventId && !isNaN(eventId) ? eventId : undefined,
          subResource: subResource || undefined
        };
      }
      return { resource: 'events' };
    }
    
    // Handle /event-competitors
    if (url.includes('/event-competitors')) {
      const ecIndex = urlParts.indexOf('event-competitors');
      if (ecIndex !== -1) {
        const ecId = urlParts[ecIndex + 1] ? parseInt(urlParts[ecIndex + 1], 10) : undefined;
        const subResource = urlParts[ecIndex + 2];
        if (subResource === 'event' && urlParts[ecIndex + 3]) {
          // /event-competitors/event/{eventId}
          const eventId = parseInt(urlParts[ecIndex + 3], 10);
          return { resource: 'eventCompetitors', id: eventId };
        }
        return { resource: 'eventCompetitor', id: ecId && !isNaN(ecId) ? ecId : undefined };
      }
      return { resource: 'eventCompetitors' };
    }
    
    // Handle /competitors
    if (url.includes('/competitors')) {
      const compIndex = urlParts.indexOf('competitors');
      if (compIndex !== -1) {
        const compId = urlParts[compIndex + 1] ? parseInt(urlParts[compIndex + 1], 10) : undefined;
        return { resource: 'competitor', id: compId && !isNaN(compId) ? compId : undefined };
      }
      return { resource: 'competitors' };
    }
    
    // Handle /time-entries
    if (url.includes('/time-entries')) {
      return { resource: 'timeEntry' };
    }
    
    // Handle /categories
    if (url.includes('/categories')) {
      const catIndex = urlParts.indexOf('categories');
      if (catIndex !== -1) {
        const catId = urlParts[catIndex + 1] ? parseInt(urlParts[catIndex + 1], 10) : undefined;
        return { resource: 'category', id: catId && !isNaN(catId) ? catId : undefined };
      }
      return { resource: 'categories' };
    }
    
    return { resource: 'unknown' };
  }

  private async cacheResponse(url: string, data: any): Promise<void> {
    const resourceInfo = this.getResourceFromUrl(url);
    const { resource, id } = resourceInfo;
    
    // Handle single objects
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (resource === 'event' && data.id) {
        await offlineStorage.saveEvent(data);
      } else if (resource === 'competitor' && data.id) {
        await offlineStorage.saveCompetitor(data);
      } else if (resource === 'category' && data.id) {
        await offlineStorage.saveCategory(data);
      } else if (resource === 'eventCompetitor' && data.id) {
        await offlineStorage.saveEventCompetitor(data);
        // Also cache the competitor if present
        if (data.competitor) {
          await offlineStorage.saveCompetitor(data.competitor);
        }
      }
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      for (const item of data) {
        if (resource === 'event' || resource === 'events') {
          if (item.id) await offlineStorage.saveEvent(item);
        } else if (resource === 'competitor' || resource === 'competitors') {
          if (item.id) await offlineStorage.saveCompetitor(item);
        } else if (resource === 'category' || resource === 'categories') {
          if (item.id) await offlineStorage.saveCategory(item);
        } else if (resource === 'eventCompetitor' || resource === 'eventCompetitors') {
          if (item.id) {
            await offlineStorage.saveEventCompetitor(item);
            // Also cache the competitor if present
            if (item.competitor) {
              await offlineStorage.saveCompetitor(item.competitor);
            }
          }
        }
      }
    }
    
    // Handle response objects with data property (common API pattern)
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      for (const item of data.data) {
        if (resource === 'event' || resource === 'events') {
          if (item.id) await offlineStorage.saveEvent(item);
        } else if (resource === 'competitor' || resource === 'competitors') {
          if (item.id) await offlineStorage.saveCompetitor(item);
        } else if (resource === 'category' || resource === 'categories') {
          if (item.id) await offlineStorage.saveCategory(item);
        } else if (resource === 'eventCompetitor' || resource === 'eventCompetitors') {
          if (item.id) {
            await offlineStorage.saveEventCompetitor(item);
            if (item.competitor) {
              await offlineStorage.saveCompetitor(item.competitor);
            }
          }
        }
      }
    }
  }

  private async storeLocally(url: string, data: any, operationId: string): Promise<void> {
    const resourceInfo = this.getResourceFromUrl(url);
    const { resource } = resourceInfo;
    
    if (resource === 'timeEntry') {
      await offlineStorage.saveTimeEntry({
        ...data,
        localId: operationId,
      });
    } else if ((resource === 'event' || resource === 'events') && data.id) {
      await offlineStorage.saveEvent(data);
    } else if ((resource === 'competitor' || resource === 'competitors') && data.id) {
      await offlineStorage.saveCompetitor(data);
    } else if ((resource === 'category' || resource === 'categories') && data.id) {
      await offlineStorage.saveCategory(data);
    } else if ((resource === 'eventCompetitor' || resource === 'eventCompetitors') && data.id) {
      await offlineStorage.saveEventCompetitor(data);
      // Also save competitor if present
      if (data.competitor) {
        await offlineStorage.saveCompetitor(data.competitor);
      }
    }
  }

  private async getFromLocalStorage<T>(url: string): Promise<T> {
    const resourceInfo = this.getResourceFromUrl(url);
    const { resource, id } = resourceInfo;
    
    // Handle single resource by ID
    if (id !== undefined) {
      if (resource === 'event') {
        const event = await offlineStorage.getEvent(id);
        if (event) return event as T;
        throw new Error(`Event ${id} not available offline`);
      } else if (resource === 'competitor') {
        const competitor = await offlineStorage.getCompetitor(id);
        if (competitor) return competitor as T;
        throw new Error(`Competitor ${id} not available offline`);
      } else if (resource === 'category') {
        const category = await offlineStorage.getCategory(id);
        if (category) return category as T;
        throw new Error(`Category ${id} not available offline`);
      } else if (resource === 'eventCompetitor') {
        const eventCompetitor = await offlineStorage.getEventCompetitor(id);
        if (eventCompetitor) return eventCompetitor as T;
        throw new Error(`Event competitor ${id} not available offline`);
      }
    }
    
    // Handle collections
    if (resource === 'events' || resource === 'event') {
      if (id !== undefined) {
        // Get specific event
        const event = await offlineStorage.getEvent(id);
        if (event) return event as T;
      }
      const events = await offlineStorage.getAllEvents();
      return events as T;
    } else if (resource === 'competitors' || resource === 'competitor') {
      if (id !== undefined) {
        const competitor = await offlineStorage.getCompetitor(id);
        if (competitor) return competitor as T;
      }
      const competitors = await offlineStorage.getAllCompetitors();
      return competitors as T;
    } else if (resource === 'categories' || resource === 'category') {
      if (id !== undefined) {
        const category = await offlineStorage.getCategory(id);
        if (category) return category as T;
      }
      const categories = await offlineStorage.getAllCategories();
      return categories as T;
    } else if (resource === 'eventCompetitors' || resource === 'eventCompetitor') {
      if (id !== undefined) {
        // Get event competitors for a specific event
        const eventCompetitors = await offlineStorage.getEventCompetitors(id);
        return eventCompetitors as T;
      }
      const eventCompetitors = await offlineStorage.getAllEventCompetitors();
      return eventCompetitors as T;
    }
    
    throw new Error(`Resource ${resource} not available offline`);
  }
}

export const offlineApiClient = new OfflineApiClient();

