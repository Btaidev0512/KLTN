import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
} from '@mui/material';
import {
  MagnifyingGlass,
  Eye,
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';

interface Order {
  order_id: number;
  order_number: string;
  customer_name: string;
  email: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_address: string;
  phone: string;
  items?: OrderItem[];
}

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const OrdersManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getOrders();
      
      if (response.data.success) {
        setOrders(response.data.data || response.data.orders || []);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    console.log('🔄 Updating order status:', { orderId, newStatus });
    try {
      const response = await api.admin.updateOrderStatus(orderId.toString(), newStatus);
      console.log('✅ Update response:', response.data);
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
    } catch (error: any) {
      console.error('❌ Error updating order status:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleViewDetail = async (order: Order) => {
    try {
      const response = await api.admin.getOrderDetails(order.order_id.toString());
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setDetailDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error fetching order detail:', error);
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
      pending: 'warning',
      processing: 'info',
      shipping: 'info',
      delivered: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    return statusMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Quản lý Đơn hàng
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            placeholder="Tìm theo mã đơn, tên, email, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlass size={20} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              value={statusFilter}
              label="Trạng thái"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="pending">Chờ xử lý</MenuItem>
              <MenuItem value="processing">Đang xử lý</MenuItem>
              <MenuItem value="shipping">Đang giao</MenuItem>
              <MenuItem value="delivered">Đã giao</MenuItem>
              <MenuItem value="completed">Hoàn thành</MenuItem>
              <MenuItem value="cancelled">Đã hủy</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Stats */}
      <Stack direction="row" spacing={2} mb={3}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tổng đơn hàng
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {orders.length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Chờ xử lý
          </Typography>
          <Typography variant="h5" fontWeight={700} color="warning.main">
            {orders.filter((o) => o.status === 'pending').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Đang giao
          </Typography>
          <Typography variant="h5" fontWeight={700} color="info.main">
            {orders.filter((o) => o.status === 'shipping').length}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Hoàn thành
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {orders.filter((o) => o.status === 'completed' || o.status === 'delivered').length}
          </Typography>
        </Paper>
      </Stack>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        {filteredOrders.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchTerm || statusFilter !== 'all'
                ? 'Không tìm thấy đơn hàng phù hợp'
                : 'Chưa có đơn hàng nào'}
            </Typography>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Mã đơn</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Số điện thoại</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tổng tiền</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ngày đặt</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.order_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {order.order_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.customer_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.phone || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {formatCurrency(order.total_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                          sx={{ minWidth: 140 }}
                        >
                          <MenuItem value="pending">Chờ xử lý</MenuItem>
                          <MenuItem value="processing">Đang xử lý</MenuItem>
                          <MenuItem value="shipping">Đang giao</MenuItem>
                          <MenuItem value="delivered">Đã giao</MenuItem>
                          <MenuItem value="completed">Hoàn thành</MenuItem>
                          <MenuItem value="cancelled">Đã hủy</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(order.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetail(order)}
                        sx={{ color: '#FF6B35' }}
                      >
                        <Eye size={20} weight="duotone" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredOrders.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Số hàng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
            />
          </>
        )}
      </TableContainer>

      {/* Order Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Chi tiết đơn hàng #{selectedOrder?.order_number}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Stack spacing={3}>
              {/* Customer Info */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Thông tin khách hàng
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2">
                    <strong>Tên:</strong> {selectedOrder.customer_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedOrder.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Số điện thoại:</strong> {selectedOrder.phone || 'N/A'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Địa chỉ:</strong> {selectedOrder.shipping_address}
                  </Typography>
                </Stack>
              </Box>

              {/* Order Info */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Thông tin đơn hàng
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" sx={{ minWidth: 120 }}>
                      <strong>Trạng thái:</strong>
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select
                        value={selectedOrder.status}
                        onChange={(e) => {
                          handleStatusChange(selectedOrder.order_id, e.target.value);
                          setDetailDialogOpen(false);
                        }}
                      >
                        <MenuItem value="pending">Chờ xử lý</MenuItem>
                        <MenuItem value="processing">Đang xử lý</MenuItem>
                        <MenuItem value="shipping">Đang giao</MenuItem>
                        <MenuItem value="delivered">Đã giao</MenuItem>
                        <MenuItem value="completed">Hoàn thành</MenuItem>
                        <MenuItem value="cancelled">Đã hủy</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                  <Typography variant="body2">
                    <strong>Ngày đặt:</strong> {formatDate(selectedOrder.created_at)}
                  </Typography>
                </Stack>
              </Box>

              {/* Order Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Sản phẩm
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="center">Số lượng</TableCell>
                          <TableCell align="right">Đơn giá</TableCell>
                          <TableCell align="right">Thành tiền</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                            <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Total */}
              <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6" fontWeight={700}>
                    Tổng cộng
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {formatCurrency(selectedOrder.total_amount)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersManagement;
