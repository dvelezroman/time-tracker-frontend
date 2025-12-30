'use client';

import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { useUIStore } from '@/store/useUIStore';
import Image from 'next/image';

export function PublicHeader() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { themeMode, toggleTheme } = useUIStore();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          {process.env.NEXT_PUBLIC_LOGO_URL && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: 40,
                position: 'relative',
                width: { xs: 80, sm: 120 },
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
          )}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            Time Tracker
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageSwitcher />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

