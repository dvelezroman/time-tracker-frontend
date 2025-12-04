'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  Container,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  eventCompetitorService,
  EventCompetitor,
  FilterEventCompetitorParams,
} from '@/lib/api/services/event-competitor.service';
import { eventService, Event } from '@/lib/api/services/event.service';
import { categoryService, Category } from '@/lib/api/services/category.service';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

export default function CompetitorsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (eventFilter) {
      loadCategories(Number(eventFilter));
    } else {
      setCategories([]);
      setCategoryFilter('');
    }
  }, [eventFilter]);

  useEffect(() => {
    loadCompetitors();
  }, [page, limit, search, eventFilter, categoryFilter]);

  const loadEvents = async () => {
    try {
      const response = await eventService.getAll({ limit: 1000 });
      setEvents(response.data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const loadCategories = async (eventId: number) => {
    try {
      const response = await categoryService.getAll({ eventId, limit: 1000 });
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const loadCompetitors = async () => {
    try {
      setLoading(true);
      setError('');

      const params: FilterEventCompetitorParams = {
        page: page + 1,
        limit,
      };

      if (eventFilter) {
        params.eventId = Number(eventFilter);
      }

      if (categoryFilter) {
        params.categoryId = Number(categoryFilter);
      }

      const response = await eventCompetitorService.getAll(params);

      // Apply client-side search filtering
      let filteredData = response.data;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter(
          (ec) =>
            ec.competitor.firstName.toLowerCase().includes(searchLower) ||
            ec.competitor.lastName.toLowerCase().includes(searchLower) ||
            ec.competitor.email?.toLowerCase().includes(searchLower) ||
            ec.competitor.phone?.toLowerCase().includes(searchLower)
        );
      }

      setCompetitors(filteredData);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load competitors. Please try again.';
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

  const handleEventFilterChange = (e: any) => {
    setEventFilter(e.target.value);
    setCategoryFilter(''); // Reset category filter when event changes
    setPage(0);
  };

  const handleCategoryFilterChange = (e: any) => {
    setCategoryFilter(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDownloadPDF = async () => {
    if (!eventFilter) {
      showToast('Please select an event first', 'warning');
      return;
    }

    try {
      setDownloading(true);
      await eventCompetitorService.downloadQRCodesPDF(Number(eventFilter));
      showToast('PDF downloaded successfully', 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to download PDF. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
      <MainLayout>
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                mb: 3,
              }}
            >
              Competitors
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {eventFilter && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  size={isMobile ? 'medium' : 'large'}
                >
                  {downloading ? 'Downloading...' : 'Download QR Codes PDF'}
                </Button>
              </Box>
            )}

            <Card sx={{ overflow: 'hidden' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
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
                    placeholder="Search by name, email, or phone..."
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
                    <Select value={eventFilter} onChange={handleEventFilterChange} label="Filter by Event">
                      <MenuItem value="">All Events</MenuItem>
                      {events.map((event) => (
                        <MenuItem key={event.id} value={event.id}>
                          {event.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 250px', minWidth: 200 }}
                    size={isMobile ? 'medium' : 'small'}
                    disabled={!eventFilter}
                  >
                    <InputLabel>Filter by Category</InputLabel>
                    <Select
                      value={categoryFilter}
                      onChange={handleCategoryFilterChange}
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
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                  </Box>
                ) : competitors.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No competitors found
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer
                      sx={{
                        overflowX: 'auto',
                        '& .MuiTableCell-root': {
                          whiteSpace: isMobile ? 'nowrap' : 'normal',
                          padding: isMobile ? '8px 4px' : '16px',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                        },
                      }}
                    >
                      <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Competitor Name</TableCell>
                            <TableCell>Sequential #</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              Email
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              Phone
                            </TableCell>
                            <TableCell>Event</TableCell>
                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                              Category
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              Registered At
                            </TableCell>
                            <TableCell>QR Code</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {competitors.map((ec) => (
                            <TableRow key={ec.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {ec.competitor.firstName} {ec.competitor.lastName}
                                </Typography>
                                {isMobile && (
                                  <>
                                    {ec.competitor.email && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {ec.competitor.email}
                                      </Typography>
                                    )}
                                    {ec.category && (
                                      <Chip
                                        label={ec.category.name}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ mt: 0.5 }}
                                      />
                                    )}
                                  </>
                                )}
                              </TableCell>
                              <TableCell>
                                {ec.sequentialNumber ? (
                                  <Chip
                                    label={`#${ec.sequentialNumber}`}
                                    size="small"
                                    color="primary"
                                    variant="filled"
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                <Typography variant="body2" color="text.secondary">
                                  {ec.competitor.email || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Typography variant="body2" color="text.secondary">
                                  {ec.competitor.phone || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={ec.event?.name || `Event #${ec.eventId}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                {ec.category ? (
                                  <Chip
                                    label={ec.category.name}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Typography variant="body2" color="text.secondary">
                                  {format(new Date(ec.registeredAt), isMobile ? 'PP' : 'PPp')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {ec.qrCode ? (
                                  <Chip label="Generated" size="small" color="success" />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    Not generated
                                  </Typography>
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
                      labelRowsPerPage={isMobile ? 'Rows:' : 'Rows per page:'}
                      labelDisplayedRows={({ from, to, count }) =>
                        isMobile ? `${from}-${to} of ${count}` : `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                      }
                      sx={{
                        '& .MuiTablePagination-toolbar': {
                          flexWrap: 'wrap',
                          gap: 1,
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                        },
                      }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
