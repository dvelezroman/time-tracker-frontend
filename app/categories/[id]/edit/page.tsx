'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  useTheme,
  useMediaQuery,
  Container,
  CircularProgress,
} from '@mui/material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import {
  categoryService,
  UpdateCategoryRequest,
  Category,
} from '@/lib/api/services/category.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const categoryId = Number(params.id);

  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<UpdateCategoryRequest>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryId) {
      loadCategory();
    }
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      setError('');
      const categoryData = await categoryService.getById(categoryId);
      setCategory(categoryData);
      setFormData({
        name: categoryData.name,
        description: categoryData.description || '',
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load category. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof UpdateCategoryRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name) {
      setError('Category name is required');
      return;
    }

    setSaving(true);

    try {
      await categoryService.update(categoryId, {
        name: formData.name,
        description: formData.description || undefined,
      });
      showToast('Category updated successfully!', 'success');
      router.push(ROUTES.CATEGORIES);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update category. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (error && !category) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Alert severity="error">{error}</Alert>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!category) {
    return (
      <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
        <MainLayout>
          <Container maxWidth="md">
            <Alert severity="info">Category not found</Alert>
          </Container>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={['ADMIN', 'OPERATOR']}>
      <MainLayout>
        <Container maxWidth="md">
          <Box sx={{ py: 4 }}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                mb: 4,
                fontSize: isMobile ? '1.75rem' : '2rem',
              }}
            >
              Edit Category
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Category Name"
                    value={formData.name}
                    onChange={handleChange('name')}
                    required
                    sx={{ mb: 3 }}
                    error={!!error && !formData.name}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={handleChange('description')}
                    multiline
                    rows={4}
                    sx={{ mb: 3 }}
                  />

                  <Box display="flex" gap={2} justifyContent="flex-end" flexWrap="wrap">
                    <Button
                      variant="outlined"
                      onClick={() => router.push(ROUTES.CATEGORIES)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? <CircularProgress size={24} /> : 'Update Category'}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </MainLayout>
    </ProtectedRoute>
  );
}

