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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { timeEntryService, LeaderboardResponse, LeaderboardEntry } from '@/lib/api/services/time-entry.service';
import { categoryService, Category } from '@/lib/api/services/category.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { PublicHeader } from '@/components/layout/PublicHeader';

export default function PublicLeaderboardPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const eventId = Number(params.id);

  const [event, setEvent] = useState<LeaderboardResponse['event'] | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [leaderboardData, categoriesData] = await Promise.all([
        timeEntryService.getPublicLeaderboard(eventId, timezone),
        categoryService.getPublicAll({ eventId, limit: 1000 }).catch(() => ({ data: [] })),
      ]);
      setLeaderboard(leaderboardData);
      setEvent(leaderboardData.event);
      setCategories(categoriesData.data || []);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t('common.error');
      setError(errorMessage);
      showToast(errorMessage, 'error');
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

  if (loading) {
    return (
      <>
        <PublicHeader />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error && !leaderboard) {
    return (
      <>
        <PublicHeader />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(ROUTES.LOOKUP)}>
              {t('leaderboard.backToLookup')}
            </Button>
          </Box>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  if (!event || !leaderboard) {
    return (
      <>
        <PublicHeader />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ mb: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(ROUTES.LOOKUP)}>
              {t('leaderboard.backToLookup')}
            </Button>
          </Box>
          <Alert severity="info">{t('common.error')}</Alert>
        </Container>
      </>
    );
  }

  const filteredFinished = leaderboard.finished.filter((entry) => {
    if (selectedCategoryId === '') return true;
    return entry.category?.id === selectedCategoryId;
  });

  const filteredInProgress = leaderboard.inProgress.filter((entry) => {
    if (selectedCategoryId === '') return true;
    return entry.category?.id === selectedCategoryId;
  });

  return (
    <>
      <PublicHeader />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(ROUTES.LOOKUP)} sx={{ mb: 2 }}>
            {t('leaderboard.backToLookup')}
          </Button>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            component="h1"
            sx={{
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
            }}
          >
            {t('leaderboard.title')} - {event.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('leaderboard.finishedCount', { finished: leaderboard.finishedCount, total: leaderboard.total })}
          </Typography>
        </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {categories.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }} size={isMobile ? 'medium' : 'small'}>
            <InputLabel>{t('leaderboard.filterByCategory')}</InputLabel>
            <Select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value as number | '')}
              label={t('leaderboard.filterByCategory')}
            >
              <MenuItem value="">{t('leaderboard.allCategories')}</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {filteredFinished.length === 0 && filteredInProgress.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                {selectedCategoryId === ''
                  ? t('leaderboard.noCompetitors')
                  : t('leaderboard.noCompetitorsCategory')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          {filteredFinished.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  {t('leaderboard.finishedCompetitors')}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>{t('leaderboard.rank')}</strong></TableCell>
                        <TableCell><strong>{t('competitors.sequentialNumber')}</strong></TableCell>
                        <TableCell><strong>{t('leaderboard.competitor')}</strong></TableCell>
                        <TableCell><strong>{t('leaderboard.category')}</strong></TableCell>
                        <TableCell><strong>{t('leaderboard.duration')}</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredFinished.map((entry, index) => (
                        <TableRow key={index} hover>
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

          {filteredInProgress.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  {event.status === 'COMPLETED' ? t('leaderboard.notFinishedAbsent') : t('leaderboard.inProgress')}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>{t('competitors.sequentialNumber')}</strong></TableCell>
                        <TableCell><strong>{t('leaderboard.competitor')}</strong></TableCell>
                        <TableCell><strong>{t('leaderboard.category')}</strong></TableCell>
                        <TableCell><strong>{t('leaderboard.status')}</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredInProgress.map((entry, index) => {
                        const getStatusChip = () => {
                          if (entry.status === 'ABSENT') {
                            return <Chip label={t('leaderboard.absent')} color="error" size="small" />;
                          } else if (entry.status === 'NOT_FINISHED') {
                            return <Chip label={t('leaderboard.notFinished')} color="warning" size="small" />;
                          } else {
                            return <Chip label={t('leaderboard.inProgress')} color="warning" size="small" />;
                          }
                        };

                        return (
                          <TableRow key={index} hover>
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
                            <TableCell>{getStatusChip()}</TableCell>
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
      )}
      </Container>
    </>
  );
}

