'use client';

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';

interface FullScreenTimerProps {
  startDate: string | Date;
  /** High-contrast venue / TV styling */
  variant?: 'default' | 'tv';
}

export function FullScreenTimer({ startDate, variant = 'default' }: FullScreenTimerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef<number | null>(null);
  const isTv = variant === 'tv';

  useEffect(() => {
    const startTime = new Date(startDate).getTime();

    const tick = () => {
      const wall = Date.now();
      const elapsedTime = Math.max(0, wall - startTime);
      setElapsed(elapsedTime);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [startDate]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const tenth = Math.floor((elapsed % 1000) / 100);

  const main = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const fontSize = isMobile
    ? 'clamp(3rem, 15vw, 6rem)'
    : isTablet
      ? 'clamp(4rem, 12vw, 8rem)'
      : 'clamp(4rem, 10vw, 12rem)';

  if (isTv) {
    return (
      <Typography
        component="div"
        sx={{
          fontFamily: 'monospace',
          fontWeight: 900,
          textAlign: 'center',
          fontSize,
          lineHeight: 1.05,
          letterSpacing: '0.04em',
          color: '#39ff14',
          textShadow: '0 0 24px rgba(57, 255, 20, 0.55), 0 0 60px rgba(57, 255, 20, 0.35)',
          userSelect: 'none',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        <Box component="span">{main}</Box>
        <Box component="span" sx={{ fontSize: '0.45em', opacity: 0.95, ml: 0.5 }}>
          .{tenth}
        </Box>
      </Typography>
    );
  }

  return (
    <Typography
      component="div"
      sx={{
        fontFamily: 'monospace',
        fontWeight: 900,
        textAlign: 'center',
        fontSize,
        lineHeight: 1.1,
        letterSpacing: '0.02em',
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
        textShadow:
          theme.palette.mode === 'dark'
            ? '0 0 40px rgba(255, 255, 255, 0.5), 0 0 80px rgba(255, 255, 255, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease',
        userSelect: 'none',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        maxWidth: '100%',
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}
    >
      <Box component="span">{main}</Box>
      <Box component="span" sx={{ fontSize: '0.42em', opacity: 0.85, ml: 0.5 }}>
        .{tenth}
      </Box>
    </Typography>
  );
}