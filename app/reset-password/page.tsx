'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { authService } from '@/lib/api/services/auth.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { Loading } from '@/components/common/Loading';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const validateForm = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      showToast('Password reset successfully! Redirecting to login...', 'success');
      setTimeout(() => {
        router.push(ROUTES.LOGIN);
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)'
              : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
          padding: isMobile ? 2 : 4,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: isMobile ? '100%' : 440,
            borderRadius: 3,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                : '0 8px 32px rgba(25, 118, 210, 0.2)',
          }}
        >
          <CardContent sx={{ padding: isMobile ? 3 : 4, textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Password reset successfully! Redirecting to login...
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)'
            : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
        padding: isMobile ? 2 : 4,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : 440,
          borderRadius: 3,
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(25, 118, 210, 0.2)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            padding: isMobile ? 3 : 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: 1,
              fontSize: isMobile ? '1.75rem' : '2rem',
            }}
          >
            Reset Password
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
            }}
          >
            Enter your new password
          </Typography>
        </Box>

        <CardContent sx={{ padding: isMobile ? 3 : 4 }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                      }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                      }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !token}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                fontSize: isMobile ? '0.9375rem' : '1rem',
                fontWeight: 600,
                textTransform: 'none',
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                    : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                '&:hover': {
                  background:
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                      : 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                },
                '&:disabled': {
                  background: theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0',
                },
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loading fullScreen message="Loading..." />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

