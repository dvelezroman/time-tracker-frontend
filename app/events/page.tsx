'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  Container,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  eventService,
  Event,
  EventStatus,
  FilterEventParams,
} from '@/lib/api/services/event.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/useAuthStore';

export default function EventsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuthStore();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | ''>('');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');

  const timezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  useEffect(() => {
    loadEvents();
  }, [page, limit, search, statusFilter, startDateFrom, startDateTo]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const params: FilterEventParams = {
        page: page + 1,
        limit,
        timezone,
      };

      if (search) {
        params.name = search;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (startDateFrom) {
        params.startDateFrom = new Date(startDateFrom).toISOString();
      }

      if (startDateTo) {
        params.startDateTo = new Date(startDateTo).toISOString();
      }

      const response = await eventService.getAll(params);
      setEvents(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load events. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e: any) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleStartDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDateFrom(e.target.value);
    setPage(0);
  };

  const handleStartDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDateTo(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (event: Event) => {
    router.push(ROUTES.EVENTS_DETAIL(event.id));
  };

  const handleEdit = (event: Event) => {
    router.push(ROUTES.EVENTS_EDIT(event.id));
  };

  const handleStart = async (event: Event) => {
    try {
      setActionLoading(event.id);
      await eventService.start(event.id, { timezone });
      showToast('Event started successfully!', 'success');
      loadEvents();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to start event. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async (event: Event) => {
    try {
      setActionLoading(event.id);
      await eventService.stop(event.id, { timezone });
      showToast('Event stopped successfully!', 'success');
      loadEvents();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to stop event. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    try {
      setDeleting(true);
      await eventService.delete(eventToDelete.id);
      showToast('Event deleted successfully!', 'success');
      setDeleteDialogOpen(false);
      setEventToDelete(null);
      loadEvents();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete event. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push(ROUTES.EVENTS_CREATE);
  };

  const getStatusColor = (status: EventStatus): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'PUBLISHED':
        return 'primary';
      case 'ONGOING':
        return 'success';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string, localDateString?: string) => {
    if (localDateString) {
      return format(new Date(localDateString), 'PPp');
    }
    return format(new Date(dateString), 'PPp');
  };

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
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                }}
              >
                Events
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                size={isMobile ? 'medium' : 'large'}
              >
                Create Event
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent>
                <Box
                  display="flex"
                  gap={2}
                  mb={3}
                  flexWrap="wrap"
                  sx={{
                    flexDirection: isMobile ? 'column' : 'row',
                  }}
                >
                  <TextField
                    placeholder="Search by name..."
                    value={search}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 300px', minWidth: 200 }}
                    size={isMobile ? 'medium' : 'small'}
                  />
                  <FormControl
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 200px', minWidth: 180 }}
                    size={isMobile ? 'medium' : 'small'}
                  >
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} onChange={handleStatusFilterChange} label="Status">
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="DRAFT">Draft</MenuItem>
                      <MenuItem value="PUBLISHED">Published</MenuItem>
                      <MenuItem value="ONGOING">Ongoing</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                      <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label="Start Date From"
                    type="date"
                    value={startDateFrom}
                    onChange={handleStartDateFromChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 180px', minWidth: 150 }}
                    size={isMobile ? 'medium' : 'small'}
                  />
                  <TextField
                    label="Start Date To"
                    type="date"
                    value={startDateTo}
                    onChange={handleStartDateToChange}
                    InputLabelProps={{ shrink: true }}
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 180px', minWidth: 150 }}
                    size={isMobile ? 'medium' : 'small'}
                  />
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                  </Box>
                ) : events.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No events found
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Start Date</TableCell>
                            <TableCell>End Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {events.map((event) => (
                            <TableRow key={event.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {event.name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    maxWidth: 200,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {event.description || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {event.location || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(event.startDate, event.startDateLocal)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(event.endDate, event.endDateLocal)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={event.status}
                                  size="small"
                                  color={getStatusColor(event.status)}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {format(new Date(event.createdAt), 'PPp')}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleView(event)}
                                  color="primary"
                                  title="View"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                                {(event.status === 'DRAFT' || event.status === 'PUBLISHED') && (
                                  <>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEdit(event)}
                                      color="primary"
                                      title="Edit"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleStart(event)}
                                      color="success"
                                      disabled={actionLoading === event.id}
                                      title="Start Event"
                                    >
                                      {actionLoading === event.id ? (
                                        <CircularProgress size={16} />
                                      ) : (
                                        <PlayArrowIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </>
                                )}
                                {event.status === 'ONGOING' && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStop(event)}
                                    color="warning"
                                    disabled={actionLoading === event.id}
                                    title="Stop Event"
                                  >
                                    {actionLoading === event.id ? (
                                      <CircularProgress size={16} />
                                    ) : (
                                      <StopIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                )}
                                {user?.role === 'ADMIN' &&
                                  event.status !== 'ONGOING' && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteClick(event)}
                                      color="error"
                                      title="Delete"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={total}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={limit}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Event</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the event &quot;{eventToDelete?.name}&quot;? This
              action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
              {deleting ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  );
}

