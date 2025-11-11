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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Phone,
  Person,
} from '@mui/icons-material';
import { authService } from '@/lib/api/services/auth.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/lib/constants';

export default function RegisterPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'OPERATOR' as 'ADMIN' | 'OPERATOR',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError('');
  };

  const handleRoleChange = (e: any) => {
    setFormData({ ...formData, role: e.target.value });
  };

  const validateForm = () => {
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);
      setAuth(response.user, response.token);
      router.push(ROUTES.DASHBOARD);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
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
          maxWidth: isMobile ? '100%' : 500,
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
            Create Account
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.875rem' : '1rem',
            }}
          >
            Sign up to get started with Time Tracker
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
              value={formData.email}
              onChange={handleChange('email')}
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

            <FormControl
              fullWidth
              margin="normal"
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
            >
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={handleRoleChange}
                label="Role"
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <Person
                      sx={{
                        color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                      }}
                    />
                  </InputAdornment>
                }
              >
                <MenuItem value="OPERATOR">Operator</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Phone Number (Optional)"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              margin="normal"
              autoComplete="tel"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone
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
              value={formData.password}
              onChange={handleChange('password')}
              required
              margin="normal"
              autoComplete="new-password"
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

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              required
              margin="normal"
              autoComplete="new-password"
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#8b949e' : '#4a4a4a',
                  fontSize: isMobile ? '0.8125rem' : '0.875rem',
                }}
              >
                Already have an account?{' '}
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
        </CardContent>
      </Card>
    </Box>
  );
}

