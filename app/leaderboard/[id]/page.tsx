'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Container,
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
  Skeleton,
  Stack,
  Divider,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { timeEntryService, LeaderboardResponse, LeaderboardEntry } from '@/lib/api/services/time-entry.service';
import { categoryService, Category } from '@/lib/api/services/category.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { shareOrCopy } from '@/lib/share/shareResult';

const POLL_MS = 10_000;

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

  const loadData = useCallback(async () => {
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
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        t('common.error');
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [eventId, t]);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [leaderboardData, categoriesData] = await Promise.all([
        timeEntryService.getPublicLeaderboard(eventId, timezone),
        categoryService.getPublicAll({ eventId, limit: 1000 }).catch(() => ({ data: [] })),
      ]);
      setLeaderboard(leaderboardData);
      setEvent(leaderboardData.event);
      setCategories(categoriesData.data || []);
    } catch {
      /* keep previous data on silent refresh */
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      void loadData();
    }
  }, [eventId, loadData]);

  useEffect(() => {
    if (!leaderboard?.event || leaderboard.event.status !== 'ONGOING') return;
    const id = setInterval(() => {
      void refreshLeaderboard();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [leaderboard?.event?.status, refreshLeaderboard]);

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

  const filteredFinished = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.finished.filter((entry) => {
      if (selectedCategoryId === '') return true;
      return entry.category?.id === selectedCategoryId;
    });
  }, [leaderboard, selectedCategoryId]);

  const filteredInProgress = useMemo(() => {
    if (!leaderboard) return [];
    return leaderboard.inProgress.filter((entry) => {
      if (selectedCategoryId === '') return true;
      return entry.category?.id === selectedCategoryId;
    });
  }, [leaderboard, selectedCategoryId]);

  const podium = useMemo(() => filteredFinished.slice(0, 3), [filteredFinished]);

  const shareEntry = async (entry: LeaderboardEntry) => {
    const name = `${entry.competitor.firstName} ${entry.competitor.lastName}`;
    const bib = entry.sequentialNumber ?? '';
    const rank = entry.rank ?? '';
    const dur = formatDuration(entry.duration);
    const text = `${event?.name ?? 'Event'} — ${name} (#${bib}) — ${t('leaderboard.rank')} ${rank} — ${dur}`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      const mode = await shareOrCopy({ title: event?.name, text, url });
      if (mode === 'shared') showToast(t('leaderboard.share'), 'success');
      else if (mode === 'copied') showToast(t('leaderboard.shareCopied'), 'success');
      else showToast(t('leaderboard.shareFailed'), 'error');
    } catch {
      showToast(t('leaderboard.shareFailed'), 'error');
    }
  };

  if (loading && !leaderboard) {
    return (
      <>
        <PublicHeader />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Skeleton variant="text" width={280} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={240} />
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

  const renderFinishedRowActions = (entry: LeaderboardEntry) => (
    <Button size="small" startIcon={<ShareIcon />} onClick={() => void shareEntry(entry)} sx={{ mt: isMobile ? 1 : 0 }}>
      {t('leaderboard.share')}
    </Button>
  );

  const finishedCard = (entry: LeaderboardEntry, index: number) => (
    <Card key={entry.timeEntryId ?? index} sx={{ mb: 2 }} variant="outlined">
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Chip label={`#${entry.rank}`} color="success" size="small" sx={{ fontWeight: 'bold', mb: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              {entry.competitor.firstName} {entry.competitor.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('competitors.sequentialNumber')}: #{entry.sequentialNumber ?? '-'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {entry.category?.name || '-'}
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight="bold" color="primary">
            {formatDuration(entry.duration)}
          </Typography>
        </Stack>
        {renderFinishedRowActions(entry)}
      </CardContent>
    </Card>
  );

  return (
    <>
      <PublicHeader />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(ROUTES.LOOKUP)} sx={{ mb: 2 }}>
            {t('leaderboard.backToLookup')}
          </Button>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
              }}
            >
              {t('leaderboard.title')} — {event.name}
            </Typography>
            {event.status === 'ONGOING' && (
              <Chip
                size="small"
                color="success"
                label={t('leaderboard.liveUpdating')}
                variant="outlined"
                sx={{ animation: 'pulse 2s ease-in-out infinite', '@keyframes pulse': { '50%': { opacity: 0.65 } } }}
              />
            )}
          </Stack>
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

        {podium.length > 0 && (
          <Card sx={{ mb: 3, background: theme.palette.mode === 'dark' ? 'linear-gradient(135deg,#1e293b,#0f172a)' : 'linear-gradient(135deg,#fff8e1,#ffecb3)' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <EmojiEventsIcon color="warning" />
                <Typography variant="h6" fontWeight={800}>
                  {t('leaderboard.podiumTitle')}
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-around">
                {podium.map((entry, idx) => {
                  const medal = idx === 0 ? '#ffc107' : idx === 1 ? '#9e9e9e' : '#cd7f32';
                  return (
                    <Box key={entry.timeEntryId ?? idx} textAlign="center" flex={1}>
                      <Typography variant="overline" sx={{ color: medal, fontWeight: 800 }}>
                        #{entry.rank}
                      </Typography>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {entry.competitor.firstName} {entry.competitor.lastName}
                      </Typography>
                      <Typography variant="h6" color="primary" fontFamily="monospace">
                        {formatDuration(entry.duration)}
                      </Typography>
                      <Button size="small" startIcon={<ShareIcon />} onClick={() => void shareEntry(entry)}>
                        {t('leaderboard.share')}
                      </Button>
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        )}

        {filteredFinished.length === 0 && filteredInProgress.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  {selectedCategoryId === '' ? t('leaderboard.noCompetitors') : t('leaderboard.noCompetitorsCategory')}
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
                  {isMobile ? (
                    <Box>{filteredFinished.map((entry, index) => finishedCard(entry, index))}</Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>{t('leaderboard.rank')}</strong>
                            </TableCell>
                            <TableCell>
                              <strong>{t('competitors.sequentialNumber')}</strong>
                            </TableCell>
                            <TableCell>
                              <strong>{t('leaderboard.competitor')}</strong>
                            </TableCell>
                            <TableCell>
                              <strong>{t('leaderboard.category')}</strong>
                            </TableCell>
                            <TableCell>
                              <strong>{t('leaderboard.duration')}</strong>
                            </TableCell>
                            <TableCell align="right">
                              <strong>{t('leaderboard.share')}</strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredFinished.map((entry, index) => (
                            <TableRow key={entry.timeEntryId ?? index} hover>
                              <TableCell>
                                <Chip label={`#${entry.rank}`} color="success" size="small" sx={{ fontWeight: 'bold' }} />
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
                              <TableCell align="right">
                                <Button size="small" startIcon={<ShareIcon />} onClick={() => void shareEntry(entry)}>
                                  {t('leaderboard.share')}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}

            {filteredInProgress.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    {event.status === 'COMPLETED' ? t('leaderboard.notFinishedAbsent') : t('leaderboard.inProgress')}
                  </Typography>
                  {isMobile ? (
                    <Stack spacing={2}>
                      {filteredInProgress.map((entry, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                          <Typography fontWeight="bold">#{entry.sequentialNumber ?? '-'}</Typography>
                          <Typography>
                            {entry.competitor.firstName} {entry.competitor.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.category?.name || '-'}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          {entry.status === 'ABSENT' ? (
                            <Chip label={t('leaderboard.absent')} color="error" size="small" />
                          ) : entry.status === 'NOT_FINISHED' ? (
                            <Chip label={t('leaderboard.notFinished')} color="warning" size="small" />
                          ) : (
                            <Chip label={t('leaderboard.inProgress')} color="warning" size="small" />
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>{t('competitors.sequentialNumber')}</strong>
                            </TableCell>
                            <TableCell>
                              <strong>{t('leaderboard.competitor')}</strong>
                            </TableCell>
                            <TableCell>
                              <strong>{t('leaderboard.category')}</strong>
                            </TableCell>
                            <TableCell>
                              <strong>{t('leaderboard.status')}</strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredInProgress.map((entry, index) => {
                            const getStatusChip = () => {
                              if (entry.status === 'ABSENT') {
                                return <Chip label={t('leaderboard.absent')} color="error" size="small" />;
                              }
                              if (entry.status === 'NOT_FINISHED') {
                                return <Chip label={t('leaderboard.notFinished')} color="warning" size="small" />;
                              }
                              return <Chip label={t('leaderboard.inProgress')} color="warning" size="small" />;
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
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Container>
    </>
  );
}
