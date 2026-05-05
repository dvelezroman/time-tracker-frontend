'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  TextField,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Stack,
  Paper,
  List,
  ListItem,
  Chip,
  Backdrop,
  Tooltip,
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event } from '@/lib/api/services/event.service';
import { timeEntryService, RecordFinishResponse, StageTimeEntry } from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';
import { useWebSocket } from '@/lib/realtime/useWebSocket';
import { offlineStorage } from '@/lib/storage/offline-storage';
import {
  playScanSuccessSound,
  playScanErrorSound,
  playScanDuplicateSound,
  hapticSuccess,
  hapticError,
  hapticDuplicate,
  getScannerSoundEnabled,
  setScannerSoundEnabled,
  getScannerHapticsEnabled,
  setScannerHapticsEnabled,
} from '@/lib/scanner/scanFeedback';

const COOLDOWN_MS = 5000;

export type ScanLogStatus = 'ok' | 'error' | 'duplicate';

export interface ScanLogEntry {
  id: string;
  at: number;
  kind: 'finish' | 'stage' | 'undo' | 'info';
  status: ScanLogStatus | 'info';
  title: string;
  subtitle?: string;
  sequentialNumber?: number;
}

type UndoTarget =
  | { kind: 'finish'; timeEntryId: number; sequentialNumber: number }
  | { kind: 'stage'; stageTimeEntryId: number; sequentialNumber: number };

function pushLog(
  prev: ScanLogEntry[],
  entry: Omit<ScanLogEntry, 'id' | 'at'> & { id?: string; at?: number },
): ScanLogEntry[] {
  const row: ScanLogEntry = {
    id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: entry.at ?? Date.now(),
    kind: entry.kind,
    status: entry.status,
    title: entry.title,
    subtitle: entry.subtitle,
    sequentialNumber: entry.sequentialNumber,
  };
  return [row, ...prev].slice(0, 5);
}

