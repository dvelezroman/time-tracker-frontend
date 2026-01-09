import { useEffect, useRef } from 'react';
import { websocketClient } from './websocket-client';
import { Event } from '@/lib/api/services/event.service';

interface UseEventUpdatesOptions {
  eventId: number;
  onEventUpdated?: (event: Event) => void;
  enabled?: boolean;
}

export function useEventUpdates({ eventId, onEventUpdated, enabled = true }: UseEventUpdatesOptions) {
  const onEventUpdatedRef = useRef(onEventUpdated);
  const joinedRef = useRef(false);

  // Update ref when callback changes
  useEffect(() => {
    onEventUpdatedRef.current = onEventUpdated;
  }, [onEventUpdated]);

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

    const handleEventUpdated = (event: Event) => {
      if (event.id === eventId && onEventUpdatedRef.current) {
        onEventUpdatedRef.current(event);
      }
    };

    websocketClient.on('event:updated', handleEventUpdated);

    return () => {
      mounted = false;
      if (joinedRef.current) {
        websocketClient.leaveEventRoom(eventId).catch(console.error);
        joinedRef.current = false;
      }
      websocketClient.off('event:updated', handleEventUpdated);
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
