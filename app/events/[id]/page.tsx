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
  Chip,
  Container,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Checkbox,
  IconButton,
  TextField,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { EventCompetitor } from '@/lib/api/services/event-competitor.service';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { eventService, Event, EventStatus } from '@/lib/api/services/event.service';
import { eventCompetitorService } from '@/lib/api/services/event-competitor.service';
import { competitorService, CreateCompetitorRequest } from '@/lib/api/services/competitor.service';
import { categoryService, Category } from '@/lib/api/services/category.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const eventId = Number(params.id);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [timerTypeDialogOpen, setTimerTypeDialogOpen] = useState(false);
  const [selectedTimerType, setSelectedTimerType] = useState<'collective' | 'individual'>('collective');
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
    total: number;
  } | null>(null);
  const [competitors, setCompetitors] = useState<EventCompetitor[]>([]);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [selectedCompetitors, setSelectedCompetitors] = useState<number[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [competitorFormData, setCompetitorFormData] = useState<CreateCompetitorRequest & { categoryId?: number; sequentialNumber?: number }>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    categoryId: undefined,
    sequentialNumber: undefined,
  });
  const [editingSequentialNumber, setEditingSequentialNumber] = useState<number | null>(null);
  const [sequentialNumberValue, setSequentialNumberValue] = useState<string>('');
  const [updatingSequentialNumber, setUpdatingSequentialNumber] = useState<number | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
      loadCompetitors();
      loadCategories();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const eventData = await eventService.getById(eventId, timezone);
      console.log('Event data loaded:', eventData);
      console.log('Assignee data:', eventData.assignee);
      setEvent(eventData);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitors = async () => {
    try {
      setLoadingCompetitors(true);
      const competitorsData = await eventCompetitorService.getByEvent(eventId);
      setCompetitors(competitorsData);
    } catch (err: any) {
      console.error('Failed to load competitors:', err);
    } finally {
      setLoadingCompetitors(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await categoryService.getAll({ eventId, limit: 1000 });
      setCategories(categoriesData.data);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSelectCompetitor = (id: number) => {
    setSelectedCompetitors((prev) =>
      prev.includes(id) ? prev.filter((compId) => compId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedCompetitors.length === competitors.length) {
      setSelectedCompetitors([]);
    } else {
      setSelectedCompetitors(competitors.map((c) => c.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCompetitors.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedCompetitors.length} competitor(s) from this event?`)) {
      return;
    }

    try {
      setDeleting(true);
      await Promise.all(selectedCompetitors.map((id) => eventCompetitorService.delete(id)));
      showToast(`Successfully deleted ${selectedCompetitors.length} competitor(s)`, 'success');
      setSelectedCompetitors([]);
      await loadCompetitors();
      await loadEvent(); // Refresh event to update competitor count
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete competitors. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenRegisterDialog = () => {
    setCompetitorFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      categoryId: undefined,
    });
    setRegisterDialogOpen(true);
  };

  const handleCloseRegisterDialog = () => {
    if (!registering) {
      setRegisterDialogOpen(false);
      setCompetitorFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        categoryId: undefined,
        sequentialNumber: undefined,
      });
    }
  };

  const handleRegisterCompetitor = async () => {
    if (!competitorFormData.firstName.trim() || !competitorFormData.lastName.trim()) {
      showToast('First name and last name are required', 'error');
      return;
    }

    if (!competitorFormData.phone?.trim()) {
      showToast('Phone is required', 'error');
      return;
    }

    if (!competitorFormData.categoryId) {
      showToast('Category is required', 'error');
      return;
    }

    try {
      setRegistering(true);
      
      // Create competitor
      const competitorData: CreateCompetitorRequest = {
        firstName: competitorFormData.firstName.trim(),
        lastName: competitorFormData.lastName.trim(),
        email: competitorFormData.email?.trim() || undefined,
        phone: competitorFormData.phone?.trim() || undefined,
      };
      
      const competitor = await competitorService.create(competitorData);
      
      // Register competitor to event
      await eventCompetitorService.register({
        eventId,
        competitorId: competitor.id,
        categoryId: competitorFormData.categoryId,
        sequentialNumber: competitorFormData.sequentialNumber,
      });
      
      showToast('Competitor created and registered successfully!', 'success');
      setRegisterDialogOpen(false);
      setCompetitorFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        categoryId: undefined,
        sequentialNumber: undefined,
      });
      await loadCompetitors();
      await loadEvent(); // Refresh event to update competitor count
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to register competitor. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setRegistering(false);
    }
  };

  const handleExportToExcel = async () => {
    try {
      setExportingExcel(true);
      await eventCompetitorService.exportToExcel(eventId);
      showToast('Excel file downloaded successfully!', 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to export Excel file. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleStartEditSequentialNumber = (id: number, currentValue: number | null | undefined) => {
    setEditingSequentialNumber(id);
    setSequentialNumberValue(currentValue?.toString() || '');
  };

  const handleCancelEditSequentialNumber = () => {
    setEditingSequentialNumber(null);
    setSequentialNumberValue('');
  };

  const handleSaveSequentialNumber = async (id: number) => {
    const newValue = parseInt(sequentialNumberValue, 10);
    
    if (isNaN(newValue) || newValue < 1) {
      showToast('Please enter a valid sequential number (minimum 1)', 'error');
      handleCancelEditSequentialNumber();
      return;
    }

    // Check if the number is already used by another competitor in this event
    const existingCompetitor = competitors.find(
      (c) => c.id !== id && c.sequentialNumber === newValue
    );

    if (existingCompetitor) {
      showToast(
        `Sequential number ${newValue} is already assigned to ${existingCompetitor.competitor.firstName} ${existingCompetitor.competitor.lastName}`,
        'error',
      );
      handleCancelEditSequentialNumber();
      return;
    }

    try {
      setUpdatingSequentialNumber(id);
      await eventCompetitorService.updateSequentialNumber(id, newValue);
      
      // Update local state
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, sequentialNumber: newValue }
            : c
        )
      );
      
      showToast('Sequential number updated successfully', 'success');
      handleCancelEditSequentialNumber();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update sequential number';
      showToast(errorMessage, 'error');
    } finally {
      setUpdatingSequentialNumber(null);
    }
  };

  const handleStartEventClick = () => {
    setTimerTypeDialogOpen(true);
  };

  const handleStartEvent = async () => {
    if (!event) return;

    try {
      setStarting(true);
      setError('');
      setTimerTypeDialogOpen(false);
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await eventService.start(eventId, { timezone, timerType: selectedTimerType });
      showToast('Event started successfully!', 'success');
      
      // Redirect based on timer type
      if (selectedTimerType === 'individual') {
        // For individual timer, open in full screen in a new tab
        const individualTimerUrl = ROUTES.EVENTS_INDIVIDUAL_TIMER(eventId);
        const newTab = window.open(individualTimerUrl, '_blank', 'noopener,noreferrer');
        
        // Check if popup was blocked
        if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
          // Popup was blocked - show a message with a link
          showToast(
            'Popup blocked. Use the "Individual Timer" button to open it, or allow popups for this site.',
            'warning',
          );
        }
      } else {
        // For collective timer, open full screen timer in a new tab
        const fullScreenUrl = ROUTES.EVENTS_TIMER_FULLSCREEN(eventId);
        const newTab = window.open(fullScreenUrl, '_blank', 'noopener,noreferrer');
        
        // Check if popup was blocked
        if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
          // Popup was blocked - show a message with a link
          showToast(
            'Popup blocked. Use the "Full Screen Timer" button to open it, or allow popups for this site.',
            'warning',
          );
        }
        
        // Also redirect to timer page in current tab
        router.push(ROUTES.EVENTS_TIMER(eventId));
      }
      
      // Reload event to get updated status
      loadEvent();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to start event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setStarting(false);
    }
  };

  const handleViewTimer = () => {
    router.push(ROUTES.EVENTS_TIMER(eventId));
  };

  const handleStopEvent = async () => {
    if (!event) return;

    try {
      setStopping(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await eventService.stop(eventId, { timezone });
      showToast('Event stopped successfully!', 'success');
      loadEvent();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to stop event. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setStopping(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      showToast('Invalid file type. Please upload an Excel file (.xlsx or .xls)', 'error');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('File size exceeds 10MB limit', 'error');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setUploadResult(null);

      const result = await eventCompetitorService.importExcel(file, eventId);

      setUploadResult(result);

      if (result.failed === 0 && result.errors.length === 0) {
        showToast(
          `Successfully imported ${result.created + result.updated} competitor(s)!`,
          'success',
        );
        // Reload event to refresh data
        loadEvent();
      } else {
        showToast(
          `Import completed with ${result.failed} failure(s). ${result.created + result.updated} competitor(s) imported.`,
          result.failed > 0 ? 'warning' : 'success',
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to import Excel file. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSendWhatsAppTimes = async () => {
    if (!event) return;

    try {
      setSendingWhatsApp(true);
      setError('');
      const result = await eventService.sendWhatsAppTimes(eventId);
      showToast(
        `WhatsApp notifications queued successfully! ${result.queued} sent, ${result.skipped} skipped.`,
        'success',
      );
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to send WhatsApp notifications. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSendingWhatsApp(false);
    }
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
      return format(new Date(localDateString), 'PPpp');
    }
    return format(new Date(dateString), 'PPpp');
  };

  if (loading) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(ROUTES.EVENTS)}
                sx={{ mb: 2 }}
                size={isMobile ? 'medium' : 'large'}
              >
                Back to Events
              </Button>
            </Box>
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
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(ROUTES.EVENTS)}
                sx={{ mb: 2 }}
                size={isMobile ? 'medium' : 'large'}
              >
                Back to Events
              </Button>
            </Box>
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
            <Box sx={{ mb: 3 }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push(ROUTES.EVENTS)}
                sx={{ mb: 2 }}
                size={isMobile ? 'medium' : 'large'}
              >
                Back to Events
              </Button>
            </Box>
            <Alert severity="info">Event not found</Alert>
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
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push(ROUTES.EVENTS)}
              sx={{ mb: 2 }}
              size={isMobile ? 'medium' : 'large'}
            >
              Back to Events
            </Button>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant={isMobile ? 'h5' : 'h4'} component="h1">
                {event.name}
              </Typography>
              <Chip label={event.status} color={getStatusColor(event.status)} />
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {event.status === 'ONGOING' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                How to Record Competitor Finish Times:
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Click &quot;Scan QR Code&quot; button to open the QR scanner</li>
                  <li>Use your device camera to scan each competitor&apos;s QR code when they finish</li>
                  <li>Or use &quot;Manual Entry&quot; to enter the QR code data manually</li>
                  <li>Finish times are automatically recorded and appear on the leaderboard</li>
                </ul>
              </Typography>
            </Alert>
          )}

          <Card>
            <CardContent>
              {event.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">{event.description}</Typography>
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Start Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(event.startDate, event.startDateLocal)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  End Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(event.endDate, event.endDateLocal)}
                </Typography>
              </Box>

              {event.location && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Location
                  </Typography>
                  <Typography variant="body1">{event.location}</Typography>
                </Box>
              )}

              {event.assignee && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Assigned Operator
                  </Typography>
                  <Typography variant="body1">{event.assignee.email}</Typography>
                </Box>
              )}

              <Box display="flex" gap={2} flexWrap="wrap" mt={4}>
                {(event.status === 'DRAFT' || event.status === 'PUBLISHED') && (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_EDIT(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleStartEventClick}
                      disabled={starting}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      {starting ? <CircularProgress size={24} /> : 'Start Event'}
                    </Button>
                  </>
                )}

                {event.status === 'ONGOING' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleViewTimer}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      View Timer
                    </Button>
                    <Button
                      variant="contained"
                      color="info"
                      onClick={() => window.open(ROUTES.EVENTS_TIMER_FULLSCREEN(event.id), '_blank')}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Full Screen Timer
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => window.open(ROUTES.EVENTS_INDIVIDUAL_TIMER(event.id), '_blank')}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Individual Timer
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_SCAN(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Scan QR Code
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_LEADERBOARD(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Leaderboard
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={stopping ? <CircularProgress size={20} /> : <StopIcon />}
                      onClick={handleStopEvent}
                      disabled={stopping}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      {stopping ? 'Stopping...' : 'Stop Event'}
                    </Button>
                  </>
                )}

                {(event.status === 'ONGOING' || event.status === 'COMPLETED') && (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_LEADERBOARD(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Leaderboard
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => router.push(ROUTES.EVENTS_QR_CODES(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      QR Codes
                    </Button>
                  </>
                )}

                {event.status === 'COMPLETED' && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => router.push(ROUTES.EVENTS_LEADERBOARD(event.id))}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      View Leaderboard
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={sendingWhatsApp ? <CircularProgress size={20} /> : <WhatsAppIcon />}
                      onClick={handleSendWhatsAppTimes}
                      disabled={sendingWhatsApp}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      {sendingWhatsApp ? 'Sending...' : 'Send Times via WhatsApp'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => router.push(`${ROUTES.NOTIFICATIONS}?eventId=${event.id}`)}
                      size={isMobile ? 'medium' : 'large'}
                    >
                      Send Notifications
                    </Button>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Excel Import Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CloudUploadIcon color="primary" />
                  <Typography variant="h6">
                    Import Competitors from Excel
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenRegisterDialog}
                  size={isMobile ? 'medium' : 'small'}
                >
                  Register Competitor Manually
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload an Excel file (.xlsx or .xls) to import competitors and register them to this event, or use the button above to register a competitor manually.
              </Typography>

              {/* Instructions Accordion */}
              <Accordion sx={{ mb: 3 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="instructions-content"
                  id="instructions-header"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <InfoIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      View Detailed Instructions
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon />
                      Excel File Format
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Your Excel file must follow this exact column structure. The first row is treated as a header and will be skipped.
                    </Typography>

                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Column</strong></TableCell>
                            <TableCell><strong>Field</strong></TableCell>
                            <TableCell><strong>Required</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell><strong>Example</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>A</strong></TableCell>
                            <TableCell>First Name</TableCell>
                            <TableCell><Chip label="Required" color="error" size="small" /></TableCell>
                            <TableCell>Competitor's first name</TableCell>
                            <TableCell>John</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>B</strong></TableCell>
                            <TableCell>Last Name</TableCell>
                            <TableCell><Chip label="Required" color="error" size="small" /></TableCell>
                            <TableCell>Competitor's last name</TableCell>
                            <TableCell>Doe</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>C</strong></TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                            <TableCell>Valid email address (recommended for duplicate detection)</TableCell>
                            <TableCell>john.doe@example.com</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>D</strong></TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                            <TableCell>Phone number</TableCell>
                            <TableCell>+1234567890</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>E</strong></TableCell>
                            <TableCell>Event ID</TableCell>
                            <TableCell><Chip label="Optional*" color="warning" size="small" /></TableCell>
                            <TableCell>Event ID (defaults to current event if not provided)</TableCell>
                            <TableCell>1</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>F</strong></TableCell>
                            <TableCell>Category Name/ID</TableCell>
                            <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                            <TableCell>Category name (text) or Category ID (number). Must exist in the event.</TableCell>
                            <TableCell>Men's Elite or 2</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>G</strong></TableCell>
                            <TableCell>Sequential Number</TableCell>
                            <TableCell><Chip label="Optional" color="default" size="small" /></TableCell>
                            <TableCell>Competitor number to assign (must be unique). Auto-assigned if empty.</TableCell>
                            <TableCell>101</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>
                      Example Excel File
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>First Name</strong></TableCell>
                            <TableCell><strong>Last Name</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Phone</strong></TableCell>
                            <TableCell><strong>Event ID</strong></TableCell>
                            <TableCell><strong>Category Name/ID</strong></TableCell>
                            <TableCell><strong>Sequential Number</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>John</TableCell>
                            <TableCell>Doe</TableCell>
                            <TableCell>john.doe@example.com</TableCell>
                            <TableCell>+1234567890</TableCell>
                            <TableCell>1</TableCell>
                            <TableCell>Men's Elite</TableCell>
                            <TableCell>101</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Jane</TableCell>
                            <TableCell>Smith</TableCell>
                            <TableCell>jane.smith@example.com</TableCell>
                            <TableCell>+0987654321</TableCell>
                            <TableCell>1</TableCell>
                            <TableCell>Women's Elite</TableCell>
                            <TableCell>201</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Bob</TableCell>
                            <TableCell>Johnson</TableCell>
                            <TableCell></TableCell>
                            <TableCell>+1122334455</TableCell>
                            <TableCell>2</TableCell>
                            <TableCell>3</TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>
                      Important Notes
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                      <li>
                        <Typography variant="body2" component="span">
                          <strong>Header Row:</strong> The first row is treated as a header and will be skipped.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          <strong>Category Column (F):</strong> If you provide a number (e.g., 2), it will be treated as a Category ID. If you provide text (e.g., "Men's Elite"), it will be treated as a Category Name and looked up. The category must exist in the target event.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          <strong>Sequential Number (G):</strong> Must be a positive integer (greater than 0) and unique within the event. If not provided, a sequential number will be auto-assigned automatically.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          <strong>Email Matching:</strong> If a competitor with the same email already exists, the existing competitor will be updated. If no email is provided, a new competitor will always be created.
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          <strong>File Requirements:</strong> Format: .xlsx or .xls | Maximum size: 10MB
                        </Typography>
                      </li>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>
                      Best Practices
                    </Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <li>
                        <Typography variant="body2" component="span">
                          Always include email addresses to help prevent duplicate competitors
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          Verify category names match exactly (including capitalization)
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          If assigning custom sequential numbers, ensure they're unique
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          Test with a small file (5-10 rows) first to verify the format
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2" component="span">
                          Keep a backup of your original Excel file before importing
                        </Typography>
                      </li>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ mb: 2 }}>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="excel-upload-input"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="excel-upload-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    disabled={uploading}
                    size={isMobile ? 'medium' : 'large'}
                    sx={{ mb: 2 }}
                  >
                    {uploading ? 'Uploading...' : 'Choose Excel File'}
                  </Button>
                </label>
              </Box>

              {uploadResult && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Import Results:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={`Total: ${uploadResult.total}`}
                      color="default"
                      variant="outlined"
                    />
                    <Chip
                      label={`Created: ${uploadResult.created}`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      label={`Updated: ${uploadResult.updated}`}
                      color="info"
                      variant="outlined"
                    />
                    <Chip
                      label={`Skipped: ${uploadResult.skipped}`}
                      color="warning"
                      variant="outlined"
                    />
                    {uploadResult.failed > 0 && (
                      <Chip
                        label={`Failed: ${uploadResult.failed}`}
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {uploadResult.errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Errors:
                      </Typography>
                      <Box component="ul" sx={{ mb: 0, pl: 2 }}>
                        {uploadResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>
                            <Typography variant="body2">{error}</Typography>
                          </li>
                        ))}
                        {uploadResult.errors.length > 10 && (
                          <li>
                            <Typography variant="body2" color="text.secondary">
                              ... and {uploadResult.errors.length - 10} more error(s)
                            </Typography>
                          </li>
                        )}
                      </Box>
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Competitors List Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
                <Typography variant="h6">
                  Registered Competitors ({competitors.length})
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenRegisterDialog}
                    size={isMobile ? 'medium' : 'small'}
                    sx={{ 
                      minWidth: { xs: '100%', sm: 'auto' },
                      order: { xs: 1, sm: 0 }
                    }}
                  >
                    Register Competitor
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={exportingExcel ? <CircularProgress size={20} /> : <FileDownloadIcon />}
                    onClick={handleExportToExcel}
                    disabled={exportingExcel || loadingCompetitors || competitors.length === 0}
                    size={isMobile ? 'medium' : 'small'}
                    title={competitors.length === 0 ? 'No competitors to export' : 'Download competitors list as Excel'}
                  >
                    {exportingExcel ? 'Exporting...' : 'Download Excel'}
                  </Button>
                  {selectedCompetitors.length > 0 && (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteSelected}
                      disabled={deleting}
                      size={isMobile ? 'medium' : 'small'}
                    >
                      {deleting ? 'Deleting...' : `Delete Selected (${selectedCompetitors.length})`}
                    </Button>
                  )}
                </Box>
              </Box>

              {loadingCompetitors ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : competitors.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No competitors registered for this event yet.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use "Register Competitor" button above to add competitors, or import from Excel.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={competitors.length > 0 && selectedCompetitors.length === competitors.length}
                            indeterminate={selectedCompetitors.length > 0 && selectedCompetitors.length < competitors.length}
                            onChange={handleSelectAll}
                          />
                        </TableCell>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {competitors.map((competitor) => (
                        <TableRow key={competitor.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedCompetitors.includes(competitor.id)}
                              onChange={() => handleSelectCompetitor(competitor.id)}
                            />
                          </TableCell>
                          <TableCell>
                            {editingSequentialNumber === competitor.id ? (
                              <TextField
                                type="number"
                                value={sequentialNumberValue}
                                onChange={(e) => setSequentialNumberValue(e.target.value)}
                                onBlur={() => handleCancelEditSequentialNumber()}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveSequentialNumber(competitor.id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditSequentialNumber();
                                  }
                                }}
                                autoFocus
                                size="small"
                                inputProps={{
                                  min: 1,
                                  style: { textAlign: 'center', width: '60px' },
                                }}
                                sx={{ width: '80px' }}
                                disabled={updatingSequentialNumber === competitor.id}
                              />
                            ) : (
                              <Box
                                onClick={() => handleStartEditSequentialNumber(competitor.id, competitor.sequentialNumber)}
                                sx={{
                                  cursor: 'pointer',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  '&:hover': {
                                    backgroundColor: 'action.hover',
                                  },
                                  display: 'inline-block',
                                  minWidth: '40px',
                                  textAlign: 'center',
                                }}
                                title="Click to edit sequential number"
                              >
                                {competitor.sequentialNumber || '-'}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {competitor.competitor.firstName} {competitor.competitor.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {competitor.competitor.email || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {competitor.competitor.phone || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {competitor.category ? (
                              <Chip label={competitor.category.name} size="small" color="primary" variant="outlined" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete ${competitor.competitor.firstName} ${competitor.competitor.lastName} from this event?`)) {
                                  try {
                                    await eventCompetitorService.delete(competitor.id);
                                    showToast('Competitor deleted successfully', 'success');
                                    await loadCompetitors();
                                    await loadEvent();
                                  } catch (err: any) {
                                    const errorMessage =
                                      err.response?.data?.message || err.message || 'Failed to delete competitor.';
                                    showToast(errorMessage, 'error');
                                  }
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Timer Type Selection Dialog */}
          <Dialog
            open={timerTypeDialogOpen}
            onClose={() => !starting && setTimerTypeDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Select Timer Type</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Choose how competitors will be timed for this event:
              </Typography>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={selectedTimerType}
                  onChange={(e) => setSelectedTimerType(e.target.value as 'collective' | 'individual')}
                >
                  <FormControlLabel
                    value="collective"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          Collective Timer
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          All competitors start at the same time when the event begins. Use the traditional full-screen timer view.
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 2, alignItems: 'flex-start' }}
                  />
                  <FormControlLabel
                    value="individual"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          Individual Timer
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Each competitor starts individually. Enter competitor numbers to start and finish timers separately.
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: 'flex-start' }}
                  />
                </RadioGroup>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setTimerTypeDialogOpen(false)}
                disabled={starting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartEvent}
                variant="contained"
                disabled={starting}
                startIcon={starting ? <CircularProgress size={20} /> : null}
              >
                {starting ? 'Starting...' : 'Start Event'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Register Competitor Dialog */}
          <Dialog
            open={registerDialogOpen}
            onClose={handleCloseRegisterDialog}
            maxWidth="sm"
            fullWidth
            disableEnforceFocus={false}
            disableAutoFocus={false}
          >
            <DialogTitle>Register New Competitor</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={competitorFormData.firstName}
                  onChange={(e) =>
                    setCompetitorFormData({ ...competitorFormData, firstName: e.target.value })
                  }
                  required
                  disabled={registering}
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  value={competitorFormData.lastName}
                  onChange={(e) =>
                    setCompetitorFormData({ ...competitorFormData, lastName: e.target.value })
                  }
                  required
                  disabled={registering}
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={competitorFormData.email}
                  onChange={(e) =>
                    setCompetitorFormData({ ...competitorFormData, email: e.target.value })
                  }
                  disabled={registering}
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={competitorFormData.phone}
                  onChange={(e) =>
                    setCompetitorFormData({ ...competitorFormData, phone: e.target.value })
                  }
                  required
                  disabled={registering}
                />
                <FormControl fullWidth required disabled={registering || loadingCategories}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={competitorFormData.categoryId || ''}
                    onChange={(e) =>
                      setCompetitorFormData({
                        ...competitorFormData,
                        categoryId: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    label="Category"
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Sequential Number"
                  type="number"
                  value={competitorFormData.sequentialNumber || ''}
                  onChange={(e) =>
                    setCompetitorFormData({
                      ...competitorFormData,
                      sequentialNumber: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  disabled={registering}
                  inputProps={{ min: 1 }}
                  helperText="Optional: Leave empty to auto-assign the next available number"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseRegisterDialog} disabled={registering}>
                Cancel
              </Button>
              <Button
                onClick={handleRegisterCompetitor}
                variant="contained"
                disabled={registering || !competitorFormData.firstName.trim() || !competitorFormData.lastName.trim() || !competitorFormData.phone?.trim() || !competitorFormData.categoryId}
                startIcon={registering ? <CircularProgress size={20} /> : null}
              >
                {registering ? 'Registering...' : 'Register Competitor'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

