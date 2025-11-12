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
  InputAdornment,
  IconButton,
  Link,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Login failed. Please try again.';
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
        background: theme.palette.mode === 'dark'
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
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(25, 118, 210, 0.2)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
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
            Welcome Back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
            }}
          >
            Sign in to your account to continue
          </Typography>
        </Box>

        <CardContent sx={{ padding: isMobile ? 3 : 4 }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                },
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
              autoComplete="email"
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
                '& .MuiInputLabel-root': {
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="current-password"
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
                '& .MuiInputLabel-root': {
                  fontSize: isMobile ? '0.875rem' : '0.9375rem',
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
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                  : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                    : 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                },
                '&:disabled': {
                  background: theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0',
                },
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                  fontSize: isMobile ? '0.8125rem' : '0.875rem',
                  mb: 1,
                }}
              >
                Don't have an account?{' '}
                <Link
                  href={ROUTES.REGISTER}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign up
                </Link>
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                  fontSize: isMobile ? '0.8125rem' : '0.875rem',
                }}
              >
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot your password?
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
