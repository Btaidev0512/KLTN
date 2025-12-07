import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  InputAdornment,
  Avatar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import {
  MagnifyingGlass,
  Eye,
  UserMinus,
  Envelope,
  Phone,
  MapPin,
  Calendar,
} from '@phosphor-icons/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from '../../services/api';

interface Customer {
  user_id: number;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  status: 'active' | 'inactive';
  total_orders?: number;
  total_spent?: number;
}

const CustomersManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getUsers();
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
  };

  const handleUpdateStatus = async (userId: number, newStatus: 'active' | 'inactive') => {
    if (!window.confirm(`Bạn có chắc muốn ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản này?`)) {
      return;
    }

    try {
      await api.admin.updateUserStatus(String(userId), newStatus);
      toast.success(`Cập nhật trạng thái thành công!`);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  // Paginate
  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Header */}
      <Typography variant="h4" fontWeight={700} mb={3}>
        Quản lý Khách hàng
      </Typography>

      {/* Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Tổng khách hàng
          </Typography>
          <Typography variant="h4" fontWeight={700} color="primary">
            {customers.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Đang hoạt động
          </Typography>
          <Typography variant="h4" fontWeight={700} color="success.main">
            {customers.filter(c => c.status === 'active').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Bị khóa
          </Typography>
          <Typography variant="h4" fontWeight={700} color="error.main">
            {customers.filter(c => c.status === 'inactive').length}
          </Typography>
        </Paper>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlass size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Customers Table */}
      <Paper>
        {filteredCustomers.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchTerm ? 'Không tìm thấy khách hàng phù hợp' : 'Chưa có khách hàng nào'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Số điện thoại</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ngày đăng ký</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.user_id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: '#FF6B35' }}>
                            {customer.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            {customer.full_name || 'Chưa cập nhật'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || 'Chưa có'}</TableCell>
                      <TableCell>{formatDate(customer.created_at)}</TableCell>
                      <TableCell>
                        <Chip
                          label={customer.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                          size="small"
                          color={customer.status === 'active' ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDetails(customer)}
                          >
                            <Eye size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color={customer.status === 'active' ? 'error' : 'success'}
                            onClick={() => handleUpdateStatus(
                              customer.user_id,
                              customer.status === 'active' ? 'inactive' : 'active'
                            )}
                          >
                            <UserMinus size={18} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredCustomers.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Số dòng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Customer Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết Khách hàng</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Box sx={{ pt: 2 }}>
              <Stack spacing={2}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: '#FF6B35',
                      fontSize: '2rem',
                      mx: 'auto',
                      mb: 1,
                    }}
                  >
                    {selectedCustomer.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedCustomer.full_name || 'Chưa cập nhật'}
                  </Typography>
                  <Chip
                    label={selectedCustomer.status === 'active' ? 'Hoạt động' : 'Bị khóa'}
                    size="small"
                    color={selectedCustomer.status === 'active' ? 'success' : 'error'}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Envelope size={20} color="#FF6B35" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2">{selectedCustomer.email}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Phone size={20} color="#FF6B35" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Số điện thoại
                    </Typography>
                    <Typography variant="body2">{selectedCustomer.phone || 'Chưa cập nhật'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MapPin size={20} color="#FF6B35" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Địa chỉ
                    </Typography>
                    <Typography variant="body2">{selectedCustomer.address || 'Chưa cập nhật'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Calendar size={20} color="#FF6B35" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Ngày đăng ký
                    </Typography>
                    <Typography variant="body2">{formatDate(selectedCustomer.created_at)}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={handleCloseDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersManagement;
