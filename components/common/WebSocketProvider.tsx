'use client';

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/realtime/useWebSocket';
import { useAuthStore } from '@/store/useAuthStore';

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { connected, error } = useWebSocket();

  useEffect(() => {
    if (error) {
      console.warn('WebSocket connection error:', error);
    }
  }, [error]);

  // WebSocket connection is handled by useWebSocket hook
  // No need to render anything special, just ensure it's initialized
  return <>{children}</>;
}
