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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event } from '@/lib/api/services/event.service';
import {
  timeEntryService,
  LeaderboardResponse,
  LeaderboardEntry,
} from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

export default function LeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  useEffect(() => {
    if (!autoRefresh || !eventId) return;

    const interval = setInterval(() => {
      loadLeaderboard();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [eventData, leaderboardData] = await Promise.all([
        eventService.getById(eventId, timezone),
        timeEntryService.getLeaderboard(eventId, timezone),
      ]);
      setEvent(eventData);
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load data. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const leaderboardData = await timeEntryService.getLeaderboard(eventId, timezone);
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      // Silently fail for auto-refresh
      console.error('Failed to refresh leaderboard:', err);
    }
  };

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

  if (loading) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="xl">
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
          <Container maxWidth="xl">
            <Alert severity="error">{error}</Alert>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!event || !leaderboard) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="xl">
            <Alert severity="info">Event or leaderboard not found</Alert>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
      <MainLayout>
        <Container maxWidth="xl">
          <Box sx={{ py: 4 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Typography
                  variant={isMobile ? 'h5' : 'h4'}
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                  }}
                >
                  Leaderboard - {event.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {leaderboard.finishedCount} of {leaderboard.total} competitors finished
                </Typography>
              </Box>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant={autoRefresh ? 'contained' : 'outlined'}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  size={isMobile ? 'medium' : 'large'}
                >
                  {autoRefresh ? 'Auto-Refresh: ON' : 'Auto-Refresh: OFF'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={loadLeaderboard}
                  size={isMobile ? 'medium' : 'large'}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(ROUTES.EVENTS_DETAIL(eventId))}
                  size={isMobile ? 'medium' : 'large'}
                >
                  Back to Event
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {leaderboard.finished.length === 0 && leaderboard.inProgress.length === 0 ? (
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No competitors registered for this event yet.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <>
                {leaderboard.finished.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Finished Competitors
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Rank</TableCell>
                              <TableCell>Competitor</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>Start Time</TableCell>
                              <TableCell>Finish Time</TableCell>
                              <TableCell>Duration</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {leaderboard.finished.map((entry) => (
                              <TableRow key={entry.timeEntryId} hover>
                                <TableCell>
                                  <Chip
                                    label={`#${entry.rank}`}
                                    color="success"
                                    size="small"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {entry.competitor.firstName} {entry.competitor.lastName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {entry.category?.name || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatTime(entry.startDate, entry.startDateLocal)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {formatTime(entry.endDate, entry.endDateLocal)}
                                  </Typography>
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
                    </CardContent>
                  </Card>
                )}

                {leaderboard.inProgress.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        In Progress
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Competitor</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>Start Time</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {leaderboard.inProgress.map((entry) => (
                              <TableRow key={entry.timeEntryId || entry.competitor.id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {entry.competitor.firstName} {entry.competitor.lastName}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {entry.category?.name || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatTime(entry.startDate, entry.startDateLocal)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label="In Progress" color="warning" size="small" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}



