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
  useTheme,
  useMediaQuery,
  Paper,
  Grid2,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event } from '@/lib/api/services/event.service';
import { eventCompetitorService, EventCompetitor } from '@/lib/api/services/event-competitor.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';

export default function QRCodesPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

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
      const [eventData, competitorsData] = await Promise.all([
        eventService.getById(eventId, timezone),
        eventCompetitorService.getByEvent(eventId),
      ]);
      setEvent(eventData);
      setCompetitors(competitorsData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load data. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      setError('');
      const result = await eventCompetitorService.generateQRCodesForEvent(eventId);
      showToast(result.message, 'success');
      await loadData();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to generate QR codes.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      setError('');
      await eventCompetitorService.downloadQRCodesPDF(eventId);
      showToast('PDF downloaded successfully!', 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to download PDF.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const competitorsWithQR = competitors.filter((c) => c.qrCode);
  const competitorsWithoutQR = competitors.filter((c) => !c.qrCode);

  if (loading) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="xl">
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
          <Container maxWidth="xl">
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
          <Container maxWidth="xl">
            <Alert severity="info">Event not found</Alert>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
      <MainLayout>
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Typography
                  variant={isMobile ? 'h5' : 'h4'}
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                  }}
                >
                  QR Codes - {event.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {competitorsWithQR.length} of {competitors.length} competitors have QR codes
                </Typography>
              </Box>
              <Box display="flex" gap={2} flexWrap="wrap">
                {competitorsWithoutQR.length > 0 && (
                  <Button
                    variant="contained"
                    onClick={handleGenerateAll}
                    disabled={generating}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    {generating ? <CircularProgress size={24} /> : 'Generate All QR Codes'}
                  </Button>
                )}
                {competitorsWithQR.length > 0 && (
                  <Button
                    variant="contained"
                    startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    {downloading ? 'Downloading...' : 'Download PDF'}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={handlePrint}
                  size={isMobile ? 'medium' : 'large'}
                >
                  Print
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => router.push(ROUTES.EVENTS_DETAIL(eventId))}
                  size={isMobile ? 'medium' : 'large'}
                >
                  Back to Event
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {competitorsWithoutQR.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {competitorsWithoutQR.length} competitor(s) do not have QR codes. Click "Generate
                All QR Codes" to create them.
              </Alert>
            )}

            {competitorsWithQR.length === 0 ? (
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      No QR codes generated yet. Click "Generate All QR Codes" to create them.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Grid2 container spacing={{ xs: 2, sm: 3 }}>
                {competitorsWithQR.map((competitor) => (
                  <Grid2 xs={12} sm={6} md={4} lg={3} key={competitor.id}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minHeight: { xs: 250, sm: 280 },
                      }}
                    >
                      <Box
                        sx={{
                          mb: { xs: 1, sm: 2 },
                          p: { xs: 1, sm: 2 },
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <QRCodeSVG 
                          value={competitor.qrCode!} 
                          size={isMobile ? 120 : 150} 
                        />
                      </Box>
                      <Typography 
                        variant="h6" 
                        align="center" 
                        gutterBottom
                        sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                      >
                        {competitor.competitor.firstName} {competitor.competitor.lastName}
                      </Typography>
                      {competitor.sequentialNumber && (
                        <Typography 
                          variant="body1" 
                          color="primary" 
                          align="center" 
                          fontWeight="bold"
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          #{competitor.sequentialNumber}
                        </Typography>
                      )}
                      {competitor.category && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          align="center"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          {competitor.category.name}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        align="center"
                        sx={{ 
                          mt: 1, 
                          wordBreak: 'break-all',
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          px: 1,
                        }}
                      >
                        {competitor.qrCode}
                      </Typography>
                    </Paper>
                  </Grid2>
                ))}
              </Grid2>
            )}
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}



