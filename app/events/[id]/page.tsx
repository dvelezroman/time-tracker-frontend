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
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event, EventStatus } from '@/lib/api/services/event.service';
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
  const [error, setError] = useState('');

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
      // Redirect to timer page
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
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleViewTimer}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    View Timer
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

