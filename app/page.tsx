'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Box, Button } from '@mui/material';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/lib/constants';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: { xs: 2, sm: 3, md: 4 },
          py: { xs: 4, sm: 6, md: 8 },
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom
          sx={{ fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' } }}
        >
          Welcome to Time Tracker
        </Typography>
        <Typography 
          variant="h5" 
          color="text.secondary" 
          paragraph
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } }}
        >
          Manage your time efficiently
        </Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            mt: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            '& .MuiButton-root': {
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: '100%', sm: 120 },
            }
          }}
        >
          <Button variant="contained" size="large" onClick={() => router.push(ROUTES.LOGIN)}>
            Login
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.push(ROUTES.REGISTER)}>
            Register
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
