'use client';

import { useState, useEffect } from 'react';
import { Alert, Box, Typography, Button, Chip } from '@mui/material';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { useRouter } from 'next/navigation';
import { offlineStorage } from '@/lib/storage/offline-storage';
import { syncManager } from '@/lib/sync/sync-manager';
import { useNetworkStatus } from '@/lib/utils/network';
const ROUTES = {
  SETTINGS: '/settings',
};

export function OfflineIndicator() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const mode = await offlineStorage.getOfflineMode();
      setOfflineMode(mode);
      if (mode) {
        const count = await syncManager.getPendingCount();
        setPendingCount(count);
      }
    } catch (err) {
      console.error('Failed to load offline status:', err);
    }
  };

  if (!offlineMode) {
    return null;
  }

  return (
    <Alert
      severity="info"
      icon={<CloudOffIcon />}
      sx={{
        borderRadius: 0,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
      action={
        <Box display="flex" alignItems="center" gap={1}>
          {pendingCount > 0 && (
            <Chip
              label={`${pendingCount} pending`}
              size="small"
              color="warning"
              sx={{ mr: 1 }}
            />
          )}
          <Button
            color="inherit"
            size="small"
            onClick={() => router.push(ROUTES.SETTINGS)}
          >
            Settings
          </Button>
        </Box>
      }
    >
      <Typography variant="body2">
        <strong>Offline Mode Active</strong> - All operations are being stored locally.
        {pendingCount > 0 && ` ${pendingCount} operation(s) pending sync.`}
      </Typography>
    </Alert>
  );
}

