'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  useTheme,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';
import { Email } from '@mui/icons-material';
import { authService } from '@/lib/api/services/auth.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
      showToast('Password reset link sent! Check your email.', 'success');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
            Forgot Password?
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
            }}
          >
            Enter your email to receive a reset link
          </Typography>
        </Box>

        <CardContent sx={{ padding: isMobile ? 3 : 4 }}>
          {success ? (
            <Box>
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                }}
              >
                If an account with that email exists, a password reset link has been sent. Please check
                your email.
              </Alert>
              <Button
                fullWidth
                variant="contained"
                onClick={() => router.push(ROUTES.LOGIN)}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
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
                }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <>
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
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  margin="normal"
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email
                          sx={{
                            color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                          }}
                        />
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
                  disabled={loading}
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
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                      fontSize: isMobile ? '0.8125rem' : '0.875rem',
                    }}
                  >
                    Remember your password?{' '}
                    <Link
                      href={ROUTES.LOGIN}
                      sx={{
                        color: theme.palette.primary.main,
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

