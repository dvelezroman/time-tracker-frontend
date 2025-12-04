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

export default function SettingsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load settings. Please try again.';
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
      showToast('Email notification settings updated successfully', 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update settings. Please try again.';
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
      showToast('WhatsApp notification settings updated successfully', 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update settings. Please try again.';
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
              Settings
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Notification Settings
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
                          Email Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Enable or disable email notifications when events finish
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
                        label={settings.emailNotificationsEnabled ? 'Enabled' : 'Disabled'}
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
                          WhatsApp Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Enable or disable WhatsApp notifications when sending competitor times
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
                        label={settings.whatsAppNotificationsEnabled ? 'Enabled' : 'Disabled'}
                        labelPlacement="end"
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
