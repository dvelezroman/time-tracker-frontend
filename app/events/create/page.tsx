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
  Select,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, CreateEventRequest } from '@/lib/api/services/event.service';
import { categoryService, CreateCategoryRequest, Category } from '@/lib/api/services/category.service';
import { userService, UserWithDates } from '@/lib/api/services/user.service';
import apiClient from '@/lib/api/client';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { getTimezoneOptions } from '@/lib/utils/timezones';
import { useAuthStore } from '@/store/useAuthStore';

export default function CreateEventPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = useState<CreateEventRequest>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
  });
  const [timezone, setTimezone] = useState<string>('UTC');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', description: '' });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [operators, setOperators] = useState<UserWithDates[]>([]);
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    // Set timezone on client side only to avoid hydration mismatch
    if (typeof window !== 'undefined') {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadOperators();
    }
  }, [isAdmin]);

  const loadOperators = async () => {
    try {
      // Fetch all users with a high limit to get all operators
      const response = await apiClient.get<{ data: UserWithDates[]; total: number }>('/users', {
        params: { limit: 1000, role: 'OPERATOR', status: 'ACTIVE' },
      });
      const allUsers = response.data.data || [];
      const operatorUsers = allUsers.filter((u) => u.role === 'OPERATOR' && u.status === 'ACTIVE');
      setOperators(operatorUsers);
      console.log('Loaded operators:', operatorUsers);
    } catch (err) {
      console.error('Failed to load operators:', err);
      showToast('Failed to load operators. Please try again.', 'error');
    }
  };

  const handleChange = (field: keyof CreateEventRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError('');
  };

  const handleTimezoneChange = (e: any) => {
    setTimezone(e.target.value);
  };

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const convertLocalToUTC = (localDateTime: string, selectedTimezone: string): string => {
    if (!localDateTime) return '';
    
    try {
      // Parse the datetime-local string (format: "YYYY-MM-DDTHH:mm")
      const [datePart, timePart] = localDateTime.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      
      // Create a date string in ISO format that we'll interpret in the selected timezone
      // We'll use a trick: create a date in UTC, then adjust based on timezone offset
      
      // Create a temporary date to get the timezone offset
      const tempDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      
      // Format this date in the selected timezone to see what the offset is
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: selectedTimezone,
        timeZoneName: 'longOffset',
      });
      
      // Get what this UTC time would be in the target timezone
      const tzString = formatter.format(tempDate);
      
      // Now we need to work backwards: if the user entered 10:00 in timezone X,
      // we need to find what UTC time that corresponds to
      // We'll use a binary search approach or calculate the offset
      
      // Simpler approach: create a date assuming the input is in UTC,
      // then calculate what the offset should be to make it match
      const testDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
      
      // Get the offset of the selected timezone at this UTC time
      const offsetFormatter = new Intl.DateTimeFormat('en', {
        timeZone: selectedTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      const utcFormatter = new Intl.DateTimeFormat('en', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      // Format the test date in both UTC and target timezone
      const utcParts = utcFormatter.formatToParts(testDate);
      const tzParts = offsetFormatter.formatToParts(testDate);
      
      const utcHour = parseInt(utcParts.find(p => p.type === 'hour')?.value || '0');
      const utcMin = parseInt(utcParts.find(p => p.type === 'minute')?.value || '0');
      const tzHour = parseInt(tzParts.find(p => p.type === 'hour')?.value || '0');
      const tzMin = parseInt(tzParts.find(p => p.type === 'minute')?.value || '0');
      
      // Calculate offset in minutes
      const utcMinutes = utcHour * 60 + utcMin;
      const tzMinutes = tzHour * 60 + tzMin;
      let offsetMinutes = tzMinutes - utcMinutes;
      
      // Handle day boundary
      if (Math.abs(offsetMinutes) > 720) {
        if (offsetMinutes > 0) offsetMinutes -= 1440;
        else offsetMinutes += 1440;
      }
      
      // Now adjust the test date by the negative of this offset
      // If the user entered 10:00 in timezone with +5 offset, that's 05:00 UTC
      const adjustedDate = new Date(testDate.getTime() - offsetMinutes * 60000);
      
      return adjustedDate.toISOString();
    } catch (error) {
      // Fallback: interpret in browser's local timezone (not ideal)
      console.warn('Failed to convert with timezone, using browser local timezone:', error);
      return new Date(localDateTime).toISOString();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    const startDateUTC = convertLocalToUTC(formData.startDate, timezone);
    const endDateUTC = convertLocalToUTC(formData.endDate, timezone);

    if (new Date(startDateUTC) >= new Date(endDateUTC)) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);

    try {
      const createdEvent = await eventService.create(
        {
          ...formData,
          startDate: startDateUTC,
          endDate: endDateUTC,
          assignedTo: assignedTo,
        },
        timezone
      );
      setCreatedEventId(createdEvent.id);
      showToast('Event created successfully! You can now add categories.', 'success');
      // Load categories for this event
      loadCategories(createdEvent.id);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to create event. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async (eventId: number) => {
    try {
      const response = await categoryService.getAll({ eventId, limit: 1000 });
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({ name: category.name, description: category.description || '' });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', description: '' });
    }
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setEditingCategory(null);
    setCategoryFormData({ name: '', description: '' });
  };

  const handleCategorySubmit = async () => {
    if (!createdEventId || !categoryFormData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setCategoryLoading(true);
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, {
          name: categoryFormData.name,
          description: categoryFormData.description || undefined,
        });
        showToast('Category updated successfully!', 'success');
      } else {
        const createData: CreateCategoryRequest = {
          eventId: createdEventId,
          name: categoryFormData.name,
          description: categoryFormData.description || undefined,
        };
        await categoryService.create(createData);
        showToast('Category created successfully!', 'success');
      }
      handleCloseCategoryDialog();
      if (createdEventId) {
        loadCategories(createdEventId);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to save category. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoryService.delete(categoryId);
      showToast('Category deleted successfully!', 'success');
      if (createdEventId) {
        loadCategories(createdEventId);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete category. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  const handleFinish = () => {
    router.push(ROUTES.EVENTS);
  };

  return (
    <ProtectedRoute roles={['ADMIN']}>
      <MainLayout>
        <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                mb: 4,
                fontSize: isMobile ? '1.75rem' : '2rem',
              }}
            >
              Create New Event
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

                  {isAdmin && (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Assign to Operator</InputLabel>
                      <Select
                        value={assignedTo || ''}
                        onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : undefined)}
                        label="Assign to Operator"
                        sx={{
                          borderRadius: 2,
                        }}
                      >
                        <MenuItem value="">
                          <em>None (Unassigned)</em>
                        </MenuItem>
                        {operators.map((operator) => (
                          <MenuItem key={operator.id} value={operator.id}>
                            {operator.email}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Timezone</InputLabel>
                    <Select
                      value={timezone}
                      onChange={handleTimezoneChange}
                      label="Timezone"
                      sx={{
                        borderRadius: 2,
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 400,
                          },
                        },
                      }}
                    >
                      {getTimezoneOptions().map((tz) => (
                        <MenuItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {!createdEventId && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        onClick={() => router.back()}
                        disabled={loading}
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
                        disabled={loading}
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
                        {loading ? 'Creating...' : 'Create Event'}
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {createdEventId && (
              <>
                <Divider sx={{ my: 4 }} />
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
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                      flexWrap="wrap"
                      gap={2}
                    >
                      <Typography
                        variant="h5"
                        component="h2"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                        }}
                      >
                        Event Categories
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenCategoryDialog()}
                        size={isMobile ? 'medium' : 'large'}
                      >
                        Add Category
                      </Button>
                    </Box>

                    {categories.length === 0 ? (
                      <Box textAlign="center" py={4}>
                        <Typography variant="body1" color="text.secondary">
                          No categories yet. Add categories to organize competitors in this event.
                        </Typography>
                      </Box>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell align="right">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {categories.map((category) => (
                              <TableRow key={category.id} hover>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="medium">
                                    {category.name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary">
                                    {category.description || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenCategoryDialog(category)}
                                    color="primary"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteCategory(category.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleFinish}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Finish
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </>
            )}
          </Box>
        </Container>

        <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
          <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Category Name"
              value={categoryFormData.name}
              onChange={(e) =>
                setCategoryFormData({ ...categoryFormData, name: e.target.value })
              }
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
              value={categoryFormData.description}
              onChange={(e) =>
                setCategoryFormData({ ...categoryFormData, description: e.target.value })
              }
              margin="normal"
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCategoryDialog} disabled={categoryLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleCategorySubmit}
              variant="contained"
              disabled={categoryLoading || !categoryFormData.name.trim()}
            >
              {categoryLoading ? <CircularProgress size={24} /> : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  );
}

