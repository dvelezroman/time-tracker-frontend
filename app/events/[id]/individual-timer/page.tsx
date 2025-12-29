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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event } from '@/lib/api/services/event.service';
import {
  timeEntryService,
  LeaderboardResponse,
  LeaderboardEntry,
  RecordFinishResponse,
} from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

export default function IndividualTimerPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [competitorNumber, setCompetitorNumber] = useState('');
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'start' | 'finish';
    competitor: string;
    time: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadEvent = useCallback(async () => {
    try {
      setError(null);
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
  }, [eventId]);

  const loadLeaderboard = useCallback(async () => {
    if (!eventId) return;

    try {
      setLoadingLeaderboard(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const leaderboardData = await timeEntryService.getLeaderboard(eventId, timezone);
      // Only show finished competitors
      if (leaderboardData) {
        setLeaderboard({
          ...leaderboardData,
          finished: leaderboardData.finished || [],
        });
      }
    } catch (err: any) {
      // Silently fail for leaderboard - don't break the timer
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isNaN(eventId)) {
      router.push(ROUTES.EVENTS);
      return;
    }

    loadEvent();

    // Auto-refresh leaderboard every 3 seconds
    const leaderboardInterval = setInterval(loadLeaderboard, 3000);

    return () => {
      clearInterval(leaderboardInterval);
    };
  }, [eventId, loadEvent, loadLeaderboard, router]);

  // Auto-focus input on mount
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading]);

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

  const handleStartTimer = async () => {
    if (starting || finishing) return;

    const trimmedNumber = competitorNumber.trim();
    if (!trimmedNumber) {
      showToast('Please enter a competitor number', 'error');
      return;
    }

    const seqNumber = parseInt(trimmedNumber, 10);
    if (isNaN(seqNumber) || seqNumber <= 0) {
      showToast('Please enter a valid competitor number', 'error');
      return;
    }

    try {
      setStarting(true);
      setError(null);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await timeEntryService.recordStartBySequentialNumber(eventId, seqNumber, timezone);

      const startTime = result.startDateLocal
        ? format(new Date(result.startDateLocal), 'HH:mm:ss')
        : format(new Date(result.startDate), 'HH:mm:ss');

      setLastAction({
        type: 'start',
        competitor: `${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})`,
        time: startTime,
      });

      showToast(
        `Start time recorded for ${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})!`,
        'success',
      );

      // Clear input and refocus
      setCompetitorNumber('');
      setTimeout(() => {
        setStarting(false);
        inputRef.current?.focus();
      }, 500);
    } catch (err: any) {
      setStarting(false);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to record start time.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  };

  const handleFinishTimer = async () => {
    if (starting || finishing) return;

    const trimmedNumber = competitorNumber.trim();
    if (!trimmedNumber) {
      showToast('Please enter a competitor number', 'error');
      return;
    }

    const seqNumber = parseInt(trimmedNumber, 10);
    if (isNaN(seqNumber) || seqNumber <= 0) {
      showToast('Please enter a valid competitor number', 'error');
      return;
    }

    try {
      setFinishing(true);
      setError(null);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await timeEntryService.recordFinishBySequentialNumber(eventId, seqNumber, timezone);

      const finishTime = result.endDateLocal
        ? format(new Date(result.endDateLocal), 'HH:mm:ss')
        : format(new Date(result.endDate!), 'HH:mm:ss');

      const duration = result.duration ? formatDuration(result.duration) : '-';

      setLastAction({
        type: 'finish',
        competitor: `${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})`,
        time: finishTime,
      });

      showToast(
        `Finish time recorded for ${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})! Duration: ${duration}`,
        'success',
      );

      // Clear input, refresh leaderboard, and refocus
      setCompetitorNumber('');
      loadLeaderboard();
      setTimeout(() => {
        setFinishing(false);
        inputRef.current?.focus();
      }, 500);
    } catch (err: any) {
      setFinishing(false);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to record finish time.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Default to finish if both buttons are available
      // User can click start button explicitly
      e.preventDefault();
    }
  };

  if (loading) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <Box 
          sx={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
        </Box>
      </ProtectedRoute>
    );
  }

  if (error && !event) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <Box 
          sx={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Alert severity="error">{error}</Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <Box 
          sx={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Alert severity="info">Event not found</Alert>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <Box
          sx={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
          }}
        >
          {/* Left Side - Leaderboard (30-40% width) */}
          <Box
            sx={{
              width: isMobile ? '100%' : '35%',
              height: isMobile ? '40%' : '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRight: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
              borderBottom: isMobile ? `1px solid ${theme.palette.divider}` : 'none',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Leaderboard
              </Typography>
              {loadingLeaderboard && <CircularProgress size={20} />}
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {leaderboard && leaderboard.finished && leaderboard.finished.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Pos</strong></TableCell>
                        <TableCell><strong>#</strong></TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Time</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaderboard.finished.map((entry: LeaderboardEntry, index: number) => (
                        <TableRow key={entry.timeEntryId || index} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {entry.categoryRank || entry.rank || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {entry.sequentialNumber || entry.competitor.id}
                          </TableCell>
                          <TableCell>
                            {entry.competitor.firstName} {entry.competitor.lastName}
                          </TableCell>
                          <TableCell>
                            {entry.category ? (
                              <Chip label={entry.category.name} size="small" color="primary" variant="outlined" />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDuration(entry.duration)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No finished competitors yet
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right Side - Timer Input Area (60-70% width) */}
          <Box
            sx={{
              width: isMobile ? '100%' : '65%',
              height: isMobile ? '60%' : '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(ROUTES.EVENTS_DETAIL(eventId))}
                sx={{ mb: 2 }}
              >
                Back to Event
              </Button>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {event.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Individual Timer Tracking
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, maxWidth: 500, width: '100%' }}>
                {error}
              </Alert>
            )}

            {lastAction && (
              <Alert
                severity="success"
                sx={{ mb: 3, maxWidth: 500, width: '100%' }}
                onClose={() => setLastAction(null)}
              >
                <Typography variant="body2">
                  <strong>{lastAction.type === 'start' ? 'Started' : 'Finished'}:</strong>{' '}
                  {lastAction.competitor} at {lastAction.time}
                </Typography>
              </Alert>
            )}

            <Box sx={{ maxWidth: 500, width: '100%', mb: 4 }}>
              <TextField
                inputRef={inputRef}
                fullWidth
                label="Sequential Number (#)"
                placeholder="Enter the # from competitor list"
                type="number"
                value={competitorNumber}
                onChange={(e) => setCompetitorNumber(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={starting || finishing}
                variant="outlined"
                helperText="Use the sequential number (#) shown in the competitors list"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.5rem',
                    '& input': {
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, maxWidth: 500, width: '100%' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={starting ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
                onClick={handleStartTimer}
                disabled={starting || finishing || !competitorNumber.trim()}
                fullWidth
                sx={{ py: 2, fontSize: '1.1rem' }}
              >
                {starting ? 'Starting...' : 'Start Timer'}
              </Button>
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={finishing ? <CircularProgress size={20} color="inherit" /> : <StopIcon />}
                onClick={handleFinishTimer}
                disabled={starting || finishing || !competitorNumber.trim()}
                fullWidth
                sx={{ py: 2, fontSize: '1.1rem' }}
              >
                {finishing ? 'Finishing...' : 'Finish Timer'}
              </Button>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 500 }}>
              <Typography variant="body2" color="text.secondary">
                Enter the <strong>sequential number (#)</strong> from the competitors list and click Start Timer to begin timing, then click Finish Timer when they complete.
              </Typography>
            </Box>
          </Box>
        </Box>
    </ProtectedRoute>
  );
}

