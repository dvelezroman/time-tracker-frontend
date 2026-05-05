import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineStorageDB extends DBSchema {
  events: {
    key: number;
    value: any;
    indexes: { 'by-id': number };
  };
  competitors: {
    key: number;
    value: any;
    indexes: { 'by-id': number };
  };
  timeEntries: {
    key: string;
    value: any;
    indexes: { 'by-event-id': number; 'by-local-id': string };
  };
  categories: {
    key: number;
    value: any;
    indexes: { 'by-event-id': number };
  };
  eventCompetitors: {
    key: number;
    value: any;
    indexes: { 'by-event-id': number; 'by-competitor-id': number };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'CREATE' | 'UPDATE' | 'DELETE';
      resource: 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor';
      endpoint: string;
      payload: any;
      timestamp: string;
      retries: number;
      status: 'pending' | 'syncing' | 'synced' | 'failed';
    };
    indexes: { 'by-status': string; 'by-resource': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<OfflineStorageDB> | null = null;

export const initOfflineStorage = async (): Promise<IDBPDatabase<OfflineStorageDB>> => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineStorageDB>('time-tracker-offline', 1, {
    upgrade(db) {
      // Events store
      if (!db.objectStoreNames.contains('events')) {
        const eventStore = db.createObjectStore('events', { keyPath: 'id' });
        eventStore.createIndex('by-id', 'id');
      }

      // Competitors store
      if (!db.objectStoreNames.contains('competitors')) {
        const competitorStore = db.createObjectStore('competitors', { keyPath: 'id' });
        competitorStore.createIndex('by-id', 'id');
      }

      // Time entries store
      if (!db.objectStoreNames.contains('timeEntries')) {
        const timeEntryStore = db.createObjectStore('timeEntries', { keyPath: 'localId' });
        timeEntryStore.createIndex('by-event-id', 'eventId');
        timeEntryStore.createIndex('by-local-id', 'localId');
      }

      // Categories store
      if (!db.objectStoreNames.contains('categories')) {
        const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
        categoryStore.createIndex('by-event-id', 'eventId');
      }

      // Event Competitors store
      if (!db.objectStoreNames.contains('eventCompetitors')) {
        const eventCompetitorStore = db.createObjectStore('eventCompetitors', { keyPath: 'id' });
        eventCompetitorStore.createIndex('by-event-id', 'eventId');
        eventCompetitorStore.createIndex('by-competitor-id', 'competitorId');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncQueueStore.createIndex('by-status', 'status');
        syncQueueStore.createIndex('by-resource', 'resource');
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
};

export const offlineStorage = {
  // Events
  async saveEvent(event: any): Promise<void> {
    const db = await initOfflineStorage();
    await db.put('events', event);
  },

  async getEvent(id: number): Promise<any | undefined> {
    const db = await initOfflineStorage();
    return db.get('events', id);
  },

  async getAllEvents(): Promise<any[]> {
    const db = await initOfflineStorage();
    return db.getAll('events');
  },

  // Competitors
  async saveCompetitor(competitor: any): Promise<void> {
    const db = await initOfflineStorage();
    await db.put('competitors', competitor);
  },

  async getCompetitor(id: number): Promise<any | undefined> {
    const db = await initOfflineStorage();
    return db.get('competitors', id);
  },

  async getAllCompetitors(): Promise<any[]> {
    const db = await initOfflineStorage();
    return db.getAll('competitors');
  },

  // Time Entries
  async saveTimeEntry(timeEntry: any): Promise<void> {
    const db = await initOfflineStorage();
    await db.put('timeEntries', {
      ...timeEntry,
      localId: timeEntry.localId || `offline-${Date.now()}-${Math.random()}`,
    });
  },

  async getTimeEntry(localId: string): Promise<any | undefined> {
    const db = await initOfflineStorage();
    return db.get('timeEntries', localId);
  },

  async getTimeEntriesByEvent(eventId: number): Promise<any[]> {
    const db = await initOfflineStorage();
    const index = db.transaction('timeEntries').store.index('by-event-id');
    return index.getAll(eventId);
  },

  async getAllTimeEntries(): Promise<any[]> {
    const db = await initOfflineStorage();
    return db.getAll('timeEntries');
  },

  // Categories
  async saveCategory(category: any): Promise<void> {
    const db = await initOfflineStorage();
    await db.put('categories', category);
  },

  async getCategory(id: number): Promise<any | undefined> {
    const db = await initOfflineStorage();
    return db.get('categories', id);
  },

  async getCategoriesByEvent(eventId: number): Promise<any[]> {
    const db = await initOfflineStorage();
    const index = db.transaction('categories').store.index('by-event-id');
    return index.getAll(eventId);
  },

  async getAllCategories(): Promise<any[]> {
    const db = await initOfflineStorage();
    return db.getAll('categories');
  },

  // Event Competitors
  async saveEventCompetitor(eventCompetitor: any): Promise<void> {
    const db = await initOfflineStorage();
    await db.put('eventCompetitors', eventCompetitor);
  },

  async getEventCompetitor(id: number): Promise<any | undefined> {
    const db = await initOfflineStorage();
    return db.get('eventCompetitors', id);
  },

  async getEventCompetitors(eventId: number): Promise<any[]> {
    const db = await initOfflineStorage();
    const index = db.transaction('eventCompetitors').store.index('by-event-id');
    return index.getAll(eventId);
  },

  async getAllEventCompetitors(): Promise<any[]> {
    const db = await initOfflineStorage();
    return db.getAll('eventCompetitors');
  },

  // Preload Event - precarga evento completo con todos sus datos relacionados
  async preloadEvent(eventId: number, eventData: any, competitors: any[], categories: any[]): Promise<void> {
    const db = await initOfflineStorage();

    // Save event (db.put creates its own transaction per operation)
    await db.put('events', eventData);

    // Save event competitors and their competitor data
    for (const eventCompetitor of competitors) {
      await db.put('eventCompetitors', eventCompetitor);
      if (eventCompetitor.competitor) {
        await db.put('competitors', eventCompetitor.competitor);
      }
    }

    // Save categories
    for (const category of categories) {
      await db.put('categories', category);
    }
  },

  // Check if event is preloaded
  async isEventPreloaded(eventId: number): Promise<boolean> {
    const db = await initOfflineStorage();
    const event = await db.get('events', eventId);
    if (!event) return false;
    
    // Check if we have competitors for this event
    const index = db.transaction('eventCompetitors').store.index('by-event-id');
    const competitors = await index.getAll(eventId);
    
    return competitors.length > 0;
  },

  // Sync Queue
  async addToSyncQueue(operation: {
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: 'event' | 'competitor' | 'timeEntry' | 'category' | 'eventCompetitor';
    endpoint: string;
    payload: any;
  }): Promise<string> {
    const db = await initOfflineStorage();
    const id = `sync-${Date.now()}-${Math.random()}`;
    await db.put('syncQueue', {
      id,
      ...operation,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending',
    });
    return id;
  },

  async getSyncQueue(status?: 'pending' | 'syncing' | 'synced' | 'failed'): Promise<any[]> {
    const db = await initOfflineStorage();
    if (status) {
      const index = db.transaction('syncQueue').store.index('by-status');
      return index.getAll(status);
    }
    return db.getAll('syncQueue');
  },

  /** Count of operations waiting to sync (for operator UI). */
  async getPendingSyncCount(): Promise<number> {
    const pending = await this.getSyncQueue('pending');
    return pending.length;
  },

  async updateSyncQueueStatus(id: string, status: 'pending' | 'syncing' | 'synced' | 'failed'): Promise<void> {
    const db = await initOfflineStorage();
    const item = await db.get('syncQueue', id);
    if (item) {
      await db.put('syncQueue', { ...item, status });
    }
  },

  async incrementSyncQueueRetries(id: string): Promise<void> {
    const db = await initOfflineStorage();
    const item = await db.get('syncQueue', id);
    if (item) {
      await db.put('syncQueue', { ...item, retries: item.retries + 1 });
    }
  },

  async removeFromSyncQueue(id: string): Promise<void> {
    const db = await initOfflineStorage();
    await db.delete('syncQueue', id);
  },

  async clearSyncQueue(): Promise<void> {
    const db = await initOfflineStorage();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.store.clear();
    await tx.done;
  },

  // Settings
  async getOfflineMode(): Promise<boolean> {
    const db = await initOfflineStorage();
    const setting = await db.get('settings', 'offlineMode');
    return setting?.value || false;
  },

  async setOfflineMode(enabled: boolean): Promise<void> {
    const db = await initOfflineStorage();
    await db.put('settings', { key: 'offlineMode', value: enabled });
  },
};

