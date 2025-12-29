'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Container, Typography, Box, Card, CardContent, CircularProgress } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { eventService } from '@/lib/api/services/event.service';
import { userService } from '@/lib/api/services/user.service';
import { timeEntryService } from '@/lib/api/services/time-entry.service';
import { eventCompetitorService } from '@/lib/api/services/event-competitor.service';
import { useAuthStore } from '@/store/useAuthStore';
import { ROUTES } from '@/lib/constants';
import { useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface DashboardStats {
  totalTime: number; // in seconds
  totalUsers: number; // For admin: total users, For operator: total competitors in their events
  totalEvents: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  // Use useMemo to ensure isAdmin is only calculated when user changes
  const isAdmin = useMemo(() => user?.role === 'ADMIN', [user?.role]);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalTime: 0,
    totalUsers: 0,
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load stats when user is loaded to ensure correct role check
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Ensure user is loaded before proceeding
      if (!user) {
        return;
      }
      
      // Double-check role to prevent operators from accessing user data
      const userRole = user.role;
      const isUserAdmin = userRole === 'ADMIN';
      
      // Fetch events (backend automatically filters by assignedTo for operators)
      let eventsResponse;
      try {
        eventsResponse = await eventService.getAll({ limit: 1000 });
      } catch (err: any) {
        console.error('Failed to fetch events:', err?.response?.status, err?.message);
        // If events fetch fails, we can't continue
        setStats({
          totalTime: 0,
          totalUsers: 0,
          totalEvents: 0,
        });
        return;
      }
      
      const allEvents = eventsResponse.data;
      
      let totalUsers = 0;
      
      // Only admins can fetch users - operators should never call GET /users
      if (isUserAdmin) {
        // For admin: fetch total users
        try {
          const users = await userService.getUsers();
          totalUsers = users.length;
        } catch (err: any) {
          console.error('Failed to fetch users (admin only):', err?.response?.status, err?.message);
          totalUsers = 0;
        }
      } else {
        // For operator: count total competitors in their assigned events
        // Operators should only use GET /event-competitors, never GET /users
        try {
          const competitorsResponse = await eventCompetitorService.getAll({ limit: 1000 });
          totalUsers = competitorsResponse.total || 0;
        } catch (err: any) {
          console.error('Failed to fetch competitors (operator):', err?.response?.status, err?.message);
          // If this fails, set to 0 - operators might not have any assigned events yet
          totalUsers = 0;
        }
      }

      // Calculate total time from time entries
      // Only process events that are ONGOING or COMPLETED
      let totalTimeSeconds = 0;
      const ongoingEvents = allEvents.filter(e => e.status === 'ONGOING' || e.status === 'COMPLETED');
      
      // Get time entries from leaderboards (limit to first 20 events to avoid too many requests)
      for (const event of ongoingEvents.slice(0, 20)) {
        try {
          const leaderboard = await timeEntryService.getLeaderboard(event.id);
          if (leaderboard.finished) {
            leaderboard.finished.forEach(entry => {
              if (entry.duration) {
                // Convert milliseconds to seconds
                totalTimeSeconds += Math.floor(entry.duration / 1000);
              }
            });
          }
        } catch (err: any) {
          // Ignore errors for individual events - might be 403 if operator doesn't have access
          if (err?.response?.status === 403) {
            console.warn(`Access denied to leaderboard for event ${event.id}`);
          }
        }
      }

      setStats({
        totalTime: totalTimeSeconds,
        totalUsers: totalUsers,
        totalEvents: eventsResponse.total || eventsResponse.data.length,
      });
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err?.response?.status, err?.message, err);
      // Set default stats on error
      setStats({
        totalTime: 0,
        totalUsers: 0,
        totalEvents: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return '0h';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              mb: { xs: 2, sm: 3 }
            }}
          >
            {t('dashboard.title')}
          </Typography>
          {loading || !user ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                mt: 4,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: isAdmin ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                  md: isAdmin ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                },
                gap: 3,
              }}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => router.push(ROUTES.EVENTS)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccessTimeIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">{t('dashboard.totalTime')}</Typography>
                      <Typography variant="h4">{formatTime(stats.totalTime)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              {/* Users card - Only show for ADMIN role, never for OPERATOR */}
              {/* Strict check: only render if role is exactly 'ADMIN' */}
              {user.role === 'ADMIN' && (
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => router.push(ROUTES.USERS)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6">{t('dashboard.totalUsers')}</Typography>
                        <Typography variant="h4">{stats.totalUsers}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
              
              {/* Competitors card - Only show for OPERATOR role, never for ADMIN */}
              {user.role === 'OPERATOR' && (
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => router.push(ROUTES.COMPETITORS)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6">{t('dashboard.totalCompetitors')}</Typography>
                        <Typography variant="h4">{stats.totalUsers}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => router.push(ROUTES.EVENTS)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EventIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">{t('dashboard.totalEvents')}</Typography>
                      <Typography variant="h4">{stats.totalEvents}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
