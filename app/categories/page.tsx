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
} from '@mui/icons-material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  categoryService,
  Category,
  FilterCategoryParams,
} from '@/lib/api/services/category.service';
import { eventService, Event } from '@/lib/api/services/event.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

export default function CategoriesPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [eventIdFilter, setEventIdFilter] = useState<number | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadCategories();
  }, [page, limit, search, eventIdFilter]);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 1000 });
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const params: FilterCategoryParams = {
        page: page + 1,
        limit,
      };

      if (search) {
        params.search = search;
      }

      if (eventIdFilter) {
        params.eventId = Number(eventIdFilter);
      }

      const response = await categoryService.getAll(params);
      setCategories(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load categories. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleEventFilterChange = (e: any) => {
    setEventIdFilter(e.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (category: Category) => {
    router.push(`${ROUTES.CATEGORIES}/${category.id}/edit`);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleting(true);
      await categoryService.delete(categoryToDelete.id);
      showToast('Category deleted successfully!', 'success');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete category. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push(ROUTES.CATEGORIES_CREATE);
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
                Categories
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                size={isMobile ? 'medium' : 'large'}
              >
                Create Category
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
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 250px', minWidth: 200 }}
                    size={isMobile ? 'medium' : 'small'}
                  >
                    <InputLabel>Filter by Event</InputLabel>
                    <Select
                      value={eventIdFilter}
                      onChange={handleEventFilterChange}
                      label="Filter by Event"
                    >
                      <MenuItem value="">All Events</MenuItem>
                      {events.map((event) => (
                        <MenuItem key={event.id} value={event.id}>
                          {event.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                  </Box>
                ) : categories.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No categories found
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
                            <TableCell>Event</TableCell>
                            <TableCell>Created At</TableCell>
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
                              <TableCell>
                                {category.event ? (
                                  <Chip
                                    label={category.event.name}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Event #{category.eventId}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {format(new Date(category.createdAt), 'PPp')}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(category)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(category)}
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
          <DialogTitle>Delete Category</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the category &quot;{categoryToDelete?.name}&quot;?
              This action cannot be undone.
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