export default function QRScannerPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [recording, setRecording] = useState(false);
  const [scanLog, setScanLog] = useState<ScanLogEntry[]>([]);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  const { connected: wsConnected } = useWebSocket();

  const scanningRef = useRef(false);
  const recordingRef = useRef(false);
  const showManualInputRef = useRef(false);
  const lastUndoableRef = useRef<UndoTarget | null>(null);
  const cooldownRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);
  useEffect(() => {
    showManualInputRef.current = showManualInput;
  }, [showManualInput]);

  useEffect(() => {
    setSoundOn(getScannerSoundEnabled());
    setHapticsOn(getScannerHapticsEnabled());
  }, []);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (event && event.status === 'ONGOING' && !loading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [event, loading]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current = null;
          })
          .catch(() => {
            scannerRef.current = null;
          });
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const n = await offlineStorage.getPendingSyncCount();
        if (!cancelled) setPendingSync(n);
      } catch {
        if (!cancelled) setPendingSync(0);
      }
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const feedbackSuccess = useCallback(() => {
    if (getScannerSoundEnabled()) playScanSuccessSound();
    if (getScannerHapticsEnabled()) hapticSuccess();
  }, []);

  const feedbackError = useCallback(() => {
    if (getScannerSoundEnabled()) playScanErrorSound();
    if (getScannerHapticsEnabled()) hapticError();
  }, []);

  const feedbackDuplicate = useCallback(() => {
    if (getScannerSoundEnabled()) playScanDuplicateSound();
    if (getScannerHapticsEnabled()) hapticDuplicate();
  }, []);

  const loadEvent = async () => {
    try {
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventData = await eventService.getById(eventId, timezone);
      setEvent(eventData);

      if (eventData.status !== 'ONGOING') {
        router.push(ROUTES.EVENTS_DETAIL(eventId));
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to load event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          void handleQRCodeScanned(decodedText);
        },
        () => {},
      );

      setScanning(true);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start camera. Please check permissions.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch {
        // ignore
      }
    }
    setScanning(false);
  };

  const handleUndo = useCallback(async () => {
    const target = lastUndoableRef.current;
    if (!target || !event) {
      showToast('Nothing to undo', 'info');
      return;
    }
    try {
      setRecording(true);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (target.kind === 'finish') {
        await timeEntryService.revertFinish(eventId, target.timeEntryId, timezone);
        cooldownRef.current.delete(target.sequentialNumber);
        setScanLog((prev) =>
          pushLog(prev, {
            kind: 'undo',
            status: 'info',
            title: `Finish reverted for #${target.sequentialNumber}`,
            sequentialNumber: target.sequentialNumber,
          }),
        );
        feedbackSuccess();
        showToast(`Reverted finish for #${target.sequentialNumber}`, 'success');
      } else {
        await timeEntryService.revertStage(eventId, target.stageTimeEntryId, timezone);
        setScanLog((prev) =>
          pushLog(prev, {
            kind: 'undo',
            status: 'info',
            title: `Stage reverted for #${target.sequentialNumber}`,
            sequentialNumber: target.sequentialNumber,
          }),
        );
        feedbackSuccess();
        showToast(`Reverted stage for #${target.sequentialNumber}`, 'success');
      }
      lastUndoableRef.current = null;
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Undo failed';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      feedbackError();
    } finally {
      setRecording(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [event, eventId, feedbackError, feedbackSuccess]);

  const handleSequentialNumberSubmit = async (seqNum: string, stageNumber?: number) => {
    if (recordingRef.current) return;

    const trimmedSeqNum = seqNum.trim();
    if (!trimmedSeqNum) {
      showToast('Please enter a competitor number', 'error');
      return;
    }

    const seqNumber = parseInt(trimmedSeqNum, 10);
    if (isNaN(seqNumber) || seqNumber <= 0) {
      showToast('Please enter a valid competitor number', 'error');
      return;
    }

    const now = Date.now();
    const lastOk = cooldownRef.current.get(seqNumber) ?? 0;
    if (now - lastOk < COOLDOWN_MS) {
      feedbackDuplicate();
      setScanLog((prev) =>
        pushLog(prev, {
          kind: (event?.numberOfStages ?? 1) > 1 && stageNumber ? 'stage' : 'finish',
          status: 'duplicate',
          title: `Duplicate scan ignored (#${seqNumber})`,
          subtitle: `Wait ${Math.ceil((COOLDOWN_MS - (now - lastOk)) / 1000)}s or undo last`,
          sequentialNumber: seqNumber,
        }),
      );
      return;
    }

    try {
      setRecording(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const effectiveStages = event?.numberOfStages ?? 1;

      if (effectiveStages > 1 && stageNumber) {
        const result = await timeEntryService.recordStageBySequentialNumber(
          eventId,
          seqNumber,
          stageNumber,
          timezone,
        );
        cooldownRef.current.set(seqNumber, Date.now());
        lastUndoableRef.current = {
          kind: 'stage',
          stageTimeEntryId: result.id,
          sequentialNumber: seqNumber,
        };
        setScanLog((prev) =>
          pushLog(prev, {
            kind: 'stage',
            status: 'ok',
            title: `${result.competitor.firstName} ${result.competitor.lastName}`,
            subtitle: `Stage ${stageNumber} recorded`,
            sequentialNumber: seqNumber,
          }),
        );
        showToast(
          `Stage ${stageNumber} recorded for ${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})!`,
          'success',
        );
        feedbackSuccess();
      } else {
        const result = await timeEntryService.recordFinishBySequentialNumber(eventId, seqNumber, timezone);
        cooldownRef.current.set(seqNumber, Date.now());
        lastUndoableRef.current = {
          kind: 'finish',
          timeEntryId: result.id,
          sequentialNumber: seqNumber,
        };
        setScanLog((prev) =>
          pushLog(prev, {
            kind: 'finish',
            status: 'ok',
            title: `${result.competitor.firstName} ${result.competitor.lastName}`,
            subtitle: result.endDateLocal
              ? `Finish ${format(new Date(result.endDateLocal), 'HH:mm:ss')}`
              : result.endDate
                ? `Finish ${format(new Date(result.endDate), 'HH:mm:ss')}`
                : 'Finish recorded',
            sequentialNumber: seqNumber,
          }),
        );
        showToast(
          `Finish time recorded for ${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})!`,
          'success',
        );
        feedbackSuccess();
      }

      setTimeout(() => {
        setRecording(false);
        inputRef.current?.focus();
      }, 400);
    } catch (err: unknown) {
      setRecording(false);
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Failed to record time.';
      setError(errorMessage);
      setScanLog((prev) =>
        pushLog(prev, {
          kind: stageNumber ? 'stage' : 'finish',
          status: 'error',
          title: `#${seqNumber} — error`,
          subtitle: errorMessage,
          sequentialNumber: seqNumber,
        }),
      );
      showToast(errorMessage, 'error');
      feedbackError();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    let seqNumber: number | null = null;

    try {
      const parsed = JSON.parse(qrCode);
      if (typeof parsed === 'number') {
        seqNumber = parsed;
      } else if (parsed.sequentialNumber) {
        seqNumber = parsed.sequentialNumber;
      }
    } catch {
      const num = parseInt(qrCode.trim(), 10);
      if (!isNaN(num) && num > 0) {
        seqNumber = num;
      }
    }

    if (!seqNumber) {
      showToast('Invalid QR code format. Expected a competitor number.', 'error');
      return;
    }

    if ((event?.numberOfStages ?? 1) > 1 && selectedStage) {
      await handleSequentialNumberSubmit(seqNumber.toString(), selectedStage);
    } else {
      await handleSequentialNumberSubmit(seqNumber.toString());
    }
  };

  const handleManualSubmit = async () => {
    if (!manualQR.trim()) {
      return;
    }
    await handleQRCodeScanned(manualQR.trim());
    setManualQR('');
    setShowManualInput(false);
  };

  useEffect(() => {
    if (!event || event.status !== 'ONGOING' || loading) return;

    const shortcutAllowed = (e: KeyboardEvent) => {
      const tgt = e.target as HTMLElement | null;
      const tag = tgt?.tagName ?? '';
      const inEditable = tag === 'INPUT' || tag === 'TEXTAREA';
      return !inEditable || e.altKey;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (recordingRef.current) return;

      if (e.key === 'Escape') {
        setShowHelp(false);
        if (showManualInputRef.current) setShowManualInput(false);
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHelp((h) => !h);
        return;
      }

      const k = e.key.toLowerCase();

      if (shortcutAllowed(e) && k === 's') {
        e.preventDefault();
        if (scanningRef.current) void stopScanning();
        else void startScanning();
        return;
      }
      if (shortcutAllowed(e) && k === 'm') {
        e.preventDefault();
        setShowManualInput(true);
        return;
      }
      if (shortcutAllowed(e) && k === 'u') {
        e.preventDefault();
        void handleUndo();
        return;
      }

      const stages = event.numberOfStages ?? 1;
      if (stages > 1 && e.altKey && /^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= stages) {
          e.preventDefault();
          setSelectedStage(n);
        }
        return;
      }
      if (stages > 1 && shortcutAllowed(e) && /^[1-9]$/.test(e.key)) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= stages) {
          e.preventDefault();
          setSelectedStage(n);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [event, loading, handleUndo]);

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

  if (event.status !== 'ONGOING') {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Alert severity="warning" sx={{ mb: 2 }}>
              Event is not currently running. Status: {event.status}
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
          <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Tooltip title="WebSocket (live updates)">
              <Chip
                size="small"
                label={wsConnected ? 'Live' : 'Offline'}
                color={wsConnected ? 'success' : 'default'}
                variant={wsConnected ? 'filled' : 'outlined'}
              />
            </Tooltip>
            {pendingSync > 0 && (
              <Chip size="small" label={`Queued: ${pendingSync}`} color="warning" variant="outlined" />
            )}
          </Stack>

          <Box sx={{ mb: 2 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" align="center" gutterBottom>
              QR Code Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {event.name}
            </Typography>
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 1 }} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Switch
                    checked={soundOn}
                    onChange={(_, v) => {
                      setScannerSoundEnabled(v);
                      setSoundOn(v);
                    }}
                  />
                }
                label="Sound"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={hapticsOn}
                    onChange={(_, v) => {
                      setScannerHapticsEnabled(v);
                      setHapticsOn(v);
                    }}
                  />
                }
                label="Haptics"
              />
              <Button size="small" variant="text" onClick={() => setShowHelp(true)}>
                Shortcuts (?)
              </Button>
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {scanLog.length > 0 && (
            <Paper sx={{ mb: 2, p: 1.5 }} variant="outlined">
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Recent scans
                </Typography>
                <Button size="small" variant="outlined" onClick={() => void handleUndo()} disabled={recording}>
                  Undo last (U)
                </Button>
              </Stack>
              <List dense disablePadding>
                {scanLog.map((row) => (
                  <ListItem key={row.id} sx={{ py: 0.5, display: 'block' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        size="small"
                        label={row.status}
                        color={
                          row.status === 'ok'
                            ? 'success'
                            : row.status === 'duplicate'
                              ? 'warning'
                              : row.status === 'error'
                                ? 'error'
                                : 'default'
                        }
                      />
                      {row.sequentialNumber != null && (
                        <Typography variant="caption" color="text.secondary">
                          #{row.sequentialNumber}
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="body2" fontWeight="medium">
                      {row.title}
                    </Typography>
                    {row.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {row.subtitle}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  py: 2,
                }}
              >
                <Box
                  id="qr-reader"
                  ref={scanAreaRef}
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    minHeight: 300,
                    mb: 3,
                    display: scanning ? 'block' : 'none',
                  }}
                />

                {!scanning && (
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Click the button below to start scanning QR codes (shortcut: S)
                    </Typography>
                  </Box>
                )}

                <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                  {!scanning ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => void startScanning()}
                      disabled={recording}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Start Scanning
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => void stopScanning()}
                      disabled={recording}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Stop Scanning
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    onClick={() => setShowManualInput(true)}
                    disabled={recording}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    Manual Entry (M)
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => router.push(ROUTES.EVENTS_DETAIL(eventId))}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    Back to Event
                  </Button>
                </Box>

                {(event.numberOfStages ?? 1) > 1 && (
                  <Box sx={{ mt: 3, width: '100%' }}>
                    <Typography variant="subtitle1" gutterBottom align="center" fontWeight="bold">
                      Select Stage to Record (1–{event.numberOfStages} or Alt+number)
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 2 }}>
                      {Array.from({ length: event.numberOfStages ?? 1 }, (_, i) => i + 1).map((stageNum) => (
                        <Button
                          key={stageNum}
                          variant={selectedStage === stageNum ? 'contained' : 'outlined'}
                          color={selectedStage === stageNum ? 'primary' : 'inherit'}
                          onClick={() => setSelectedStage(stageNum)}
                          disabled={recording}
                          size={isMobile ? 'medium' : 'large'}
                          sx={{
                            minWidth: { xs: '80px', sm: '100px' },
                            minHeight: 44,
                          }}
                        >
                          Stage {stageNum}
                        </Button>
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 1, display: 'block' }}>
                      {selectedStage
                        ? `Recording Stage ${selectedStage}. Scan QR code or enter competitor number.`
                        : 'Select a stage above, then scan QR code or enter competitor number.'}
                    </Typography>
                  </Box>
                )}

                {(event.numberOfStages ?? 1) === 1 && (
                  <Box sx={{ mt: 3, width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                      This event has a single stage. Scan QR code or enter competitor number to record finish time.
                    </Typography>
                  </Box>
                )}

                <Box sx={{ mt: 3, width: '100%', maxWidth: 400 }}>
                  <TextField
                    inputRef={inputRef}
                    fullWidth
                    label={
                      (event.numberOfStages ?? 1) > 1 && selectedStage
                        ? `Competitor Number (Stage ${selectedStage})`
                        : 'Competitor Number'
                    }
                    type="number"
                    variant="outlined"
                    disabled={recording || ((event.numberOfStages ?? 1) > 1 && !selectedStage)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !recordingRef.current) {
                        const input = e.target as HTMLInputElement;
                        if ((event.numberOfStages ?? 1) > 1 && selectedStage) {
                          void handleSequentialNumberSubmit(input.value, selectedStage);
                        } else {
                          void handleSequentialNumberSubmit(input.value);
                        }
                        input.value = '';
                      }
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            variant="contained"
                            size="small"
                            disabled={recording || ((event.numberOfStages ?? 1) > 1 && !selectedStage)}
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.parentElement?.querySelector(
                                'input',
                              ) as HTMLInputElement;
                              if (input?.value) {
                                if ((event.numberOfStages ?? 1) > 1 && selectedStage) {
                                  void handleSequentialNumberSubmit(input.value, selectedStage);
                                } else {
                                  void handleSequentialNumberSubmit(input.value);
                                }
                                input.value = '';
                              }
                            }}
                            sx={{ minHeight: 36 }}
                          >
                            Record
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Container>

        <Backdrop
          open={recording}
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2, flexDirection: 'column', gap: 2 }}
        >
          <CircularProgress color="inherit" />
          <Typography variant="h6">
            Recording {(event.numberOfStages ?? 1) > 1 && selectedStage ? `stage ${selectedStage}` : 'finish time'}
            …
          </Typography>
        </Backdrop>

        <Dialog open={showManualInput} onClose={() => setShowManualInput(false)} fullWidth maxWidth="sm" fullScreen={isMobile}>
          <DialogTitle>Manual QR Code Entry</DialogTitle>
          <DialogContent sx={{ pt: isMobile ? 2 : 3 }}>
            <TextField
              autoFocus
              margin="dense"
              label="QR Code"
              fullWidth
              variant="outlined"
              value={manualQR}
              onChange={(e) => setManualQR(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleManualSubmit();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowManualInput(false)}>Cancel</Button>
            <Button onClick={() => void handleManualSubmit()} variant="contained" disabled={!manualQR.trim()}>
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showHelp} onClose={() => setShowHelp(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogContent>
            <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-line' }}>
              {`S — Start / stop camera scan
M — Manual QR entry
U — Undo last successful finish or stage
? — Toggle this help
1–9 — Select stage (multi-stage events)

When typing in a field, use Alt+S, Alt+M, Alt+U, Alt+1…9 instead.`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHelp(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  );
}
