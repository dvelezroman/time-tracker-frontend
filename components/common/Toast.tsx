'use client';

import { Snackbar, Alert, AlertColor } from '@mui/material';
import { useState, useCallback, useEffect } from 'react';

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

let toastListeners: ((state: ToastState) => void)[] = [];

export function showToast(message: string, severity: AlertColor = 'info') {
  toastListeners.forEach((listener) => {
    listener({ open: true, message, severity });
  });
}

export function Toast() {
  const [state, setState] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    const listener = (newState: ToastState) => {
      setState(newState);
    };
    toastListeners.push(listener);

    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <Snackbar
      open={state.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={state.severity} sx={{ width: '100%' }}>
        {state.message}
      </Alert>
    </Snackbar>
  );
}
