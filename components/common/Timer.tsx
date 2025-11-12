'use client';

import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

interface TimerProps {
  startDate: string | Date;
  className?: string;
}

export function Timer({ startDate, className }: TimerProps) {
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

  return (
    <Typography
      variant="h2"
      component="div"
      className={className}
      sx={{
        fontFamily: 'monospace',
        fontWeight: 'bold',
        textAlign: 'center',
      }}
    >
      {formatTime(elapsed)}
    </Typography>
  );
}

