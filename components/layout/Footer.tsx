'use client';

import { Box, Container, Typography, Link } from '@mui/material';
import Image from 'next/image';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function Footer() {
  const { t } = useTranslation();
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {process.env.NEXT_PUBLIC_LOGO_URL && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: 30,
                position: 'relative',
                width: 100,
                mb: 1,
              }}
            >
              <Image
                src={process.env.NEXT_PUBLIC_LOGO_URL}
                alt="BitFlow Logo"
                fill
                style={{ objectFit: 'contain' }}
              />
            </Box>
          )}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, mb: 1 }}
          >
            {'© '}
            <Link color="inherit" href="/">
              Time Tracker
            </Link>{' '}
            {new Date().getFullYear()}
            {'. All rights reserved.'}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            align="center"
            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            {t('landing.developedBy')}{' '}
            <Link 
              href="https://bitflow.com" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ fontWeight: 500 }}
            >
              BitFlow
            </Link>
            {' - '}{t('landing.softwareFactory')}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
