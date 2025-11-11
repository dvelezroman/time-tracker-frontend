'use client';

import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
  CircularProgress,
} from '@mui/material';

interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

export function Button({ loading, disabled, children, ...props }: ButtonProps) {
  return (
    <MuiButton disabled={disabled || loading} {...props}>
      {loading && <CircularProgress size={16} sx={{ mr: 1 }} />}
      {children}
    </MuiButton>
  );
}
