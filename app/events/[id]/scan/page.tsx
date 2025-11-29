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

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lastRecorded, setLastRecorded] = useState<RecordFinishResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

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

  const handleQRCodeScanned = async (qrCode: string) => {
    if (recording) return; // Prevent duplicate scans

    try {
      setRecording(true);
      // Don't stop scanning - keep it running for continuous scanning
      
      // Parse QR code JSON
      let qrData: { eventId: number; ticketId: number; registrationId: number };
      try {
        qrData = JSON.parse(qrCode);
        if (!qrData.eventId || !qrData.ticketId || !qrData.registrationId) {
          throw new Error('Invalid QR code format');
        }
      } catch (parseError) {
        setRecording(false);
        showToast('Invalid QR code format. Expected JSON with eventId, ticketId, and registrationId.', 'error');
        return;
      }

      // Verify eventId matches
      if (qrData.eventId !== eventId) {
        setRecording(false);
        showToast(`QR code is for a different event (Event ID: ${qrData.eventId})`, 'error');
        return;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await timeEntryService.recordFinishById(
        qrData.eventId,
        qrData.ticketId,
        qrData.registrationId,
        timezone,
      );

      setLastRecorded(result);
      showToast(
        `Finish time recorded for ${result.competitor.firstName} ${result.competitor.lastName}!`,
        'success',
      );

      // Resume recording after a short delay (scanner keeps running)
      setTimeout(() => {
        setRecording(false);
      }, 1500);
    } catch (err: any) {
      setRecording(false);
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to record finish time.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      // Scanner continues running - no need to restart
    }
  };

  const handleManualSubmit = async () => {
    if (!manualQR.trim()) {
      showToast('Please enter a QR code', 'error');
      return;
    }

    setShowManualInput(false);
    await handleQRCodeScanned(manualQR.trim());
    setManualQR('');
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
                  Duration: {Math.floor(lastRecorded.duration / 60)}:
                  {String(lastRecorded.duration % 60).padStart(2, '0')}
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



