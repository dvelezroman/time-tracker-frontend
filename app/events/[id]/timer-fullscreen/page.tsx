'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { eventService, Event } from '@/lib/api/services/event.service';
import { ROUTES } from '@/lib/constants';
import { FullScreenTimer } from '@/components/common/FullScreenTimer';
import { format } from 'date-fns';

export default function FullScreenTimerPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const loadEvent = useCallback(async () => {
    try {
      setError(null);
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
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    if (isNaN(eventId)) {
      router.push(ROUTES.EVENTS);
      return;
    }

    loadEvent();

    // Refresh event data every 30 seconds
    const eventInterval = setInterval(loadEvent, 30000);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(eventInterval);
      clearInterval(timeInterval);
    };
  }, [eventId, loadEvent, router]);

  // Handle ESC key to exit full-screen
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push(ROUTES.EVENTS_DETAIL(eventId));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [eventId, router]);

  if (loading) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
          Loading event...
        </Typography>
      </Box>
    );
  }

  if (error && !event) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
          p: 4,
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
        }}
      >
        <Alert severity="info">Event not found</Alert>
      </Box>
    );
  }

  if (event.status !== 'ONGOING') {
    return (
      <Box
        sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
          p: 4,
        }}
      >
        <Alert severity="warning" sx={{ maxWidth: 600, mb: 2 }}>
          Event is not currently running. Status: {event.status}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff', // Pure colors for better contrast
        padding: isMobile ? 2 : 6, // More padding on large displays
        position: 'relative',
        overflow: 'hidden', // Prevent any overflow
      }}
    >
      {/* Event Name */}
      <Typography
        component="h1"
        sx={{
          fontWeight: 800,
          fontSize: isMobile 
            ? 'clamp(1.5rem, 6vw, 2.5rem)' 
            : 'clamp(2rem, 4vw, 4rem)', // Scales up to 4rem on large displays
          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
          mb: isMobile ? 2 : 6, // More spacing on large displays
          textAlign: 'center',
          maxWidth: '90%',
          textShadow: theme.palette.mode === 'dark'
            ? '0 2px 10px rgba(255, 255, 255, 0.3)'
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {event.name}
      </Typography>

      {/* Location/Description */}
      {(event.location || event.description) && (
        <Box
          sx={{
            mb: isMobile ? 3 : 8, // More spacing on large displays
            textAlign: 'center',
            maxWidth: '80%',
          }}
        >
          {event.description && (
            <Typography
              sx={{
                fontSize: isMobile 
                  ? 'clamp(0.875rem, 3vw, 1.125rem)' 
                  : 'clamp(1.125rem, 2vw, 1.75rem)', // Scales up on large displays
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                mb: event.location ? 2 : 0, // More spacing
                fontWeight: 400,
                lineHeight: 1.5,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              {event.description}
            </Typography>
          )}
          {event.location && (
            <Typography
              sx={{
                fontSize: isMobile 
                  ? 'clamp(0.875rem, 3vw, 1.125rem)' 
                  : 'clamp(1.125rem, 2vw, 1.75rem)', // Scales up on large displays
                color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                fontWeight: 600,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}
            >
              📍 {event.location}
            </Typography>
          )}
        </Box>
      )}

      {/* Timer Display */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <FullScreenTimer startDate={event.startDate} />
      </Box>

      {/* Current Time */}
      <Typography
        sx={{
          fontSize: isMobile 
            ? 'clamp(0.75rem, 2.5vw, 1rem)' 
            : 'clamp(1rem, 1.5vw, 1.5rem)', // Scales up on large displays
          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          mt: isMobile ? 2 : 6, // More spacing on large displays
          fontWeight: 500,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {format(currentTime, 'PPpp')}
      </Typography>

      {/* Error message if any */}
      {error && (
        <Alert
          severity="error"
          sx={{
            position: 'absolute',
            top: isMobile ? 16 : 24,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '90%',
            zIndex: 1000,
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}

