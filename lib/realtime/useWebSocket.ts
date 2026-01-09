import { useEffect, useRef, useState } from 'react';
import { websocketClient } from './websocket-client';
import { useAuthStore } from '@/store/useAuthStore';

export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      websocketClient.disconnect();
      setConnected(false);
      return;
    }

    let mounted = true;

    const connect = async () => {
      try {
        await websocketClient.connect(token);
        if (mounted) {
          setConnected(true);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setConnected(false);
          setError(err.message || 'Failed to connect to WebSocket');
          // Schedule retry
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mounted && isAuthenticated && token) {
              connect();
            }
          }, 5000);
        }
      }
    };

    connect();

    // Listen to connection state changes
    const handleConnect = () => {
      if (mounted) {
        setConnected(true);
        setError(null);
      }
    };

    const handleDisconnect = () => {
      if (mounted) {
        setConnected(false);
      }
    };

    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);

    return () => {
      mounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
    };
  }, [isAuthenticated, token]);

  return { connected, error };
}
