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
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Time Tracker
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Manage your time efficiently
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
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
