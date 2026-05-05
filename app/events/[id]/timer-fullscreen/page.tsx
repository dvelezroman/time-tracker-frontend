'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Skeleton,
  Stack,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { eventService, Event } from '@/lib/api/services/event.service';
import {
  timeEntryService,
  LeaderboardResponse,
  LeaderboardEntry,
  TimeEntry,
} from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { FullScreenTimer } from '@/components/common/FullScreenTimer';
import { format } from 'date-fns';
import { showToast } from '@/components/common/Toast';
import { useEventUpdates } from '@/lib/realtime/useEventUpdates';
import { useTimeEntryUpdates } from '@/lib/realtime/useTimeEntryUpdates';
import { useWebSocket } from '@/lib/realtime/useWebSocket';
import { offlineStorage } from '@/lib/storage/offline-storage';
import { playFinisherChime } from '@/lib/scanner/scanFeedback';

function isTvDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('display') === 'tv';
}

function isFinishedTimeEntryPayload(entry: unknown): entry is TimeEntry & { competitor?: { firstName: string; lastName: string } } {
  if (!entry || typeof entry !== 'object') return false;
  const e = entry as TimeEntry;
  return e.endDate != null && e.duration != null && !!(e as TimeEntry).competitor;
}

export default function FullScreenTimerPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [tvMode] = useState(isTvDisplayMode);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [sequentialNumber, setSequentialNumber] = useState('');
  const [recording, setRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [finisherBanner, setFinisherBanner] = useState<{
    id: string;
    name: string;
    durationLabel: string;
  } | null>(null);
  const finisherTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

  const loadEvent = useCallback(async () => {
    try {
      setError(null);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventData = await eventService.getById(eventId, timezone);
      setEvent(eventData);

      if (eventData.status !== 'ONGOING') {
        window.close();
        setTimeout(() => {
          router.push(ROUTES.EVENTS_DETAIL(eventId));
        }, 100);
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load event. Please try again.';
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
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [eventId, event]);

  const showFinisherFromPayload = useCallback((entry: TimeEntry & { competitor?: { firstName: string; lastName: string } }) => {
    if (!entry.competitor) return;
    const ms = entry.duration;
    if (ms == null) return;
    const totalSeconds = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const durationLabel =
      hours > 0
        ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
        : `${mins}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;

    const name = `${entry.competitor.firstName} ${entry.competitor.lastName}`;
    const id = `${entry.id}-${Date.now()}`;
    if (finisherTimerRef.current) clearTimeout(finisherTimerRef.current);
    setFinisherBanner({ id, name, durationLabel });
    try {
      playFinisherChime();
    } catch {
      /* ignore */
    }
    finisherTimerRef.current = setTimeout(() => setFinisherBanner(null), 9000);
  }, []);

  const { connected: wsConnected } = useWebSocket();

  useEventUpdates({
    eventId,
    onEventUpdated: (updatedEvent) => {
      setEvent(updatedEvent);
      if (updatedEvent.status !== 'ONGOING') {
        window.close();
        setTimeout(() => {
          router.push(ROUTES.EVENTS_DETAIL(eventId));
        }, 100);
      }
    },
    enabled: wsConnected && !!eventId,
  });

  useTimeEntryUpdates({
    eventId,
    onTimeEntryCreated: (te) => {
      if (isFinishedTimeEntryPayload(te)) {
        showFinisherFromPayload(te);
      }
      void loadLeaderboard();
    },
    onTimeEntryUpdated: (te) => {
      if (isFinishedTimeEntryPayload(te)) {
        showFinisherFromPayload(te);
      }
      void loadLeaderboard();
    },
    onTimeEntrySynced: () => {
      void loadLeaderboard();
    },
    enabled: wsConnected && !!eventId && event?.status === 'ONGOING',
  });

  useEffect(() => {
    if (isNaN(eventId)) {
      router.push(ROUTES.EVENTS);
      return;
    }

    loadEvent();

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
      if (finisherTimerRef.current) clearTimeout(finisherTimerRef.current);
    };
  }, [eventId, router, loadEvent]);

  useEffect(() => {
    if (event && event.status === 'ONGOING') {
      void loadLeaderboard();
    }
  }, [event, loadLeaderboard]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const n = await offlineStorage.getPendingSyncCount();
        if (!cancelled) setPendingSync(n);
      } catch {
        if (!cancelled) setPendingSync(0);
      }
    };
    void tick();
    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push(ROUTES.EVENTS_DETAIL(eventId));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [eventId, router]);

  useEffect(() => {
    if (event && event.status === 'ONGOING' && !loading && !tvMode) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [event, loading, tvMode]);

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

      setSequentialNumber('');
      void loadLeaderboard();
      setTimeout(() => {
        setRecording(false);
        inputRef.current?.focus();
      }, 500);
    } catch (err: unknown) {
      setRecording(false);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to record finish time.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  };

  const pageBg = tvMode ? '#000000' : theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5';
  const mainText = tvMode ? '#e8ffe8' : theme.palette.mode === 'dark' ? '#ffffff' : '#000000';

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
          backgroundColor: pageBg,
          gap: 2,
          px: 3,
        }}
      >
        <Skeleton variant="rounded" width="min(90vw, 480px)" height={48} />
        <Skeleton variant="rounded" width="min(70vw, 320px)" height={120} />
        <Skeleton variant="rounded" width="min(90vw, 400px)" height={56} />
        <Typography variant="h6" sx={{ mt: 1, color: 'text.secondary' }}>
          Loading event…
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
          backgroundColor: pageBg,
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
          backgroundColor: pageBg,
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
          backgroundColor: pageBg,
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
        backgroundColor: pageBg,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: isMobile ? 8 : 16, left: isMobile ? 8 : 16, zIndex: 1000 }}>
        <Tooltip title="WebSocket">
          <Chip
            size="small"
            label={wsConnected ? 'Live' : 'Offline'}
            color={wsConnected ? 'success' : 'default'}
            variant={wsConnected ? 'filled' : 'outlined'}
            sx={tvMode ? { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' } : undefined}
          />
        </Tooltip>
        {pendingSync > 0 && (
          <Chip
            size="small"
            label={`Queued ${pendingSync}`}
            color="warning"
            variant="outlined"
            sx={tvMode ? { color: '#ffecb3', borderColor: '#ffecb3' } : undefined}
          />
        )}
      </Stack>

      {!tvMode && (
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
      )}

      <Slide direction="down" in={!!finisherBanner} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'absolute',
            top: tvMode ? 56 : 72,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            maxWidth: 'min(96vw, 720px)',
            px: 3,
            py: 2,
            borderRadius: 2,
            bgcolor: tvMode ? 'rgba(57,255,20,0.12)' : 'rgba(25, 118, 210, 0.12)',
            border: tvMode ? '1px solid rgba(57,255,20,0.5)' : '1px solid rgba(25, 118, 210, 0.35)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {finisherBanner && (
            <>
              <Typography variant="overline" sx={{ color: tvMode ? '#b8ffb8' : 'primary.main', letterSpacing: 2 }}>
                New finisher
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: tvMode ? '#fff' : 'text.primary' }}>
                {finisherBanner.name}
              </Typography>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', color: tvMode ? '#39ff14' : 'success.main' }}>
                {finisherBanner.durationLabel}
              </Typography>
            </>
          )}
        </Box>
      </Slide>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isMobile ? 2 : 4,
          position: 'relative',
          overflow: 'hidden',
          flex: tvMode ? '1 1 100%' : '0 0 70%',
          minWidth: 0,
          maxWidth: tvMode ? '100%' : '70%',
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontWeight: 800,
            fontSize: isMobile ? 'clamp(1.5rem, 6vw, 2.5rem)' : 'clamp(2rem, 4vw, 4rem)',
            color: mainText,
            mb: isMobile ? 2 : 4,
            textAlign: 'center',
            maxWidth: '90%',
            textShadow: tvMode ? '0 0 20px rgba(57,255,20,0.25)' : undefined,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {event.name}
        </Typography>

        {(event.location || event.description) && !tvMode && (
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
                  fontSize: isMobile ? 'clamp(0.875rem, 3vw, 1.125rem)' : 'clamp(1.125rem, 2vw, 1.75rem)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
                  mb: event.location ? 2 : 0,
                  fontWeight: 400,
                  lineHeight: 1.5,
                }}
              >
                {event.description}
              </Typography>
            )}
            {event.location && (
              <Typography
                sx={{
                  fontSize: isMobile ? 'clamp(0.875rem, 3vw, 1.125rem)' : 'clamp(1.125rem, 2vw, 1.75rem)',
                  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                  fontWeight: 600,
                }}
              >
                {event.location}
              </Typography>
            )}
          </Box>
        )}

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
            minHeight: 0,
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
            <FullScreenTimer startDate={event.startDate} variant={tvMode ? 'tv' : 'default'} />
          </Box>
        </Box>

        <Typography
          sx={{
            fontSize: isMobile ? 'clamp(0.75rem, 2.5vw, 1rem)' : 'clamp(1rem, 1.5vw, 1.5rem)',
            color: tvMode ? 'rgba(230,255,230,0.75)' : theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            mt: isMobile ? 2 : 4,
            mb: isMobile ? 2 : 3,
            fontWeight: 500,
          }}
        >
          {format(currentTime, 'PPpp')}
        </Typography>

        {!tvMode && (
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !recording) {
                  void handleSequentialNumberSubmit(sequentialNumber);
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
        )}

        {error && !tvMode && (
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

      {!isMobile && !tvMode && (
        <Box
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
            borderLeft: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            overflow: 'hidden',
            flex: '0 0 30%',
            minWidth: 0,
            maxWidth: '30%',
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
              <Box display="flex" flexDirection="column" gap={1} flex={1}>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} variant="rounded" height={100} />
                ))}
              </Box>
            ) : leaderboard ? (
              <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
                {(() => {
                  const finishedEntries = leaderboard.finished.filter(
                    (entry: LeaderboardEntry) => entry.endDate !== null && entry.duration !== null,
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
                      {finishedEntries.map((entry: LeaderboardEntry, index: number) => (
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
                              boxShadow:
                                theme.palette.mode === 'dark'
                                  ? '0 2px 8px rgba(255, 255, 255, 0.1)'
                                  : '0 2px 8px rgba(25, 118, 210, 0.2)',
                            },
                          }}
                        >
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
                  Loading competitors…
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
