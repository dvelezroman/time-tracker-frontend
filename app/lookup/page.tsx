'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Skeleton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ShareIcon from '@mui/icons-material/Share';
import GetAppIcon from '@mui/icons-material/GetApp';
import { eventService } from '@/lib/api/services/event.service';
import { timeEntryService, LeaderboardResponse, LeaderboardEntry } from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { shareOrCopy } from '@/lib/share/shareResult';

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
  categoryRank?: number | null;
  startDate: string | null;
  startDateLocal?: string;
  endDate: string | null;
  endDateLocal?: string;
  duration: number | null;
  timezone?: string;
}

type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
};

export default function LookupPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [sequentialNumber, setSequentialNumber] = useState<string>('');
  const [nameQuery, setNameQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TimeEntryResult | null>(null);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [deferredInstall, setDeferredInstall] = useState<BeforeInstallPromptEventLike | null>(null);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined') {
      setInstallBannerDismissed(sessionStorage.getItem('pwaInstallBannerDismissed') === '1');
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredInstall(e as BeforeInstallPromptEventLike);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  useEffect(() => {
    if (!selectedEventId) {
      setLeaderboard(null);
      setNameQuery('');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingLeaderboard(true);
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const data = await timeEntryService.getPublicLeaderboard(selectedEventId as number, timezone);
        if (!cancelled) setLeaderboard(data);
      } catch {
        if (!cancelled) setLeaderboard(null);
      } finally {
        if (!cancelled) setLoadingLeaderboard(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventsData = await eventService.getPublicEvents(timezone);
      setEvents(eventsData);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        t('lookup.failedToLoadEvents');
      showToast(errorMessage, 'error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const nameMatches = useMemo(() => {
    if (!leaderboard || !nameQuery.trim()) return [];
    const q = nameQuery.trim().toLowerCase();
    const parts = q.split(/\s+/).filter(Boolean);
    const merged: LeaderboardEntry[] = [...leaderboard.finished, ...leaderboard.inProgress];
    const seen = new Set<number | string>();
    const out: LeaderboardEntry[] = [];
    for (const e of merged) {
      const bib = e.sequentialNumber;
      const key = bib ?? `${e.competitor.firstName}-${e.competitor.lastName}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const name = `${e.competitor.firstName} ${e.competitor.lastName}`.toLowerCase();
      if (parts.every((p) => name.includes(p))) {
        out.push(e);
      }
      if (out.length >= 25) break;
    }
    return out;
  }, [leaderboard, nameQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !sequentialNumber.trim()) {
      showToast(t('lookup.selectEventError'), 'error');
      return;
    }

    const seqNum = parseInt(sequentialNumber.trim(), 10);
    if (isNaN(seqNum) || seqNum < 1) {
      showToast(t('lookup.invalidSequentialNumber'), 'error');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const timeEntryData = await timeEntryService.getPublicTimeEntry(selectedEventId as number, seqNum, timezone);
      setResult(timeEntryData);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        t('lookup.failedToLookup');
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

  const getStatusChip = () => {
    if (!result) return null;
    if (result.status === 'FINISHED') {
      return <Chip label={t('lookup.finished')} color="success" size="small" />;
    }
    if (result.status === 'IN_PROGRESS') {
      return <Chip label={t('lookup.inProgress')} color="warning" size="small" />;
    }
    return <Chip label={t('lookup.notStarted')} color="default" size="small" />;
  };

  const selectedEventName = events.find((ev) => ev.id === selectedEventId)?.name ?? '';

  const shareResult = async () => {
    if (!result || !selectedEventId) return;
    const name = `${result.competitor.firstName} ${result.competitor.lastName}`;
    const bib = result.sequentialNumber ?? '';
    const rank = result.rank ?? '';
    const dur = formatDuration(result.duration);
    const text = `${selectedEventName} — ${name} (#${bib}) — ${t('lookup.overallRank')} ${rank} — ${dur}`;
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/leaderboard/${selectedEventId}`
        : '';
    try {
      const mode = await shareOrCopy({ title: selectedEventName, text, url });
      if (mode === 'shared') showToast(t('leaderboard.share'), 'success');
      else if (mode === 'copied') showToast(t('leaderboard.shareCopied'), 'success');
      else showToast(t('leaderboard.shareFailed'), 'error');
    } catch {
      showToast(t('leaderboard.shareFailed'), 'error');
    }
  };

  const runInstall = async () => {
    if (!deferredInstall) {
      showToast(t('lookup.installedThanks'), 'info');
      return;
    }
    try {
      await deferredInstall.prompt();
    } catch {
      showToast(t('leaderboard.shareFailed'), 'error');
    }
  };

  const dismissInstall = () => {
    sessionStorage.setItem('pwaInstallBannerDismissed', '1');
    setInstallBannerDismissed(true);
  };

  const installBannerVisible = !!deferredInstall && !installBannerDismissed;

  return (
    <>
      <PublicHeader />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(ROUTES.HOME)} sx={{ mb: 2 }}>
            {t('lookup.backToHome')}
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
            {t('lookup.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('lookup.subtitle')}
          </Typography>
        </Box>

        {installBannerVisible && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            icon={<GetAppIcon />}
            action={
              <Stack direction="row" spacing={1}>
                <Button color="inherit" size="small" onClick={runInstall} disabled={!deferredInstall}>
                  {t('lookup.installApp')}
                </Button>
                <Button color="inherit" size="small" onClick={dismissInstall}>
                  {t('lookup.installDismiss')}
                </Button>
              </Stack>
            }
          >
            <Typography variant="body2">{t('lookup.installAppBody')}</Typography>
          </Alert>
        )}

        <Card>
          <CardContent>
            {loadingEvents ? (
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={56} />
                <Skeleton variant="rounded" height={48} />
              </Stack>
            ) : (
              <form onSubmit={handleSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <FormControl fullWidth required>
                    <InputLabel>{t('lookup.selectEvent')}</InputLabel>
                    <Select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value as number | '')}
                      label={t('lookup.selectEvent')}
                      disabled={loading}
                    >
                      {events.length === 0 ? (
                        <MenuItem disabled>{t('lookup.noEventsAvailable')}</MenuItem>
                      ) : (
                        events.map((ev) => (
                          <MenuItem key={ev.id} value={ev.id}>
                            {ev.name} ({ev.status})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>

                  <TextField
                    label={t('lookup.searchByName')}
                    value={nameQuery}
                    onChange={(e) => setNameQuery(e.target.value)}
                    fullWidth
                    disabled={!selectedEventId || loadingLeaderboard}
                    helperText={
                      loadingLeaderboard
                        ? t('common.loading')
                        : selectedEventId
                          ? t('lookup.nameSearchHelper')
                          : t('lookup.nameSearchHint')
                    }
                  />

                  {nameMatches.length > 0 && (
                    <Paper variant="outlined" sx={{ maxHeight: 220, overflow: 'auto' }}>
                      <List dense disablePadding>
                        {nameMatches.map((row, idx) => (
                          <ListItemButton
                            key={`${row.sequentialNumber}-${idx}`}
                            onClick={() => {
                              if (row.sequentialNumber != null) {
                                setSequentialNumber(String(row.sequentialNumber));
                              }
                            }}
                          >
                            <ListItemText
                              primary={`${row.competitor.firstName} ${row.competitor.lastName}`}
                              secondary={
                                row.sequentialNumber != null
                                  ? `#${row.sequentialNumber} · ${row.category?.name ?? ''}`
                                  : row.category?.name ?? ''
                              }
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}

                  <TextField
                    label={t('lookup.sequentialNumber')}
                    type="number"
                    value={sequentialNumber}
                    onChange={(e) => setSequentialNumber(e.target.value)}
                    required
                    fullWidth
                    disabled={loading}
                    inputProps={{ min: 1 }}
                    helperText={t('lookup.sequentialNumberHelper')}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                    disabled={loading || loadingEvents || !selectedEventId || !sequentialNumber.trim()}
                    fullWidth
                  >
                    {loading ? t('lookup.lookingUp') : t('lookup.lookupTime')}
                  </Button>
                </Box>
              </form>
            )}
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
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Typography variant="h6">{t('lookup.yourResults')}</Typography>
                <Button size="small" startIcon={<ShareIcon />} onClick={() => void shareResult()}>
                  {t('lookup.shareResult')}
                </Button>
              </Stack>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('lookup.competitor')}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {result.competitor.firstName} {result.competitor.lastName}
                  </Typography>
                </Box>

                {result.sequentialNumber && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('lookup.sequentialNumber')}
                    </Typography>
                    <Typography variant="body1">#{result.sequentialNumber}</Typography>
                  </Box>
                )}

                {result.category && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {t('lookup.category')}
                    </Typography>
                    <Typography variant="body1">{result.category.name}</Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('lookup.status')}
                  </Typography>
                  {getStatusChip()}
                </Box>

                {result.status === 'FINISHED' && result.rank && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('lookup.overallRank')}
                      </Typography>
                      <Typography variant="h5" color="primary" fontWeight="bold">
                        #{result.rank}
                      </Typography>
                    </Box>
                    {result.category && result.categoryRank && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {t('lookup.categoryRank', { category: result.category.name })}
                        </Typography>
                        <Typography variant="h5" color="secondary" fontWeight="bold">
                          #{result.categoryRank}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                {result.duration !== null && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {t('lookup.duration')}
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {formatDuration(result.duration)}
                      </Typography>
                    </Box>
                  </>
                )}

                {result.status === 'NOT_STARTED' && <Alert severity="info">{t('lookup.notStartedMessage')}</Alert>}

                {result.status === 'IN_PROGRESS' && <Alert severity="warning">{t('lookup.inProgressMessage')}</Alert>}

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<LeaderboardIcon />}
                  onClick={() => router.push(`/leaderboard/${selectedEventId}`)}
                  sx={{ mt: 2 }}
                >
                  {t('lookup.viewCompleteLeaderboard')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}
