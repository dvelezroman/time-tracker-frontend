'use client';

import { useState, useEffect } from 'react';
import { Typography, useTheme, useMediaQuery } from '@mui/material';

interface FullScreenTimerProps {
  startDate: string | Date;
}

export function FullScreenTimer({ startDate }: FullScreenTimerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(startDate).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsedTime = now - startTime;
      setElapsed(Math.max(0, elapsedTime));
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startDate]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Responsive font sizes optimized for large displays (TVs/monitors)
  // Uses viewport-based sizing for better scaling on large screens
  const fontSize = isMobile 
    ? 'clamp(3rem, 15vw, 6rem)' 
    : isTablet 
    ? 'clamp(5rem, 20vw, 10rem)' 
    : 'clamp(8rem, 25vw, 20rem)'; // Large screens: scales up to 20rem (320px) on very large displays

  return (
    <Typography
      component="div"
      sx={{
        fontFamily: 'monospace',
        fontWeight: 900, // Extra bold for better visibility from distance
        textAlign: 'center',
        fontSize: fontSize,
        lineHeight: 1.1, // Tighter line height for large displays
        letterSpacing: '0.02em', // Slight letter spacing for clarity
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000', // Pure colors for maximum contrast
        textShadow:
          theme.palette.mode === 'dark'
            ? '0 0 40px rgba(255, 255, 255, 0.5), 0 0 80px rgba(255, 255, 255, 0.3)' // Enhanced shadow for visibility
            : '0 4px 20px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 0, 0, 0.2)', // Stronger shadow for light mode
        transition: 'all 0.3s ease',
        userSelect: 'none',
        WebkitFontSmoothing: 'antialiased', // Better font rendering
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {formatTime(elapsed)}
    </Typography>
  );
}

