'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Paper,
  Stack,
  Divider,
} from '@mui/material';
import {
  Timer as TimerIcon,
  QrCodeScanner as QrCodeIcon,
  Leaderboard as LeaderboardIcon,
  Notifications as NotificationsIcon,
  CloudUpload as UploadIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/lib/constants';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { PublicHeader } from '@/components/layout/PublicHeader';

export default function Home() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { isAuthenticated } = useAuthStore();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: <TimerIcon sx={{ fontSize: 40 }} />,
      title: 'Real-Time Tracking',
      description: 'Track competitor times with millisecond precision. Monitor events in real-time with live updates.',
    },
    {
      icon: <QrCodeIcon sx={{ fontSize: 40 }} />,
      title: 'QR Code Scanning',
      description: 'Quick and accurate finish time recording using QR codes. Scan and record in seconds.',
    },
    {
      icon: <LeaderboardIcon sx={{ fontSize: 40 }} />,
      title: 'Live Leaderboards',
      description: 'Automatically generated leaderboards with category rankings and real-time updates.',
    },
    {
      icon: <UploadIcon sx={{ fontSize: 40 }} />,
      title: 'Bulk Import',
      description: 'Import competitors from Excel files. Support for categories and custom competitor numbers.',
    },
    {
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      title: 'Multi-Channel Notifications',
      description: 'Send finish times via Email and WhatsApp. Automated notifications for competitors.',
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: 'Comprehensive Analytics',
      description: 'Detailed statistics, category rankings, and performance metrics for all events.',
    },
  ];

  const benefits = [
    'Millisecond precision timing',
    'Automatic QR code generation',
    'Category-based organization',
    'Real-time leaderboard updates',
    'Excel bulk import support',
    'Email & WhatsApp notifications',
    'Full-screen timer display',
    'Mobile-responsive design',
  ];

  const steps = [
    {
      number: '1',
      title: t('events.createEvent'),
      description: t('landing.features.eventManagement.description'),
    },
    {
      number: '2',
      title: t('competitors.title'),
      description: t('landing.features.qrCodeGeneration.description'),
    },
    {
      number: '3',
      title: t('events.startEvent'),
      description: t('landing.features.realTimeTracking.description'),
    },
    {
      number: '4',
      title: t('leaderboard.title'),
      description: t('landing.features.liveLeaderboards.description'),
    },
  ];

  return (
    <>
      <PublicHeader />
      <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)'
          : 'linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%)',
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 8, md: 12 } }}>
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 8, md: 12 },
          }}
        >
          {process.env.NEXT_PUBLIC_LOGO_URL && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 4,
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 60, sm: 80, md: 100 },
                  width: { xs: 200, sm: 250, md: 300 },
                }}
              >
                <Image
                  src={process.env.NEXT_PUBLIC_LOGO_URL}
                  alt="BitFlow Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </Box>
            </Box>
          )}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5.5rem' },
              fontWeight: 800,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            {t('landing.subtitle')}
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              maxWidth: '800px',
              mx: 'auto',
              mb: 4,
              lineHeight: 1.6,
            }}
          >
            {t('landing.description')}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 6 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push(ROUTES.REGISTER)}
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a91 100%)',
                },
              }}
            >
              {t('landing.getStartedFree')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push(ROUTES.LOGIN)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              {t('landing.signIn')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push(ROUTES.LOOKUP)}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              {t('landing.checkYourTime')}
            </Button>
          </Stack>

          {/* Stats */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 4,
              mt: 8,
              mb: 4,
            }}
          >
            <Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <SpeedIcon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                    }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: 'primary.main',
                    mb: 0.5,
                  }}
                >
                  {t('landing.fast')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.fastDescription')}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <SecurityIcon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                    }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: 'primary.main',
                    mb: 0.5,
                  }}
                >
                  {t('landing.secure')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.secureDescription')}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <CheckCircleIcon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                    }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: 'primary.main',
                    mb: 0.5,
                  }}
                >
                  {t('landing.accurate')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.accurateDescription')}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1,
                  }}
                >
                  <AnalyticsIcon
                    sx={{
                      fontSize: 48,
                      color: 'primary.main',
                    }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color: 'primary.main',
                    mb: 0.5,
                  }}
                >
                  {t('landing.complete')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.completeDescription')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: { xs: 8, md: 12 } }}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('landing.powerfulFeatures')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}
          >
            {t('landing.featuresSubtitle')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 4,
            }}
          >
            {features.map((feature, index) => (
              <Box key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 12px 40px rgba(102, 126, 234, 0.3)'
                        : '0 12px 40px rgba(102, 126, 234, 0.2)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        color: 'primary.main',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(102, 126, 234, 0.1)'
                          : 'rgba(102, 126, 234, 0.05)',
                        mx: 'auto',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom textAlign="center">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>

        {/* How It Works Section */}
        <Box sx={{ mb: { xs: 8, md: 12 } }}>
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('landing.howItWorks')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}
          >
            {t('landing.howItWorksSubtitle')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 4,
            }}
          >
            {steps.map((step, index) => (
              <Box key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    height: '100%',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(102, 126, 234, 0.05)'
                      : 'rgba(102, 126, 234, 0.02)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)'}`,
                    borderRadius: 2,
                    position: 'relative',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                    }}
                  >
                    {step.number}
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ mt: 3, mb: 2 }}
                    color="primary"
                  >
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Benefits Section */}
        <Box
          sx={{
            mb: { xs: 8, md: 12 },
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: 4,
            p: { xs: 4, md: 6 },
          }}
        >
          <Typography
            variant="h2"
            component="h2"
            textAlign="center"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('landing.whyChoose')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
              mt: 4,
            }}
          >
            {benefits.map((benefit, index) => (
              <Box key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCircleIcon color="primary" />
                  <Typography variant="body1" fontWeight="medium">
                    {benefit}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            textAlign: 'center',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: 4,
            p: { xs: 4, md: 8 },
            mb: 6,
          }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 700,
              mb: 2,
            }}
          >
            {t('landing.readyToGetStarted')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}
          >
            {t('landing.readySubtitle')}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push(ROUTES.REGISTER)}
              endIcon={<ArrowForwardIcon />}
              sx={{
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a91 100%)',
                },
              }}
            >
              {t('landing.createFreeAccount')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push(ROUTES.LOGIN)}
              sx={{
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              {t('landing.signInToExisting')}
            </Button>
          </Stack>
        </Box>

        {/* Developed by BitFlow Section */}
        {process.env.NEXT_PUBLIC_LOGO_URL && (
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 4, md: 6 },
              borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              mt: 4,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              {t('landing.developedBy')}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 40, sm: 50 },
                  width: { xs: 120, sm: 150 },
                }}
              >
                <Image
                  src={process.env.NEXT_PUBLIC_LOGO_URL}
                  alt="BitFlow Logo"
                  fill
                  style={{ objectFit: 'contain' }}
                />
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {t('landing.softwareFactory')}
              </Typography>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
    </>
  );
}
