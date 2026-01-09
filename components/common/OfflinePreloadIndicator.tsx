'use client';

import { useState, useEffect } from 'react';
import { Chip, Box, Tooltip, CircularProgress } from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { offlineStorage } from '@/lib/storage/offline-storage';
import { eventService } from '@/lib/api/services/event.service';
import { useNetworkStatus } from '@/lib/utils/network';
import { showToast } from './Toast';

interface OfflinePreloadIndicatorProps {
  eventId: number;
  compact?: boolean;
}

export function OfflinePreloadIndicator({ eventId, compact = false }: OfflinePreloadIndicatorProps) {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    checkPreloadStatus();
  }, [eventId]);

  const checkPreloadStatus = async () => {
    try {
      const preloaded = await offlineStorage.isEventPreloaded(eventId);
      setIsPreloaded(preloaded);
    } catch (error) {
      console.error('Failed to check preload status:', error);
    }
  };

  const handlePreload = async () => {
    if (!isOnline) {
      showToast('Cannot preload while offline', 'error');
      return;
    }

    setIsPreloading(true);
    try {
      await eventService.preloadEventData(eventId);
      await checkPreloadStatus();
      showToast('Event data preloaded successfully', 'success');
    } catch (error: any) {
      console.error('Failed to preload event:', error);
      showToast(error.message || 'Failed to preload event data', 'error');
    } finally {
      setIsPreloading(false);
    }
  };

  if (compact) {
    return (
      <Tooltip title={isPreloaded ? 'Event is preloaded for offline use' : 'Click to preload event for offline use'}>
        <Chip
          icon={isPreloaded ? <CloudDoneIcon /> : <CloudDownloadIcon />}
          label={isPreloaded ? 'Preloaded' : 'Preload'}
          color={isPreloaded ? 'success' : 'default'}
          size="small"
          onClick={!isPreloaded && isOnline ? handlePreload : undefined}
          disabled={isPreloading || (!isOnline && !isPreloaded)}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isPreloading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={16} />
          <Chip label="Preloading..." size="small" />
        </Box>
      ) : isPreloaded ? (
        <Tooltip title="Event is preloaded and available offline">
          <Chip
            icon={<CloudDoneIcon />}
            label="Preloaded for Offline"
            color="success"
            size="small"
          />
        </Tooltip>
      ) : (
        <Tooltip title="Preload event data for offline use">
          <Chip
            icon={<CloudDownloadIcon />}
            label="Preload Event"
            size="small"
            onClick={isOnline ? handlePreload : undefined}
            disabled={!isOnline}
            clickable={isOnline}
          />
        </Tooltip>
      )}
      {!isOnline && (
        <Tooltip title="You are currently offline">
          <Chip
            icon={<CloudOffIcon />}
            label="Offline"
            color="warning"
            size="small"
          />
        </Tooltip>
      )}
    </Box>
  );
}
