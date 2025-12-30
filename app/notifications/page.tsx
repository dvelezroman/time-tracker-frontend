'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Container,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Chip,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormHelperText,
  Divider,
} from '@mui/material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  notificationsService,
  NotificationTemplate,
  Competitor,
  SendNotificationsRequest,
} from '@/lib/api/services/notifications.service';
import { eventService, Event } from '@/lib/api/services/event.service';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n/useTranslation';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function NotificationsPageContent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | ''>('');
  const [notificationType, setNotificationType] = useState<'EMAIL' | 'WHATSAPP'>('EMAIL');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<number[]>([]);
  const [previewMessage, setPreviewMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
    loadTemplates();
  }, []);

  useEffect(() => {
    // Check for eventId in URL params
    const eventIdParam = searchParams.get('eventId');
    if (eventIdParam) {
      const eventId = parseInt(eventIdParam, 10);
      if (!isNaN(eventId)) {
        setSelectedEventId(eventId);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedEventId) {
      loadCompetitors();
    } else {
      setCompetitors([]);
      setSelectedCompetitorIds([]);
    }
  }, [selectedEventId]);

  useEffect(() => {
    updatePreview();
  }, [selectedTemplate, customMessage, selectedEventId, notificationType]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await eventService.getAll({ limit: 1000, timezone });
      console.log('Events API response:', response);
      console.log('Events data:', response.data);
      // Filter to only show COMPLETED or ONGOING events
      const filteredEvents = response.data.filter(
        (e) => e.status === 'COMPLETED' || e.status === 'ONGOING',
      );
      console.log('Filtered events:', filteredEvents);
      setEvents(filteredEvents);
      if (filteredEvents.length === 0) {
        setError(t('notifications.noCOMPLETEDorONGOING'));
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t('notifications.failedToLoadEvents');
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await notificationsService.getTemplates();
      setTemplates(data);
    } catch (err: any) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadCompetitors = async () => {
    if (!selectedEventId) return;

    try {
      setLoadingCompetitors(true);
      const data = await notificationsService.getEventCompetitors(Number(selectedEventId));
      setCompetitors(data);
      // Select all competitors by default
      setSelectedCompetitorIds(data.map((c) => c.id));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || t('notifications.failedToLoadCompetitors');
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoadingCompetitors(false);
    }
  };

  const updatePreview = () => {
    if (!selectedEventId || competitors.length === 0) {
      setPreviewMessage('');
      return;
    }

    const event = events.find((e) => e.id === Number(selectedEventId));
    if (!event) return;

    const sampleCompetitor = competitors[0];
    if (!sampleCompetitor) return;

    let message = '';

    const eventDate = event.startDateLocal
      ? format(new Date(event.startDateLocal), 'PPpp')
      : format(new Date(event.startDate), 'PPpp');

    if (customMessage) {
      message = customMessage
        .replace(/{competitorName}/g, `${sampleCompetitor.firstName} ${sampleCompetitor.lastName}`)
        .replace(/{eventName}/g, event.name)
        .replace(/{sequentialNumber}/g, sampleCompetitor.sequentialNumber ? `#${sampleCompetitor.sequentialNumber}` : 'N/A')
        .replace(/{category}/g, sampleCompetitor.category || 'N/A')
        .replace(/{time}/g, sampleCompetitor.time || 'N/A')
        .replace(/{eventDate}/g, eventDate)
        .replace(/{eventLocation}/g, event.location || 'N/A');
    } else if (selectedTemplate === 'registration') {
      message = `Hello ${sampleCompetitor.firstName} ${sampleCompetitor.lastName}, you have been successfully registered for ${event.name}.${sampleCompetitor.sequentialNumber ? ` Your registration number is #${sampleCompetitor.sequentialNumber}.` : ''}${sampleCompetitor.category ? ` Category: ${sampleCompetitor.category}.` : ''} Event Date: ${eventDate}.`;
    } else if (selectedTemplate === 'finish_time') {
      if (sampleCompetitor.hasFinished && sampleCompetitor.time) {
        message = `Congratulations ${sampleCompetitor.firstName} ${sampleCompetitor.lastName}! You completed ${event.name} with a time of ${sampleCompetitor.time}.`;
      } else {
        message = `Hello ${sampleCompetitor.firstName} ${sampleCompetitor.lastName}, you did not complete the event ${event.name}.`;
      }
    } else if (selectedTemplate) {
      // Other templates
      message = `Preview for template: ${selectedTemplate}`;
    } else {
      message = '';
    }

    setPreviewMessage(message);
  };

  const handleSend = async () => {
    if (!selectedEventId) {
      setError(t('notifications.selectEventError'));
      return;
    }

    if (!selectedTemplate && !customMessage) {
      setError(t('notifications.selectTemplateOrMessage'));
      return;
    }

    if (selectedCompetitorIds.length === 0) {
      setError(t('notifications.selectAtLeastOneCompetitor'));
      return;
    }

    try {
      setSending(true);
      setError('');

      const request: SendNotificationsRequest = {
        eventId: Number(selectedEventId),
        type: notificationType,
        template: selectedTemplate || undefined,
        customMessage: customMessage || undefined,
        competitorIds: selectedCompetitorIds.length === competitors.length ? undefined : selectedCompetitorIds,
      };

      const result = await notificationsService.sendNotifications(request);
      showToast(
        t('notifications.notificationsQueued', { queued: result.queued, skipped: result.skipped }),
        'success',
      );

      // Reset form
      setSelectedTemplate('');
      setCustomMessage('');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t('notifications.failedToSend');
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSelectAllCompetitors = () => {
    if (selectedCompetitorIds.length === competitors.length) {
      setSelectedCompetitorIds([]);
    } else {
      setSelectedCompetitorIds(competitors.map((c) => c.id));
    }
  };

  const selectedEvent = events.find((e) => e.id === Number(selectedEventId));
  const availableCompetitors = competitors.filter(
    (c) => (notificationType === 'EMAIL' && c.email) || (notificationType === 'WHATSAPP' && c.phone),
  );

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
      <MainLayout>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              gutterBottom
              sx={{
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                mb: { xs: 2, sm: 3 },
              }}
            >
              {t('notifications.title')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Event Selection */}
                  <FormControl fullWidth>
                    <InputLabel>{t('notifications.selectEvent')}</InputLabel>
                    <Select
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value as number | '')}
                      label={t('notifications.selectEvent')}
                      disabled={loading}
                      displayEmpty
                    >
                      {loading ? (
                        <MenuItem disabled>
                          <CircularProgress size={16} sx={{ mr: 1 }} />
                          {t('notifications.loadingEvents')}
                        </MenuItem>
                      ) : events.length === 0 ? (
                        <MenuItem disabled>{t('notifications.noEventsAvailable')}</MenuItem>
                      ) : (
                        events.map((event) => (
                          <MenuItem key={event.id} value={event.id}>
                            {event.name} ({event.status})
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {!loading && events.length === 0 && (
                      <FormHelperText>
                        {t('notifications.noCOMPLETEDorONGOING')}
                      </FormHelperText>
                    )}
                  </FormControl>

                  {/* Notification Type */}
                  <FormControl fullWidth>
                    <InputLabel>{t('notifications.notificationType')}</InputLabel>
                    <Select
                      value={notificationType}
                      onChange={(e) => setNotificationType(e.target.value as 'EMAIL' | 'WHATSAPP')}
                      label={t('notifications.notificationType')}
                    >
                      <MenuItem value="EMAIL">{t('notifications.email')}</MenuItem>
                      <MenuItem value="WHATSAPP">{t('notifications.whatsapp')}</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Competitors Selection */}
                  {selectedEventId && (
                    <>
                      {loadingCompetitors ? (
                        <Box display="flex" justifyContent="center" py={2}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <FormControl fullWidth>
                          <InputLabel>{t('notifications.selectCompetitors')}</InputLabel>
                          <Select
                            multiple
                            value={selectedCompetitorIds}
                            onChange={(e) =>
                              setSelectedCompetitorIds(e.target.value as number[])
                            }
                            input={<OutlinedInput label={t('notifications.selectCompetitors')} />}
                            renderValue={(selected) => {
                              if (selected.length === 0) return t('notifications.noneSelected');
                              if (selected.length === competitors.length) return t('notifications.allCompetitors');
                              return t('notifications.competitorsSelected', { count: selected.length });
                            }}
                            MenuProps={MenuProps}
                          >
                            <MenuItem onClick={handleSelectAllCompetitors}>
                              <Checkbox
                                checked={selectedCompetitorIds.length === competitors.length}
                                indeterminate={
                                  selectedCompetitorIds.length > 0 &&
                                  selectedCompetitorIds.length < competitors.length
                                }
                              />
                              <ListItemText primary={t('notifications.selectAll')} />
                            </MenuItem>
                            <Divider />
                            {competitors.map((competitor) => {
                              const hasContact =
                                (notificationType === 'EMAIL' && competitor.email) ||
                                (notificationType === 'WHATSAPP' && competitor.phone);
                              return (
                                <MenuItem
                                  key={competitor.id}
                                  value={competitor.id}
                                  disabled={!hasContact}
                                >
                                  <Checkbox checked={selectedCompetitorIds.includes(competitor.id)} />
                                  <ListItemText
                                    primary={`${competitor.firstName} ${competitor.lastName}`}
                                    secondary={
                                      !hasContact
                                        ? t('notifications.noContact', { type: notificationType === 'EMAIL' ? 'email' : 'phone' })
                                        : competitor.sequentialNumber
                                          ? `#${competitor.sequentialNumber}`
                                          : undefined
                                    }
                                  />
                                </MenuItem>
                              );
                            })}
                          </Select>
                          <FormHelperText>
                            {t('notifications.competitorsWithContact', { 
                              count: availableCompetitors.length,
                              type: notificationType === 'EMAIL' ? 'email' : 'phone'
                            })}
                          </FormHelperText>
                        </FormControl>
                      )}
                    </>
                  )}

                  <Divider />

                  {/* Template Selection */}
                  <FormControl fullWidth>
                    <InputLabel>{t('notifications.template')}</InputLabel>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => {
                        setSelectedTemplate(e.target.value);
                        setCustomMessage('');
                      }}
                      label={t('notifications.template')}
                    >
                      <MenuItem value="">{t('notifications.noneUseCustomMessage')}</MenuItem>
                      {templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name} - {template.description}
                        </MenuItem>
                      ))}
                    </Select>
                    {selectedTemplate && (
                      <FormHelperText>
                        {t('notifications.availableVariables', {
                          variables: templates
                            .find((t) => t.id === selectedTemplate)
                            ?.variables.join(', ') || ''
                        })}
                      </FormHelperText>
                    )}
                  </FormControl>

                  {/* Custom Message */}
                  <TextField
                    label={t('notifications.customMessage')}
                    multiline
                    rows={4}
                    value={customMessage}
                    onChange={(e) => {
                      setCustomMessage(e.target.value);
                      setSelectedTemplate('');
                    }}
                    placeholder={t('notifications.customMessagePlaceholder')}
                    helperText={t('notifications.leaveEmptyForTemplate')}
                    disabled={!!selectedTemplate}
                  />

                  {/* Preview */}
                  {previewMessage && (
                    <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          {t('notifications.preview')}:
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                          {previewMessage}
                        </Typography>
                      </CardContent>
                    </Card>
                  )}

                  {/* Send Button */}
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleSend}
                    disabled={sending || !selectedEventId || selectedCompetitorIds.length === 0}
                    startIcon={sending ? <CircularProgress size={20} /> : null}
                    fullWidth={isMobile}
                  >
                    {sending ? t('notifications.sending') : t('notifications.sendNotifications')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    }>
      <NotificationsPageContent />
    </Suspense>
  );
}
