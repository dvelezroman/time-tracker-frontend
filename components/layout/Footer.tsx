'use client';

import { Box, Container, Typography, Link } from '@mui/material';

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
      </Container>
    </Box>
  );
}
