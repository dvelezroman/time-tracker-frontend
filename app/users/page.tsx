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

export default function UsersPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    // TODO: Implement edit user page
    showToast('Edit user functionality coming soon', 'info');
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
      showToast('User deleted successfully!', 'success');
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
                Users
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreate}
                size={isMobile ? 'medium' : 'large'}
              >
                Create User
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
                    placeholder="Search by email..."
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
                    <InputLabel>Role</InputLabel>
                    <Select value={roleFilter} onChange={handleRoleFilterChange} label="Role">
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="OPERATOR">Operator</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl
                    sx={{ flex: isMobile ? '1 1 100%' : '1 1 200px', minWidth: 180 }}
                    size={isMobile ? 'medium' : 'small'}
                  >
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} onChange={handleStatusFilterChange} label="Status">
                      <MenuItem value="">All Statuses</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
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
                      No users found
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
                            <TableCell>Email</TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                              Phone
                            </TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              Created At
                            </TableCell>
                            <TableCell align="right">Actions</TableCell>
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

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the user &quot;{userToDelete?.email}&quot;? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
              {deleting ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  );
}
