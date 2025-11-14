'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  Container,
  CircularProgress,
} from '@mui/material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  eventService,
  UpdateEventRequest,
  Event,
} from '@/lib/api/services/event.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
  }>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
  });
  const [timezone, setTimezone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return 'UTC';
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const timezoneValue = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventData = await eventService.getById(eventId, timezoneValue);
      setEvent(eventData);
      setTimezone(eventData.timezone || timezoneValue);

      // Convert dates to local datetime-local format
      const formatDateTimeLocal = (dateString: string, localDateString?: string): string => {
        const date = localDateString ? new Date(localDateString) : new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        name: eventData.name,
        description: eventData.description || '',
        startDate: formatDateTimeLocal(eventData.startDate, eventData.startDateLocal),
        endDate: formatDateTimeLocal(eventData.endDate, eventData.endDateLocal),
        location: eventData.location || '',
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: 'name' | 'description' | 'startDate' | 'endDate' | 'location'
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError('');
  };

  const handleTimezoneChange = (e: any) => {
    setTimezone(e.target.value);
  };

  const convertLocalToUTC = (localDateTime: string): string => {
    if (!localDateTime) return '';
    const localDate = new Date(localDateTime);
    return localDate.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    const startDateUTC = convertLocalToUTC(formData.startDate);
    const endDateUTC = convertLocalToUTC(formData.endDate);

    if (new Date(startDateUTC) >= new Date(endDateUTC)) {
      setError('Start date must be before end date');
      return;
    }

    setSaving(true);

    try {
      await eventService.update(
        eventId,
        {
          ...formData,
          startDate: startDateUTC,
          endDate: endDateUTC,
        },
        timezone,
      );
      showToast('Event updated successfully!', 'success');
      router.push(ROUTES.EVENTS);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update event. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
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

  // Prevent editing ONGOING or COMPLETED events
  if (event.status === 'ONGOING' || event.status === 'COMPLETED') {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Alert severity="warning" sx={{ mb: 2 }}>
              Cannot edit event with status: {event.status}. Only DRAFT and PUBLISHED events can be
              edited.
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
          <Box sx={{ py: 4 }}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                mb: 4,
                fontSize: isMobile ? '1.75rem' : '2rem',
              }}
            >
              Edit Event
            </Typography>

            <Card
              sx={{
                borderRadius: 3,
                boxShadow:
                  theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                    : '0 8px 32px rgba(25, 118, 210, 0.2)',
              }}
            >
              <CardContent sx={{ p: isMobile ? 3 : 4 }}>
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    required
                    margin="normal"
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={handleChange('description')}
                    margin="normal"
                    multiline
                    rows={4}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Start Date & Time (Local)"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={handleChange('startDate')}
                    required
                    margin="normal"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="End Date & Time (Local)"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={handleChange('endDate')}
                    required
                    margin="normal"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Location"
                    value={formData.location}
                    onChange={handleChange('location')}
                    margin="normal"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={timezone}
                      onChange={handleTimezoneChange}
                      label="Timezone"
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      <MenuItem value="America/New_York">America/New_York (EST/EDT)</MenuItem>
                      <MenuItem value="America/Chicago">America/Chicago (CST/CDT)</MenuItem>
                      <MenuItem value="America/Denver">America/Denver (MST/MDT)</MenuItem>
                      <MenuItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT/BST)</MenuItem>
                      <MenuItem value="Europe/Paris">Europe/Paris (CET/CEST)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Asia/Tokyo (JST)</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push(ROUTES.EVENTS_DETAIL(eventId))}
                      disabled={saving}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={saving}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        background:
                          theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                            : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        '&:hover': {
                          background:
                            theme.palette.mode === 'dark'
                              ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                              : 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                        },
                      }}
                    >
                      {saving ? 'Updating...' : 'Update Event'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

