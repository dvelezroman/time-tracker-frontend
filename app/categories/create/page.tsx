'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  Container,
  CircularProgress,
} from '@mui/material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  categoryService,
  CreateCategoryRequest,
} from '@/lib/api/services/category.service';
import { eventService, Event } from '@/lib/api/services/event.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';

export default function CreateCategoryPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    eventId: 0,
    name: '',
    description: '',
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await eventService.getAll({ limit: 1000 });
      setEvents(response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load events. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleChange = (field: keyof CreateCategoryRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError('');
  };

  const handleEventChange = (e: any) => {
    setFormData({ ...formData, eventId: Number(e.target.value) });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.eventId) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await categoryService.create({
        eventId: formData.eventId,
        name: formData.name,
        description: formData.description || undefined,
      });
      showToast('Category created successfully!', 'success');
      router.push(ROUTES.CATEGORIES);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to create category. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
              Create Category
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <FormControl fullWidth sx={{ mb: 3 }} required>
                    <InputLabel>Event</InputLabel>
                    <Select
                      value={formData.eventId || ''}
                      onChange={handleEventChange}
                      label="Event"
                      disabled={loadingEvents}
                    >
                      {events.map((event) => (
                        <MenuItem key={event.id} value={event.id}>
                          {event.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Category Name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    required
                    sx={{ mb: 3 }}
                    error={!!error && !formData.name}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={handleChange('description')}
                    multiline
                    rows={4}
                    sx={{ mb: 3 }}
                  />

                  <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
                    <Button
                      variant="outlined"
                      onClick={() => router.push(ROUTES.CATEGORIES)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                      {loading ? <CircularProgress size={24} /> : 'Create Category'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

