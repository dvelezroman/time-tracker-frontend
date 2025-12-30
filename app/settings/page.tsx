'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Container,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { settingsService, Settings } from '@/lib/api/services/settings.service';
import { showToast } from '@/components/common/Toast';
import { offlineStorage } from '@/lib/storage/offline-storage';
import { syncManager } from '@/lib/sync/sync-manager';
import { useNetworkStatus } from '@/lib/utils/network';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function SettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    loadSettings();
    loadOfflineSettings();
    loadSyncStatus();
  }, []);

  useEffect(() => {
    // Refresh sync status periodically
    const interval = setInterval(() => {
      loadSyncStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadOfflineSettings = async () => {
    try {
      const offlineModeEnabled = await offlineStorage.getOfflineMode();
      setOfflineMode(offlineModeEnabled);
    } catch (err) {
      console.error('Failed to load offline settings:', err);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const pending = await syncManager.getPendingCount();
      setPendingSyncCount(pending);
    } catch (err) {
      console.error('Failed to load sync status:', err);
    }
  };

  const handleToggleOfflineMode = async (enabled: boolean) => {
    try {
      setSaving(true);
      await offlineStorage.setOfflineMode(enabled);
      setOfflineMode(enabled);
      showToast(
        enabled
          ? t('settings.offlineModeEnabled')
          : t('settings.offlineModeDisabled'),
        'success',
      );
    } catch (err: any) {
      showToast(t('settings.failedToUpdateOfflineMode'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!isOnline) {
      showToast(t('settings.cannotSyncOffline'), 'error');
      return;
    }

    try {
      setSyncing(true);
      setSyncResult(null);
      const result = await syncManager.syncAll();
      setSyncResult(result);
      await loadSyncStatus();
      
      if (result.failed === 0 && result.conflicts === 0) {
        showToast(t('settings.syncSuccessful', { count: result.successful }), 'success');
      } else {
        showToast(
          t('settings.syncCompleted', { 
            successful: result.successful, 
            failed: result.failed, 
            conflicts: result.conflicts 
          }),
          result.failed > 0 ? 'warning' : 'info',
        );
      }
    } catch (err: any) {
      const errorMessage = err.message || t('settings.failedToSync');
      showToast(errorMessage, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t('settings.failedToLoadSettings');
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmail = async (enabled: boolean) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError('');
      const updated = await settingsService.updateSettings({
        emailNotificationsEnabled: enabled,
      });
      setSettings(updated);
      showToast(t('settings.emailSettingsUpdated'), 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t('settings.failedToUpdateSettings');
      setError(errorMessage);
      showToast(errorMessage, 'error');
      // Revert the toggle on error
      setSettings({ ...settings, emailNotificationsEnabled: !enabled });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleWhatsApp = async (enabled: boolean) => {
    if (!settings) return;

    try {
      setSaving(true);
      setError('');
      const updated = await settingsService.updateSettings({
        whatsAppNotificationsEnabled: enabled,
      });
      setSettings(updated);
      showToast(t('settings.whatsAppSettingsUpdated'), 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t('settings.failedToUpdateSettings');
      setError(errorMessage);
      showToast(errorMessage, 'error');
      // Revert the toggle on error
      setSettings({ ...settings, whatsAppNotificationsEnabled: !enabled });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
      <MainLayout>
        <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 2, sm: 3 },
              }}
            >
              {t('settings.title')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  {t('settings.notificationSettings')}
                </Typography>

                {settings && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {t('settings.emailNotifications')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('settings.emailNotificationsDescription')}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.emailNotificationsEnabled}
                            onChange={(e) => handleToggleEmail(e.target.checked)}
                            disabled={saving}
                            color="primary"
                          />
                        }
                        label={settings.emailNotificationsEnabled ? t('settings.enabled') : t('settings.disabled')}
                        labelPlacement="end"
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 200 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {t('settings.whatsappNotifications')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('settings.whatsAppNotificationsDescription')}
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.whatsAppNotificationsEnabled}
                            onChange={(e) => handleToggleWhatsApp(e.target.checked)}
                            disabled={saving}
                            color="primary"
                          />
                        }
                        label={settings.whatsAppNotificationsEnabled ? t('settings.enabled') : t('settings.disabled')}
                        labelPlacement="end"
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Offline Mode Settings */}
            <Card sx={{ mt: 3 }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  {t('settings.offlineMode')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 200 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {t('settings.enableOfflineMode')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('settings.offlineModeDescription')}
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={offlineMode}
                          onChange={(e) => handleToggleOfflineMode(e.target.checked)}
                          disabled={saving}
                          color="primary"
                        />
                      }
                      label={offlineMode ? t('settings.enabled') : t('settings.disabled')}
                      labelPlacement="end"
                    />
                  </Box>

                  {/* Sync Section */}
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {t('settings.dataSync')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {pendingSyncCount > 0
                        ? t('settings.pendingOperations', { count: pendingSyncCount })
                        : t('settings.allDataSynced')}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSync}
                      disabled={!isOnline || syncing || pendingSyncCount === 0}
                      startIcon={syncing ? <CircularProgress size={20} /> : null}
                    >
                      {syncing ? t('settings.syncing') : t('settings.syncNow')}
                    </Button>
                    {!isOnline && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        {t('settings.currentlyOffline')}
                      </Typography>
                    )}
                    {syncResult && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>{t('settings.lastSyncResults')}:</strong>
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          {t('settings.successful')}: {syncResult.successful}
                        </Typography>
                        {syncResult.failed > 0 && (
                          <Typography variant="body2" color="error">
                            {t('settings.failed')}: {syncResult.failed}
                          </Typography>
                        )}
                        {syncResult.conflicts > 0 && (
                          <Typography variant="body2" color="warning.main">
                            {t('settings.conflicts')}: {syncResult.conflicts}
                          </Typography>
                        )}
                        {syncResult.errors.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="error">
                              {t('settings.errors')}:
                            </Typography>
                            {syncResult.errors.slice(0, 3).map((err: string, idx: number) => (
                              <Typography key={idx} variant="caption" color="error" display="block">
                                {err}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
