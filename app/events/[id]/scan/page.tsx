'use client';

import { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event } from '@/lib/api/services/event.service';
import { timeEntryService, RecordFinishResponse } from '@/lib/api/services/time-entry.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

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
  const [sequentialNumber, setSequentialNumber] = useState('');
  const [recording, setRecording] = useState(false);
  const [lastRecorded, setLastRecorded] = useState<RecordFinishResponse | null>(null);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQR, setManualQR] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  // Auto-focus input when page loads and event is loaded
  useEffect(() => {
    if (event && event.status === 'ONGOING' && !loading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [event, loading]);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
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

  const loadEvent = async () => {
    try {
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventData = await eventService.getById(eventId, timezone);
      setEvent(eventData);

      // If event is not ONGOING, redirect to detail page
      if (eventData.status !== 'ONGOING') {
        router.push(ROUTES.EVENTS_DETAIL(eventId));
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load event. Please try again.';
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
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Handle QR code scan - scanner continues running
          handleQRCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent while scanning)
          // Scanner continues running in idle mode
        },
      );

      setScanning(true);
    } catch (err: any) {
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
      } catch (err) {
        // Ignore stop errors
      }
    }
    setScanning(false);
  };

  const handleSequentialNumberSubmit = async (seqNum: string) => {
    if (recording) return; // Prevent duplicate submissions

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

    try {
      setRecording(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await timeEntryService.recordFinishBySequentialNumber(eventId, seqNumber, timezone);

      setLastRecorded(result);
      showToast(
        `Finish time recorded for ${result.competitor.firstName} ${result.competitor.lastName} (#${seqNumber})!`,
        'success',
      );

      // Clear input and refocus
      setSequentialNumber('');
      setTimeout(() => {
        setRecording(false);
        inputRef.current?.focus();
      }, 1000);
    } catch (err: any) {
      setRecording(false);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to record finish time.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      // Keep input focused for next entry
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    }
  };

  const handleQRCodeScanned = async (qrCode: string) => {
    // Parse sequential number from QR code (can be plain number or JSON)
    let seqNumber: number | null = null;
    
    try {
      // Try parsing as JSON first (backward compatibility)
      const parsed = JSON.parse(qrCode);
      if (typeof parsed === 'number') {
        seqNumber = parsed;
      } else if (parsed.sequentialNumber) {
        seqNumber = parsed.sequentialNumber;
      }
    } catch {
      // If not JSON, try parsing as plain number
      const num = parseInt(qrCode.trim(), 10);
      if (!isNaN(num) && num > 0) {
        seqNumber = num;
      }
    }

    if (!seqNumber) {
      showToast('Invalid QR code format. Expected a competitor number.', 'error');
      return;
    }

    await handleSequentialNumberSubmit(seqNumber.toString());
  };

  const handleManualSubmit = async () => {
    if (!manualQR.trim()) {
      return;
    }
    await handleQRCodeScanned(manualQR.trim());
    setManualQR('');
    setShowManualInput(false);
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
          <Box sx={{ mb: 3 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" align="center" gutterBottom>
              QR Code Scanner
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center">
              {event.name}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {lastRecorded && (
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold">
                {lastRecorded.competitor.firstName} {lastRecorded.competitor.lastName}
              </Typography>
              <Typography variant="body2">
                Finish Time:{' '}
                {lastRecorded.endDateLocal
                  ? format(new Date(lastRecorded.endDateLocal), 'HH:mm:ss')
                  : format(new Date(lastRecorded.endDate!), 'HH:mm:ss')}
              </Typography>
              {lastRecorded.duration !== null && (
                <Typography variant="body2">
                  Duration: {(() => {
                    const totalSeconds = Math.floor(lastRecorded.duration / 1000);
                    const ms = lastRecorded.duration % 1000;
                    const mins = Math.floor(totalSeconds / 60);
                    const secs = totalSeconds % 60;
                    return `${mins}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
                  })()}
                </Typography>
              )}
            </Alert>
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
                      Click the button below to start scanning QR codes
                    </Typography>
                  </Box>
                )}

                <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                  {!scanning ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={startScanning}
                      disabled={recording}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Start Scanning
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={stopScanning}
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
                    Manual Entry
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => router.push(ROUTES.EVENTS_DETAIL(eventId))}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    Back to Event
                  </Button>
                </Box>

                {recording && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Recording finish time...
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Container>

        <Dialog open={showManualInput} onClose={() => setShowManualInput(false)}>
          <DialogTitle>Manual QR Code Entry</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="QR Code"
              fullWidth
              variant="outlined"
              value={manualQR}
              onChange={(e) => setManualQR(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleManualSubmit();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowManualInput(false)}>Cancel</Button>
            <Button onClick={handleManualSubmit} variant="contained" disabled={!manualQR.trim()}>
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  );
}



