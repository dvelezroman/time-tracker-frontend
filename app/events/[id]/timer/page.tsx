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
import { Timer } from '@/components/common/Timer';

export default function EventTimerPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
      // Refresh event data periodically to check if status changed
      const interval = setInterval(loadEvent, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventData = await eventService.getById(eventId, timezone);
      setEvent(eventData);

      // If event is not ONGOING, redirect to detail page
      if (eventData.status !== 'ONGOING') {
        router.push(ROUTES.EVENTS_DETAIL(eventId));
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load event. Please try again.';
      setError(errorMessage);
      if (!event) {
        // Only show toast if we don't have event data yet
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStopEvent = async () => {
    if (!event) return;

    try {
      setStopping(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await eventService.stop(eventId, { timezone });
      showToast('Event stopped successfully!', 'success');
      // Redirect to event detail page
      router.push(ROUTES.EVENTS_DETAIL(eventId));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to stop event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setStopping(false);
    }
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

  if (event.status !== 'ONGOING') {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Alert severity="warning" sx={{ mb: 2 }}>
              Event is not currently running. Status: {event.status}
            </Alert>
            <Button variant="contained" onClick={() => router.push(ROUTES.EVENTS_DETAIL(eventId))}>
              View Event Details
            </Button>
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
            <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" align="center" gutterBottom>
              {event.name}
            </Typography>
            {event.description && (
              <Typography variant="body1" color="text.secondary" align="center">
                {event.description}
              </Typography>
            )}
            {event.location && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {event.location}
              </Typography>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 4,
                }}
              >
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Elapsed Time
                </Typography>
                <Timer startDate={event.startDate} />
                <Box sx={{ mt: 4, width: '100%', maxWidth: 300 }}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={handleStopEvent}
                    disabled={stopping}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    {stopping ? <CircularProgress size={24} /> : 'Stop Event'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

