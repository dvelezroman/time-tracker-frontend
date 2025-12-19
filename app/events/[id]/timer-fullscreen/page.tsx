'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { eventService, Event } from '@/lib/api/services/event.service';
import {
  timeEntryService,
  LeaderboardResponse,
  LeaderboardEntry,
  RecordFinishResponse,
} from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { FullScreenTimer } from '@/components/common/FullScreenTimer';
import { format } from 'date-fns';
import { showToast } from '@/components/common/Toast';

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
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [sequentialNumber, setSequentialNumber] = useState('');
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const loadLeaderboard = useCallback(async () => {
    if (!event || event.status !== 'ONGOING') return;

    try {
      setLoadingLeaderboard(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const leaderboardData = await timeEntryService.getLeaderboard(eventId, timezone);
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      // Silently fail for leaderboard - don't break the timer
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [eventId, event]);

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

  // Load leaderboard when event is loaded and ONGOING
  useEffect(() => {
    if (event && event.status === 'ONGOING') {
      loadLeaderboard();
    }
  }, [event, loadLeaderboard]);

  // Auto-refresh leaderboard every 3 seconds when event is ONGOING
  useEffect(() => {
    if (!event || event.status !== 'ONGOING') return;

    const leaderboardInterval = setInterval(() => {
      loadLeaderboard();
    }, 3000); // Refresh every 3 seconds

    return () => {
      clearInterval(leaderboardInterval);
    };
  }, [event, loadLeaderboard]);

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

  // Auto-focus input when event is loaded (must be before any conditional returns)
  useEffect(() => {
    if (event && event.status === 'ONGOING' && !loading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [event, loading]);

  // All hooks must be called before any conditional returns
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

  const formatDuration = (milliseconds: number | null): string => {
    if (milliseconds === null) return '-';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  };

  const formatTime = (dateString: string | null, localDateString?: string): string => {
    if (!dateString) return '-';
    if (localDateString) {
      return format(new Date(localDateString), 'HH:mm:ss');
    }
    return format(new Date(dateString), 'HH:mm:ss');
  };

  const handleSequentialNumberSubmit = async (seqNum: string) => {
    if (recording) return;

    const trimmedSeqNum = seqNum.trim();
    if (!trimmedSeqNum) {
      showToast('Please enter a competitor number', 'error');
      return;
    }

    const seqNumber = parseInt(trimmedSeqNum, 10);
    if (isNaN(seqNumber) || seqNumber <= 0) {
      showToast('Please enter a valid competitor number', 'error');
      return;
    }

    try {
      setRecording(true);
      setError(null);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await timeEntryService.recordFinishBySequentialNumber(eventId, seqNumber, timezone);

      showToast(
        `Finish time recorded for ${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})!`,
        'success',
      );

      // Clear input and refocus, reload leaderboard
      setSequentialNumber('');
      loadLeaderboard();
      setTimeout(() => {
        setRecording(false);
        inputRef.current?.focus();
      }, 500);
    } catch (err: any) {
      setRecording(false);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to record finish time.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
        overflow: 'hidden',
      }}
    >
      {/* Exit Button */}
      <Tooltip title="Exit to Timer Page">
        <IconButton
          onClick={() => router.push(ROUTES.EVENTS_TIMER(eventId))}
          sx={{
            position: 'absolute',
            top: isMobile ? 8 : 16,
            right: isMobile ? 8 : 16,
            zIndex: 1000,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            },
          }}
          size="large"
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>

      {/* Main Timer Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? 2 : 4,
          position: 'relative',
          overflow: 'hidden',
          flex: '0 0 70%', // 70% of screen width
          minWidth: 0, // Allow flex item to shrink below content size
          maxWidth: '70%', // Prevent overflow
        }}
      >
        {/* Event Name */}
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: isMobile 
              ? 'clamp(1.5rem, 6vw, 2.5rem)' 
              : 'clamp(2rem, 4vw, 4rem)',
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
            mb: isMobile ? 2 : 4,
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
              mb: isMobile ? 3 : 6,
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {event.description && (
              <Typography
                sx={{
                  fontSize: isMobile 
                    ? 'clamp(0.875rem, 3vw, 1.125rem)' 
                    : 'clamp(1.125rem, 2vw, 1.75rem)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  mb: event.location ? 2 : 0,
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
                    : 'clamp(1.125rem, 2vw, 1.75rem)',
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
            maxWidth: '100%',
            overflow: 'hidden',
            minHeight: 0, // Allow flex item to shrink
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <FullScreenTimer startDate={event.startDate} />
          </Box>
        </Box>

        {/* Current Time */}
        <Typography
          sx={{
            fontSize: isMobile 
              ? 'clamp(0.75rem, 2.5vw, 1rem)' 
              : 'clamp(1rem, 1.5vw, 1.5rem)',
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            mt: isMobile ? 2 : 4,
            mb: isMobile ? 2 : 3,
            fontWeight: 500,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {format(currentTime, 'PPpp')}
        </Typography>

        {/* Competitor Number Input */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
            mt: isMobile ? 2 : 3,
          }}
        >
          <TextField
            inputRef={inputRef}
            label="Enter Competitor Number"
            type="number"
            value={sequentialNumber}
            onChange={(e) => {
              setSequentialNumber(e.target.value);
              setError(null);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !recording) {
                handleSequentialNumberSubmit(sequentialNumber);
              }
            }}
            disabled={recording}
            fullWidth
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                padding: isMobile ? '10px 14px' : '14px 18px',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography variant="h6" color="text.secondary">
                    #
                  </Typography>
                </InputAdornment>
              ),
            }}
            helperText={recording ? 'Recording finish time...' : 'Enter number and press Enter'}
          />
        </Box>

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

      {/* Competitors List Side Panel */}
      {!isMobile && (
        <Box
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
            borderLeft: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            flex: '0 0 30%', // 30% of screen width
            minWidth: 0, // Allow flex item to shrink
            maxWidth: '30%', // Prevent overflow
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'transparent',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                mb: 2,
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              }}
            >
              Finished Competitors
            </Typography>

            {loadingLeaderboard && !leaderboard ? (
              <Box display="flex" justifyContent="center" alignItems="center" flex={1}>
                <CircularProgress />
              </Box>
            ) : leaderboard ? (
              <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
                {/* Only show finished competitors (with endDate not null) */}
                {(() => {
                  // Filter to ensure only entries with endDate are shown
                  const finishedEntries = leaderboard.finished.filter(
                    (entry) => entry.endDate !== null && entry.duration !== null,
                  );
                  return finishedEntries.length > 0 ? (
                    <>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 500,
                          fontSize: 'clamp(0.875rem, 1.3vw, 1rem)',
                          mb: 2,
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        {finishedEntries.length} of {leaderboard.total} finished
                      </Typography>
                      {finishedEntries.map((entry, index) => (
                      <Box
                        key={entry.timeEntryId || index}
                        sx={{
                          mb: 2,
                          p: 2,
                          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#ffffff',
                          borderRadius: 1.5,
                          border: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: theme.palette.mode === 'dark' ? '#555' : '#1976d2',
                            boxShadow: theme.palette.mode === 'dark' 
                              ? '0 2px 8px rgba(255, 255, 255, 0.1)' 
                              : '0 2px 8px rgba(25, 118, 210, 0.2)',
                          },
                        }}
                      >
                        {/* Rank and Time Row */}
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={`Overall #${entry.rank}`}
                              color="success"
                              size="small"
                              sx={{
                                fontWeight: 'bold',
                                fontSize: 'clamp(0.7rem, 1.1vw, 0.8rem)',
                              }}
                            />
                            {entry.category && entry.categoryRank && (
                              <Chip
                                label={`${entry.category.name} #${entry.categoryRank}`}
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: 'clamp(0.65rem, 1vw, 0.75rem)',
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 'clamp(0.9rem, 1.4vw, 1.1rem)',
                              fontWeight: 700,
                              color: theme.palette.mode === 'dark' ? '#4caf50' : '#2e7d32',
                            }}
                          >
                            {formatDuration(entry.duration)}
                          </Typography>
                        </Box>
                        
                        {/* Competitor Name */}
                        <Typography
                          sx={{
                            fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
                            fontWeight: 700,
                            mb: 0.5,
                            color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                          }}
                        >
                          {entry.competitor.firstName} {entry.competitor.lastName}
                        </Typography>
                        
                        {/* Finish Time */}
                        <Typography
                          sx={{
                            fontSize: 'clamp(0.8rem, 1.2vw, 0.9rem)',
                            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                            fontWeight: 500,
                          }}
                        >
                          Finish: {formatTime(entry.endDate, entry.endDateLocal)}
                        </Typography>
                      </Box>
                    ))}
                  </>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Typography
                        sx={{
                          fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                          color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        No competitors finished yet
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography
                  sx={{
                    fontSize: 'clamp(0.875rem, 1.5vw, 1rem)',
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                  }}
                >
                  Loading competitors...
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}

