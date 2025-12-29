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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event } from '@/lib/api/services/event.service';
import {
  timeEntryService,
  LeaderboardResponse,
  LeaderboardEntry,
} from '@/lib/api/services/time-entry.service';
import { categoryService, Category } from '@/lib/api/services/category.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';
import { parseHHMMSSToMilliseconds } from '@/lib/utils';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'rank' | 'category' | 'duration' | 'name'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [editingManualTime, setEditingManualTime] = useState<number | null>(null);
  const [manualTimeValue, setManualTimeValue] = useState<string>('');
  const [savingManualTime, setSavingManualTime] = useState<number | null>(null);

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
      const [eventData, leaderboardData, categoriesData] = await Promise.all([
        eventService.getById(eventId, timezone),
        timeEntryService.getLeaderboard(eventId, timezone),
        categoryService.getAll({ eventId, limit: 1000 }),
      ]);
      setEvent(eventData);
      setLeaderboard(leaderboardData);
      setCategories(categoriesData.data);
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

  const handleStartEditManualTime = (eventCompetitorId: number) => {
    setEditingManualTime(eventCompetitorId);
    setManualTimeValue('');
  };

  const handleCancelEditManualTime = () => {
    setEditingManualTime(null);
    setManualTimeValue('');
  };

  const handleSaveManualTime = async (eventCompetitorId: number) => {
    // Validate format - support both HH:MM:SS and HH:MM:SS.mm
    if (!/^\d{2}:\d{2}:\d{2}(\.\d{1,3})?$/.test(manualTimeValue)) {
      showToast('Invalid format. Please use HH:MM:SS or HH:MM:SS.mm format (e.g., 01:23:45 or 01:23:45.123)', 'error');
      return;
    }

    try {
      setSavingManualTime(eventCompetitorId);
      await timeEntryService.createManualTimeEntry(eventId, eventCompetitorId, manualTimeValue);
      showToast('Manual time entry added successfully', 'success');
      handleCancelEditManualTime();
      await loadData(); // Refresh leaderboard
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to add manual time entry';
      showToast(errorMessage, 'error');
    } finally {
      setSavingManualTime(null);
    }
  };

  const sortEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
    const sorted = [...entries].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'category':
          const categoryA = a.category?.name || '';
          const categoryB = b.category?.name || '';
          comparison = categoryA.localeCompare(categoryB);
          // If categories are equal, sort by rank
          if (comparison === 0) {
            comparison = (a.rank || 0) - (b.rank || 0);
          }
          break;
        case 'duration':
          const durationA = a.duration || 0;
          const durationB = b.duration || 0;
          comparison = durationA - durationB;
          // If durations are equal, sort by rank
          if (comparison === 0) {
            comparison = (a.rank || 0) - (b.rank || 0);
          }
          break;
        case 'name':
          const nameA = `${a.competitor.firstName} ${a.competitor.lastName}`.toLowerCase();
          const nameB = `${b.competitor.firstName} ${b.competitor.lastName}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'rank':
        default:
          comparison = (a.rank || 0) - (b.rank || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
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
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                {categories.length > 0 && (
                  <FormControl sx={{ minWidth: 200 }} size={isMobile ? 'medium' : 'small'}>
                    <InputLabel>Filter by Category</InputLabel>
                    <Select
                      value={selectedCategoryId}
                      onChange={(e) => setSelectedCategoryId(e.target.value as number | '')}
                      label="Filter by Category"
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                <FormControl sx={{ minWidth: 180 }} size={isMobile ? 'medium' : 'small'}>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'rank' | 'category' | 'duration' | 'name')}
                    label="Sort By"
                  >
                    <MenuItem value="rank">Rank</MenuItem>
                    <MenuItem value="category">Category</MenuItem>
                    <MenuItem value="duration">Duration</MenuItem>
                    <MenuItem value="name">Name</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 120 }} size={isMobile ? 'medium' : 'small'}>
                  <InputLabel>Order</InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    label="Order"
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>
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

            {(() => {
              const filteredFinished = leaderboard.finished.filter((entry) => {
                if (selectedCategoryId === '') return true;
                return entry.category?.id === selectedCategoryId;
              });
              const filteredInProgress = leaderboard.inProgress.filter((entry) => {
                if (selectedCategoryId === '') return true;
                return entry.category?.id === selectedCategoryId;
              });

              // Sort the filtered entries
              const sortedFinished = sortEntries(filteredFinished);
              const sortedInProgress = sortEntries(filteredInProgress);

              return sortedFinished.length === 0 && sortedInProgress.length === 0 ? (
                <Card>
                  <CardContent>
                    <Box textAlign="center" py={4}>
                      <Typography variant="body1" color="text.secondary">
                        {selectedCategoryId === ''
                          ? 'No competitors registered for this event yet.'
                          : 'No competitors found for the selected category.'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {sortedFinished.length > 0 && (
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Finished Competitors
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Rank</strong></TableCell>
                              <TableCell><strong>Sequential #</strong></TableCell>
                              <TableCell><strong>Competitor</strong></TableCell>
                              <TableCell><strong>Category</strong></TableCell>
                              <TableCell><strong>Start Time</strong></TableCell>
                              <TableCell><strong>Finish Time</strong></TableCell>
                              <TableCell><strong>Duration</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sortedFinished.map((entry) => (
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
                                  <Typography variant="body2" fontWeight="bold" color="primary">
                                    {entry.sequentialNumber || '-'}
                                  </Typography>
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
                                  <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '1rem' }}>
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

                  {sortedInProgress.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        {event.status === 'COMPLETED' ? 'Not Finished / Absent' : 'In Progress'}
                      </Typography>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Competitor</TableCell>
                              <TableCell>Category</TableCell>
                              <TableCell>Start Time</TableCell>
                              <TableCell>Status</TableCell>
                              {event.status === 'COMPLETED' && (
                                <TableCell align="right">Actions</TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sortedInProgress.map((entry) => {
                              const getStatusChip = () => {
                                if (entry.status === 'ABSENT') {
                                  return <Chip label="Absent" color="error" size="small" />;
                                } else if (entry.status === 'NOT_FINISHED') {
                                  return <Chip label="Not Finished" color="warning" size="small" />;
                                } else {
                                  return <Chip label="In Progress" color="warning" size="small" />;
                                }
                              };

                              return (
                                <TableRow key={entry.timeEntryId || entry.competitor.id} hover>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium" color="text.secondary">
                                      {entry.sequentialNumber || '-'}
                                    </Typography>
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
                                      {entry.startDate ? formatTime(entry.startDate, entry.startDateLocal) : '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {getStatusChip()}
                                  </TableCell>
                                  {event.status === 'COMPLETED' && (
                                    <TableCell align="right">
                                      {editingManualTime === entry.eventCompetitorId ? (
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <TextField
                                            type="text"
                                            value={manualTimeValue}
                                            onChange={(e) => setManualTimeValue(e.target.value)}
                                            placeholder="HH:MM:SS.mm"
                                            size="small"
                                            inputProps={{
                                              pattern: '^\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,3})?$',
                                              style: { textAlign: 'center', width: '120px' },
                                            }}
                                            sx={{ width: '140px' }}
                                            helperText="Format: HH:MM:SS or HH:MM:SS.mm"
                                            disabled={savingManualTime === entry.eventCompetitorId}
                                            onKeyPress={(e) => {
                                              if (e.key === 'Enter') {
                                                handleSaveManualTime(entry.eventCompetitorId!);
                                              } else if (e.key === 'Escape') {
                                                handleCancelEditManualTime();
                                              }
                                            }}
                                            autoFocus
                                          />
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleSaveManualTime(entry.eventCompetitorId!)}
                                            disabled={savingManualTime === entry.eventCompetitorId}
                                          >
                                            {savingManualTime === entry.eventCompetitorId ? (
                                              <CircularProgress size={16} />
                                            ) : (
                                              <CheckIcon fontSize="small" />
                                            )}
                                          </IconButton>
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={handleCancelEditManualTime}
                                            disabled={savingManualTime === entry.eventCompetitorId}
                                          >
                                            <CloseIcon fontSize="small" />
                                          </IconButton>
                                        </Box>
                                      ) : (
                                        entry.eventCompetitorId &&
                                        entry.duration === null && (
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleStartEditManualTime(entry.eventCompetitorId!)}
                                            title="Add manual time entry"
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                        )
                                      )}
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                  )}
                </>
              );
            })()}
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}



