'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  Container,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { userService, UpdateUserRequest, UserWithDates } from '@/lib/api/services/user.service';
import { ROUTES } from '@/lib/constants';
import { showToast } from '@/components/common/Toast';
import { format } from 'date-fns';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function UsersPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserWithDates[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ADMIN' | 'OPERATOR' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | ''>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithDates | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithDates | null>(null);
  const [editing, setEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserRequest>({
    email: '',
    phone: '',
    password: '',
    role: 'OPERATOR',
    status: 'ACTIVE',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, limit, search, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Note: The API returns paginated response, but userService.getUsers() 
      // already extracts the data array. We need to handle pagination differently.
      // For now, we'll fetch all users and handle pagination client-side
      // In a real app, you'd want to pass query params to the API
      const allUsers = await userService.getUsers();
      
      // Apply client-side filtering
      let filteredUsers = allUsers;
      
      if (search) {
        filteredUsers = filteredUsers.filter((user) =>
          user.email.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (roleFilter) {
        filteredUsers = filteredUsers.filter((user) => user.role === roleFilter);
      }
      
      if (statusFilter) {
        filteredUsers = filteredUsers.filter((user) => user.status === statusFilter);
      }
      
      // Client-side pagination
      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      setUsers(paginatedUsers);
      setTotal(filteredUsers.length);
      setTotalPages(Math.ceil(filteredUsers.length / limit));
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to load users. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleRoleFilterChange = (e: any) => {
    setRoleFilter(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (e: any) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (user: UserWithDates) => {
    setUserToEdit(user);
    setEditFormData({
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setUserToEdit(null);
    setEditFormData({
      email: '',
      phone: '',
      password: '',
      role: 'OPERATOR',
      status: 'ACTIVE',
    });
    setError('');
  };

  const handleEditSubmit = async () => {
    if (!userToEdit) return;

    // Build update data, excluding empty password
    const updateData: UpdateUserRequest = {
      email: editFormData.email,
      phone: editFormData.phone || undefined,
      role: editFormData.role,
      status: editFormData.status,
    };

    // Only include password if it's provided
    if (editFormData.password && editFormData.password.length > 0) {
      if (editFormData.password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      updateData.password = editFormData.password;
    }

    try {
      setEditing(true);
      setError('');
      await userService.updateUser(userToEdit.id, updateData);
      showToast(t('users.userUpdated'), 'success');
      handleEditClose();
      loadUsers();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to update user. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteClick = (user: UserWithDates) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      await userService.deleteUser(userToDelete.id);
      showToast(t('users.userDeleted'), 'success');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to delete user. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = () => {
    router.push(ROUTES.USERS_CREATE);
  };

  const getRoleColor = (role: 'ADMIN' | 'OPERATOR'): 'default' | 'primary' | 'secondary' => {
    return role === 'ADMIN' ? 'primary' : 'secondary';
  };

  const getStatusColor = (status: 'ACTIVE' | 'INACTIVE'): 'default' | 'success' | 'error' => {
    return status === 'ACTIVE' ? 'success' : 'error';
  };

  return (
    <ProtectedRoute roles={['ADMIN']}>
      <MainLayout>
        <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
          <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
              flexWrap="wrap"
              gap={2}
            >
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.mode === 'dark' ? '#e6edf3' : '#1a1a1a',
                }}
              >
                {t('users.title')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                size={isMobile ? 'medium' : 'large'}
              >
                {t('users.createUser')}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Card sx={{ overflow: 'hidden' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box
                  display="flex"
                  gap={2}
                  mb={3}
                  flexWrap="wrap"
                  sx={{
                    flexDirection: isMobile ? 'column' : 'row',
                  }}
                >
                  <TextField
                    placeholder={t('users.searchByEmail')}
                    value={search}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 300px', minWidth: 200 }}
                    size={isMobile ? 'medium' : 'small'}
                  />
                  <FormControl
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 200px', minWidth: 180 }}
                    size={isMobile ? 'medium' : 'small'}
                  >
                    <InputLabel>{t('users.role')}</InputLabel>
                    <Select value={roleFilter} onChange={handleRoleFilterChange} label={t('users.role')}>
                      <MenuItem value="">{t('users.allRoles')}</MenuItem>
                      <MenuItem value="ADMIN">{t('users.admin')}</MenuItem>
                      <MenuItem value="OPERATOR">{t('users.operator')}</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 200px', minWidth: 180 }}
                    size={isMobile ? 'medium' : 'small'}
                  >
                    <InputLabel>{t('users.status')}</InputLabel>
                    <Select value={statusFilter} onChange={handleStatusFilterChange} label={t('users.status')}>
                      <MenuItem value="">{t('users.allStatuses')}</MenuItem>
                      <MenuItem value="ACTIVE">{t('users.active')}</MenuItem>
                      <MenuItem value="INACTIVE">{t('users.inactive')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                  </Box>
                ) : users.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body1" color="text.secondary">
                      {t('users.noUsers')}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <TableContainer
                      sx={{
                        overflowX: 'auto',
                        '& .MuiTableCell-root': {
                          whiteSpace: isMobile ? 'nowrap' : 'normal',
                          padding: isMobile ? '8px 4px' : '16px',
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                        },
                      }}
                    >
                      <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('auth.email')}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              {t('users.phone')}
                            </TableCell>
                            <TableCell>{t('users.role')}</TableCell>
                            <TableCell>{t('users.status')}</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              {t('users.createdAt')}
                            </TableCell>
                            <TableCell align="right">{t('common.actions')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {user.email}
                                </Typography>
                                {isMobile && user.phone && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {user.phone}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                <Typography variant="body2" color="text.secondary">
                                  {user.phone || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={user.role}
                                  size="small"
                                  color={getRoleColor(user.role)}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={user.status}
                                  size="small"
                                  color={getStatusColor(user.status)}
                                />
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Typography variant="body2" color="text.secondary">
                                  {user.createdAt
                                    ? format(new Date(user.createdAt), 'PPp')
                                    : '-'}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(user)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(user)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      component="div"
                      count={total}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={limit}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage={isMobile ? 'Rows:' : 'Rows per page:'}
                      labelDisplayedRows={({ from, to, count }) =>
                        isMobile ? `${from}-${to} of ${count}` : `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
                      }
                      sx={{
                        '& .MuiTablePagination-toolbar': {
                          flexWrap: 'wrap',
                          gap: 1,
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                        },
                      }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
          <DialogTitle>{t('users.editUser')}</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                fullWidth
                label={t('auth.email')}
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                required
                disabled={editing}
              />
              <FormControl fullWidth>
                <InputLabel>{t('users.role')}</InputLabel>
                <Select
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, role: e.target.value as 'ADMIN' | 'OPERATOR' })
                  }
                  label={t('users.role')}
                  disabled={editing}
                >
                  <MenuItem value="OPERATOR">{t('users.operator')}</MenuItem>
                  <MenuItem value="ADMIN">{t('users.admin')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>{t('users.status')}</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })
                  }
                  label={t('users.status')}
                  disabled={editing}
                >
                  <MenuItem value="ACTIVE">{t('users.active')}</MenuItem>
                  <MenuItem value="INACTIVE">{t('users.inactive')}</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label={t('users.phone')}
                type="tel"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                disabled={editing}
              />
              <TextField
                fullWidth
                label={t('users.newPassword')}
                type="password"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                disabled={editing}
                helperText={t('users.passwordHelper')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose} disabled={editing}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditSubmit} variant="contained" disabled={editing}>
              {editing ? <CircularProgress size={24} /> : t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>{t('users.deleteUser')}</DialogTitle>
          <DialogContent>
            <Typography>
              {t('users.deleteConfirm', { email: userToDelete?.email || '' })}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
              {deleting ? <CircularProgress size={24} /> : t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  );
}
