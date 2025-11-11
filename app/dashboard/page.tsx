'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Container, Typography, Box, Card, CardContent } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
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
                    <Typography variant="h4">0h</Typography>
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
                    <Typography variant="h4">0</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DashboardIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h6">Projects</Typography>
                    <Typography variant="h4">0</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}
