'use client';

import { Box, Container, Typography, Link } from '@mui/material';
import Image from 'next/image';

export function Footer() {
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
          {process.env.NEXT_PUBLIC_BITFLOW_LOGO_URL && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: 30,
                position: 'relative',
                width: 100,
              }}
            >
              <Image
                src={process.env.NEXT_PUBLIC_BITFLOW_LOGO_URL}
                alt="Bitflow Logo"
                fill
                style={{ objectFit: 'contain' }}
              />
            </Box>
          )}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {'© '}
            <Link color="inherit" href="/">
              Time Tracker
            </Link>{' '}
            {new Date().getFullYear()}
            {'. All rights reserved.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
