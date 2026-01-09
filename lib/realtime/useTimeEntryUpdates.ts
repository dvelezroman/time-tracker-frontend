import { useEffect, useRef } from 'react';
import { websocketClient } from './websocket-client';
import { TimeEntryResult } from '@/lib/api/services/time-entry.service';

interface UseTimeEntryUpdatesOptions {
  eventId: number;
  onTimeEntryCreated?: (timeEntry: TimeEntryResult) => void;
  onTimeEntryUpdated?: (timeEntry: TimeEntryResult) => void;
  onTimeEntrySynced?: (entries: TimeEntryResult[]) => void;
  enabled?: boolean;
}

export function useTimeEntryUpdates({
  eventId,
  onTimeEntryCreated,
  onTimeEntryUpdated,
  onTimeEntrySynced,
  enabled = true,
}: UseTimeEntryUpdatesOptions) {
  const onTimeEntryCreatedRef = useRef(onTimeEntryCreated);
  const onTimeEntryUpdatedRef = useRef(onTimeEntryUpdated);
  const onTimeEntrySyncedRef = useRef(onTimeEntrySynced);
  const joinedRef = useRef(false);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeEntryCreatedRef.current = onTimeEntryCreated;
  }, [onTimeEntryCreated]);

  useEffect(() => {
    onTimeEntryUpdatedRef.current = onTimeEntryUpdated;
  }, [onTimeEntryUpdated]);

  useEffect(() => {
    onTimeEntrySyncedRef.current = onTimeEntrySynced;
  }, [onTimeEntrySynced]);

  useEffect(() => {
    if (!enabled || !eventId) {
      return;
    }

    if (!websocketClient.connected) {
      console.warn('WebSocket not connected, cannot join event room');
      return;
    }

    let mounted = true;

    const joinRoom = async () => {
      try {
        await websocketClient.joinEventRoom(eventId);
        if (mounted) {
          joinedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to join event room:', error);
      }
    };

    joinRoom();

    const handleTimeEntryCreated = (timeEntry: TimeEntryResult) => {
      if (onTimeEntryCreatedRef.current) {
        onTimeEntryCreatedRef.current(timeEntry);
      }
    };

    const handleTimeEntryUpdated = (timeEntry: TimeEntryResult) => {
      if (onTimeEntryUpdatedRef.current) {
        onTimeEntryUpdatedRef.current(timeEntry);
      }
    };

    const handleTimeEntrySynced = (data: { entries: TimeEntryResult[] }) => {
      if (onTimeEntrySyncedRef.current) {
        onTimeEntrySyncedRef.current(data.entries);
      }
    };

    websocketClient.on('time-entry:created', handleTimeEntryCreated);
    websocketClient.on('time-entry:updated', handleTimeEntryUpdated);
    websocketClient.on('time-entry:synced', handleTimeEntrySynced);

    return () => {
      mounted = false;
      if (joinedRef.current) {
        websocketClient.leaveEventRoom(eventId).catch(console.error);
        joinedRef.current = false;
      }
      websocketClient.off('time-entry:created', handleTimeEntryCreated);
      websocketClient.off('time-entry:updated', handleTimeEntryUpdated);
      websocketClient.off('time-entry:synced', handleTimeEntrySynced);
    };
  }, [eventId, enabled]);

  // Rejoin room when connection is restored
  useEffect(() => {
    if (!enabled || !eventId || joinedRef.current) {
      return;
    }

    const handleConnect = async () => {
      if (websocketClient.connected && !joinedRef.current) {
        try {
          await websocketClient.joinEventRoom(eventId);
          joinedRef.current = true;
        } catch (error) {
          console.error('Failed to rejoin event room:', error);
        }
      }
    };

    websocketClient.on('connect', handleConnect);

    return () => {
      websocketClient.off('connect', handleConnect);
    };
  }, [eventId, enabled]);
}
