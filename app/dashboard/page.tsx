'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Container, Typography, Box, Card, CardContent, CircularProgress } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { eventService } from '@/lib/api/services/event.service';
import { userService } from '@/lib/api/services/user.service';
import { timeEntryService } from '@/lib/api/services/time-entry.service';

interface DashboardStats {
  totalTime: number; // in seconds
  totalUsers: number;
  totalEvents: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTime: 0,
    totalUsers: 0,
    totalEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [eventsResponse, users, allEvents] = await Promise.all([
        eventService.getAll({ limit: 1000 }),
        userService.getUsers(),
        eventService.getAll({ limit: 1000 }),
      ]);

      // Calculate total time from all time entries
      // We need to get time entries for all events
      let totalTimeSeconds = 0;
      
      // For each event, try to get leaderboard which includes time entries
      // Note: This is a simplified approach. In a real scenario, you'd want a dedicated stats endpoint
      const ongoingEvents = allEvents.data.filter(e => e.status === 'ONGOING' || e.status === 'COMPLETED');
      
      // Try to get time entries from leaderboards (this gives us finished times)
      for (const event of ongoingEvents.slice(0, 10)) { // Limit to first 10 to avoid too many requests
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
        } catch (err) {
          // Ignore errors for individual events
          console.warn(`Could not fetch leaderboard for event ${event.id}:`, err);
        }
      }

      setStats({
        totalTime: totalTimeSeconds,
        totalUsers: users.length,
        totalEvents: eventsResponse.total || eventsResponse.data.length,
      });
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
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
            Dashboard
          </Typography>
          {loading ? (
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
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AccessTimeIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">Total Time</Typography>
                      <Typography variant="h4">{formatTime(stats.totalTime)}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PeopleIcon color="secondary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">Users</Typography>
                      <Typography variant="h4">{stats.totalUsers}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EventIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h6">Events</Typography>
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
