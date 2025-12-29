'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Container,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { eventService } from '@/lib/api/services/event.service';
import { timeEntryService } from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

interface PublicEvent {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  startDateLocal?: string;
  endDateLocal?: string | null;
  timezone?: string;
}

interface TimeEntryResult {
  competitor: { firstName: string; lastName: string };
  category: { id: number; name: string } | null;
  sequentialNumber: number | null;
  status: 'FINISHED' | 'IN_PROGRESS' | 'NOT_STARTED';
  rank: number | null;
  startDate: string | null;
  startDateLocal?: string;
  endDate: string | null;
  endDateLocal?: string;
  duration: number | null;
  timezone?: string;
}

export default function LookupPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [sequentialNumber, setSequentialNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TimeEntryResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventsData = await eventService.getPublicEvents(timezone);
      setEvents(eventsData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load events. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !sequentialNumber.trim()) {
      showToast('Please select an event and enter your sequential number', 'error');
      return;
    }

    const seqNum = parseInt(sequentialNumber.trim(), 10);
    if (isNaN(seqNum) || seqNum < 1) {
      showToast('Please enter a valid sequential number', 'error');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timeEntryData = await timeEntryService.getPublicTimeEntry(
        selectedEventId as number,
        seqNum,
        timezone,
      );
      setResult(timeEntryData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to lookup time entry. Please try again.';
      setError(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString: string | null, localDateString?: string): string => {
    if (!dateString) return '-';
    if (localDateString) {
      return format(new Date(localDateString), 'PPp');
    }
    return format(new Date(dateString), 'PPp');
  };

  const getStatusChip = () => {
    if (!result) return null;
    if (result.status === 'FINISHED') {
      return <Chip label="Finished" color="success" size="small" />;
    } else if (result.status === 'IN_PROGRESS') {
      return <Chip label="In Progress" color="warning" size="small" />;
    } else {
      return <Chip label="Not Started" color="default" size="small" />;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(ROUTES.HOME)}
          sx={{ mb: 2 }}
        >
          Back to Home
        </Button>
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
          }}
        >
          Check Your Time
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your sequential number and select an event to view your finish time and results.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <FormControl fullWidth required>
                <InputLabel>Select Event</InputLabel>
                <Select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value as number | '')}
                  label="Select Event"
                  disabled={loadingEvents || loading}
                >
                  {loadingEvents ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Loading events...
                    </MenuItem>
                  ) : events.length === 0 ? (
                    <MenuItem disabled>No events available</MenuItem>
                  ) : (
                    events.map((event) => (
                      <MenuItem key={event.id} value={event.id}>
                        {event.name} ({event.status})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <TextField
                label="Sequential Number"
                type="number"
                value={sequentialNumber}
                onChange={(e) => setSequentialNumber(e.target.value)}
                required
                fullWidth
                disabled={loading}
                inputProps={{ min: 1 }}
                helperText="Enter the sequential number assigned to you for this event"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                disabled={loading || loadingEvents || !selectedEventId || !sequentialNumber.trim()}
                fullWidth
              >
                {loading ? 'Looking up...' : 'Lookup Time'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {result && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Your Results
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Competitor
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {result.competitor.firstName} {result.competitor.lastName}
                </Typography>
              </Box>

              {result.sequentialNumber && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Sequential Number
                  </Typography>
                  <Typography variant="body1">#{result.sequentialNumber}</Typography>
                </Box>
              )}

              {result.category && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Category
                  </Typography>
                  <Typography variant="body1">{result.category.name}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                {getStatusChip()}
              </Box>

              {result.status === 'FINISHED' && result.rank && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Overall Rank
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    #{result.rank}
                  </Typography>
                </Box>
              )}

              <Divider />

              {result.startDate && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Start Time
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(result.startDate, result.startDateLocal)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(result.startDate, result.startDateLocal)}
                  </Typography>
                </Box>
              )}

              {result.endDate && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Finish Time
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatTime(result.endDate, result.endDateLocal)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(result.endDate, result.endDateLocal)}
                  </Typography>
                </Box>
              )}

              {result.duration !== null && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatDuration(result.duration)}
                  </Typography>
                </Box>
              )}

              {result.status === 'NOT_STARTED' && (
                <Alert severity="info">
                  You have not started this event yet. Please check with event organizers.
                </Alert>
              )}

              {result.status === 'IN_PROGRESS' && (
                <Alert severity="warning">
                  Your time is still being recorded. Please check back later for your final results.
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

