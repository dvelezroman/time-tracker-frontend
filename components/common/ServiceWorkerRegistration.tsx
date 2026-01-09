'use client';

import { useEffect } from 'react';
import { initOfflineStorage } from '@/lib/storage/offline-storage';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Initialize IndexedDB early
    initOfflineStorage().catch((error) => {
      console.error('Failed to initialize offline storage:', error);
    });

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration);
          
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}

