import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Plus,
  MagnifyingGlass,
  Ticket,
  CheckCircle,
  XCircle,
  Clock,
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import couponService, { Coupon, CreateCouponDTO } from '../../services/couponService';
import { CouponList } from '../../components/admin/Coupons/CouponList';
import { CouponForm } from '../../components/admin/Coupons/CouponForm';

export const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed_amount' | 'free_shipping'>('all');

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Delete confirm dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expired: 0,
  });

  useEffect(() => {
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadCoupons();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const filters: any = { page, limit: 10 };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (typeFilter !== 'all') {
        filters.discount_type = typeFilter;
      }
      if (search) {
        filters.search = search;
      }

      const response = await couponService.getAllCoupons(filters);

      if (response.success) {
        setCoupons(response.data.coupons);
        setTotalPages(response.data.pagination.totalPages);
        setTotal(response.data.pagination.total);
        calculateStats(response.data.coupons);
      }
    } catch (error: any) {
      console.error('Error loading coupons:', error);
      toast.error('Lỗi khi tải danh sách coupon');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (couponList: Coupon[]) => {
    const now = new Date();
    const statsData = {
      total: couponList.length,
      active: couponList.filter((c) => c.is_active === 1 && new Date(c.valid_until) >= now).length,
      inactive: couponList.filter((c) => c.is_active === 0).length,
      expired: couponList.filter((c) => new Date(c.valid_until) < now).length,
    };
    setStats(statsData);
  };

  const handleCreateCoupon = () => {
    setSelectedCoupon(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleSubmitForm = async (data: CreateCouponDTO) => {
    try {
      if (formMode === 'create') {
        const response = await couponService.createCoupon(data);
        if (response.success) {
          toast.success('Tạo coupon thành công!');
          loadCoupons();
        }
      } else if (selectedCoupon) {
        const response = await couponService.updateCoupon(selectedCoupon.coupon_id, data);
        if (response.success) {
          toast.success('Cập nhật coupon thành công!');
          loadCoupons();
        }
      }
    } catch (error: any) {
      console.error('Error submitting coupon:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu coupon');
      throw error;
    }
  };

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;

    try {
      const response = await couponService.deleteCoupon(couponToDelete.coupon_id);
      if (response.success) {
        toast.success('Xóa coupon thành công!');
        setDeleteDialogOpen(false);
        setCouponToDelete(null);
        loadCoupons();
      }
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa coupon');
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      const response = await couponService.toggleCouponStatus(coupon.coupon_id);
      if (response.success) {
        toast.success(`Đã ${response.data.is_active ? 'bật' : 'tắt'} coupon`);
        loadCoupons();
      }
    } catch (error: any) {
      console.error('Error toggling coupon status:', error);
      toast.error('Lỗi khi thay đổi trạng thái coupon');
    }
  };

  const handleViewStats = async (coupon: Coupon) => {
    try {
      const response = await couponService.getCouponStats(coupon.coupon_id);
      if (response.success) {
        const stats = response.data;
        toast.info(
          `Thống kê ${stats.coupon_code}:\nĐã dùng: ${stats.total_usage}/${stats.usage_limit_per_coupon || 'Không giới hạn'}\nTỷ lệ: ${stats.usage_percentage?.toFixed(1) || 0}%`,
          { autoClose: 5000 }
        );
      }
    } catch (error: any) {
      console.error('Error loading coupon stats:', error);
      toast.error('Lỗi khi tải thống kê');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Quản lý Mã Giảm Giá
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tạo và quản lý các mã coupon, ưu đãi cho khách hàng
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={handleCreateCoupon}
          size="large"
        >
          Tạo Coupon
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box display="flex" gap={3} mb={3} flexWrap="wrap">
        <Box flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }} minWidth={200}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Ticket size={40} weight="duotone" color="#1976d2" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tổng Coupon
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }} minWidth={200}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <CheckCircle size={40} weight="duotone" color="#2e7d32" />
                <Box>
                  <Typography variant="h4" fontWeight={600} color="success.main">
                    {stats.active}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đang hoạt động
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }} minWidth={200}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <XCircle size={40} weight="duotone" color="#d32f2f" />
                <Box>
                  <Typography variant="h4" fontWeight={600} color="error.main">
                    {stats.expired}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hết hạn
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }} minWidth={200}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Clock size={40} weight="duotone" color="#ed6c02" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.inactive}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã tắt
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
          <Box flex={{ xs: '1', md: '1 1 41.67%' }}>
            <TextField
              fullWidth
              placeholder="Tìm theo mã hoặc tên coupon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlass size={20} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box flex={{ xs: '1', sm: '1 1 calc(50% - 8px)', md: '1 1 25%' }}>
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="inactive">Đã tắt</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box flex={{ xs: '1', sm: '1 1 calc(50% - 8px)', md: '1 1 33.33%' }}>
            <FormControl fullWidth>
              <InputLabel>Loại giảm giá</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                label="Loại giảm giá"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="percentage">Phần trăm</MenuItem>
                <MenuItem value="fixed_amount">Số tiền cố định</MenuItem>
                <MenuItem value="free_shipping">Miễn phí vận chuyển</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Coupon List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <CouponList
            coupons={coupons}
            onEdit={handleEditCoupon}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
            onViewStats={handleViewStats}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Coupon Form Dialog */}
      <CouponForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmitForm}
        coupon={selectedCoupon}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa coupon</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa coupon <strong>{couponToDelete?.coupon_code}</strong>?
            <br />
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Xóa
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
