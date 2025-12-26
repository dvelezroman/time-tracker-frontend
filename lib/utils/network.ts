import { useEffect, useState } from 'react';

export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

export const useNetworkStatus = () => {
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnlineStatus;
};

export const checkNetworkConnection = async (): Promise<boolean> => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    // Try to fetch a small resource to verify actual connectivity
    const response = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
    return response.ok;
  } catch {
    return false;
  }
};

