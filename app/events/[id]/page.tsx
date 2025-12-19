'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Chip,
  Container,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event, EventStatus } from '@/lib/api/services/event.service';
import { eventCompetitorService } from '@/lib/api/services/event-competitor.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
    total: number;
  } | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventData = await eventService.getById(eventId, timezone);
      setEvent(eventData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEvent = async () => {
    if (!event) return;

    try {
      setStarting(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await eventService.start(eventId, { timezone });
      showToast('Event started successfully!', 'success');
      
      // Open full screen timer in a new tab immediately after success
      const fullScreenUrl = ROUTES.EVENTS_TIMER_FULLSCREEN(eventId);
      const newTab = window.open(fullScreenUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
        // Popup was blocked - show a message with a link
        showToast(
          'Popup blocked. Use the "Full Screen Timer" button to open it, or allow popups for this site.',
          'warning',
        );
      }
      
      // Also redirect to timer page in current tab
      router.push(ROUTES.EVENTS_TIMER(eventId));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to start event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleViewTimer = () => {
    router.push(ROUTES.EVENTS_TIMER(eventId));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      showToast('Invalid file type. Please upload an Excel file (.xlsx or .xls)', 'error');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('File size exceeds 10MB limit', 'error');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setUploadResult(null);

      const result = await eventCompetitorService.importExcel(file, eventId);

      setUploadResult(result);

      if (result.failed === 0 && result.errors.length === 0) {
        showToast(
          `Successfully imported ${result.created + result.updated} competitor(s)!`,
          'success',
        );
        // Reload event to refresh data
        loadEvent();
      } else {
        showToast(
          `Import completed with ${result.failed} failure(s). ${result.created + result.updated} competitor(s) imported.`,
          result.failed > 0 ? 'warning' : 'success',
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to import Excel file. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSendWhatsAppTimes = async () => {
    if (!event) return;

    try {
      setSendingWhatsApp(true);
      setError('');
      const result = await eventService.sendWhatsAppTimes(eventId);
      showToast(
        `WhatsApp notifications queued successfully! ${result.queued} sent, ${result.skipped} skipped.`,
        'success',
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to send WhatsApp notifications. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const getStatusColor = (status: EventStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'PUBLISHED':
        return 'primary';
      case 'ONGOING':
        return 'success';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string, localDateString?: string) => {
    if (localDateString) {
      return format(new Date(localDateString), 'PPpp');
    }
    return format(new Date(dateString), 'PPpp');
  };

  if (loading) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(ROUTES.EVENTS)}
                sx={{ mb: 2 }}
                size={isMobile ? 'medium' : 'large'}
              >
                Back to Events
              </Button>
            </Box>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error && !event) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(ROUTES.EVENTS)}
                sx={{ mb: 2 }}
                size={isMobile ? 'medium' : 'large'}
              >
                Back to Events
              </Button>
            </Box>
            <Alert severity="error">{error}</Alert>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(ROUTES.EVENTS)}
                sx={{ mb: 2 }}
                size={isMobile ? 'medium' : 'large'}
              >
                Back to Events
              </Button>
            </Box>
            <Alert severity="info">Event not found</Alert>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
      <MainLayout>
        <Container maxWidth="md">
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(ROUTES.EVENTS)}
              sx={{ mb: 2 }}
              size={isMobile ? 'medium' : 'large'}
            >
              Back to Events
            </Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
                {event.name}
              </Typography>
              <Chip label={event.status} color={getStatusColor(event.status)} />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {event.status === 'ONGOING' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                How to Record Competitor Finish Times:
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Click &quot;Scan QR Code&quot; button to open the QR scanner</li>
                  <li>Use your device camera to scan each competitor&apos;s QR code when they finish</li>
                  <li>Or use &quot;Manual Entry&quot; to enter the QR code data manually</li>
                  <li>Finish times are automatically recorded and appear on the leaderboard</li>
                </ul>
              </Typography>
            </Alert>
          )}

          <Card>
            <CardContent>
              {event.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">{event.description}</Typography>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Start Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(event.startDate, event.startDateLocal)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  End Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(event.endDate, event.endDateLocal)}
                </Typography>
              </Box>

              {event.location && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Location
                  </Typography>
                  <Typography variant="body1">{event.location}</Typography>
                </Box>
              )}

              <Box display="flex" gap={2} flexWrap="wrap" mt={4}>
                {(event.status === 'DRAFT' || event.status === 'PUBLISHED') && (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_EDIT(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleStartEvent}
                      disabled={starting}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      {starting ? <CircularProgress size={24} /> : 'Start Event'}
                    </Button>
                  </>
                )}

                {event.status === 'ONGOING' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleViewTimer}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      View Timer
                    </Button>
                    <Button
                      variant="contained"
                      color="info"
                      onClick={() => router.push(ROUTES.EVENTS_TIMER_FULLSCREEN(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Full Screen Timer
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_SCAN(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Scan QR Code
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_LEADERBOARD(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Leaderboard
                    </Button>
                  </>
                )}

                {(event.status === 'ONGOING' || event.status === 'COMPLETED') && (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_LEADERBOARD(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Leaderboard
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => router.push(ROUTES.EVENTS_QR_CODES(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      QR Codes
                    </Button>
                  </>
                )}

                {event.status === 'COMPLETED' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={sendingWhatsApp ? <CircularProgress size={20} /> : <WhatsAppIcon />}
                      onClick={handleSendWhatsAppTimes}
                      disabled={sendingWhatsApp}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      {sendingWhatsApp ? 'Sending...' : 'Send Times via WhatsApp'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(`${ROUTES.NOTIFICATIONS}?eventId=${event.id}`)}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Send Notifications
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Excel Import Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Competitors from Excel
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload an Excel file (.xlsx or .xls) to import competitors and register them to this event.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Excel File Format:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                  <li>
                    <strong>Column A:</strong> First Name (required)
                  </li>
                  <li>
                    <strong>Column B:</strong> Last Name (required)
                  </li>
                  <li>
                    <strong>Column C:</strong> Email (optional)
                  </li>
                  <li>
                    <strong>Column D:</strong> Phone (optional)
                  </li>
                  <li>
                    <strong>Column E:</strong> Event ID (optional, defaults to current event)
                  </li>
                  <li>
                    <strong>Column F:</strong> Category Name or Category ID (optional)
                  </li>
                  <li>
                    <strong>Column G:</strong> Sequential Number (optional, auto-assigned if not provided)
                  </li>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Note: The first row is treated as a header and will be skipped. Maximum file size: 10MB
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="excel-upload-input"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="excel-upload-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    disabled={uploading}
                    size={isMobile ? 'medium' : 'large'}
                    sx={{ mb: 2 }}
                  >
                    {uploading ? 'Uploading...' : 'Choose Excel File'}
                  </Button>
                </label>
              </Box>

              {uploadResult && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Import Results:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={`Total: ${uploadResult.total}`}
                      color="default"
                      variant="outlined"
                    />
                    <Chip
                      label={`Created: ${uploadResult.created}`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={`Updated: ${uploadResult.updated}`}
                      color="info"
                      variant="outlined"
                    />
                    <Chip
                      label={`Skipped: ${uploadResult.skipped}`}
                      color="warning"
                      variant="outlined"
                    />
                    {uploadResult.failed > 0 && (
                      <Chip
                        label={`Failed: ${uploadResult.failed}`}
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {uploadResult.errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Errors:
                      </Typography>
                      <Box component="ul" sx={{ mb: 0, pl: 2 }}>
                        {uploadResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>
                            <Typography variant="body2">{error}</Typography>
                          </li>
                        ))}
                        {uploadResult.errors.length > 10 && (
                          <li>
                            <Typography variant="body2" color="text.secondary">
                              ... and {uploadResult.errors.length - 10} more error(s)
                            </Typography>
                          </li>
                        )}
                      </Box>
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

