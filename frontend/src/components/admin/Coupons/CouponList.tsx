import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  PencilSimple,
  Trash,
  ToggleLeft,
  ToggleRight,
  ChartBar,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Coupon } from '../../../services/couponService';

interface CouponListProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
  onToggleStatus: (coupon: Coupon) => void;
  onViewStats: (coupon: Coupon) => void;
}

export const CouponList: React.FC<CouponListProps> = ({
  coupons,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewStats,
}) => {
  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    } else if (coupon.discount_type === 'fixed_amount') {
      return `${coupon.discount_value.toLocaleString()}đ`;
    } else {
      return 'Miễn phí vận chuyển';
    }
  };

  const getDiscountTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'primary';
      case 'fixed_amount':
        return 'success';
      case 'free_shipping':
        return 'info';
      default:
        return 'default';
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const getStatusChip = (coupon: Coupon) => {
    if (!coupon.is_active) {
      return <Chip label="Đã tắt" size="small" color="default" />;
    }
    if (isExpired(coupon.valid_until)) {
      return <Chip label="Hết hạn" size="small" color="error" />;
    }
    return <Chip label="Đang hoạt động" size="small" color="success" />;
  };

  if (coupons.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Chưa có mã giảm giá nào
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Mã Code</strong></TableCell>
            <TableCell><strong>Tên</strong></TableCell>
            <TableCell align="center"><strong>Loại giảm giá</strong></TableCell>
            <TableCell align="center"><strong>Giảm</strong></TableCell>
            <TableCell align="center"><strong>Đơn tối thiểu</strong></TableCell>
            <TableCell align="center"><strong>Sử dụng</strong></TableCell>
            <TableCell align="center"><strong>Hiệu lực</strong></TableCell>
            <TableCell align="center"><strong>Trạng thái</strong></TableCell>
            <TableCell align="center"><strong>Thao tác</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {coupons.map((coupon) => (
            <TableRow key={coupon.coupon_id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                  {coupon.coupon_code}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{coupon.coupon_name}</Typography>
                {coupon.description && (
                  <Typography variant="caption" color="text.secondary">
                    {coupon.description.substring(0, 50)}
                    {coupon.description.length > 50 && '...'}
                  </Typography>
                )}
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={
                    coupon.discount_type === 'percentage'
                      ? 'Phần trăm'
                      : coupon.discount_type === 'fixed_amount'
                      ? 'Số tiền cố định'
                      : 'Free Ship'
                  }
                  size="small"
                  color={getDiscountTypeColor(coupon.discount_type)}
                />
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2" fontWeight={600} color="primary">
                  {getDiscountDisplay(coupon)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">
                  {coupon.minimum_order_amount
                    ? `${coupon.minimum_order_amount.toLocaleString()}đ`
                    : '0đ'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box>
                  <Typography variant="body2">
                    {coupon.used_count || 0}
                    {coupon.usage_limit_per_coupon && ` / ${coupon.usage_limit_per_coupon}`}
                  </Typography>
                  {coupon.usage_limit_per_coupon && (
                    <Typography variant="caption" color="text.secondary">
                      {((coupon.used_count / coupon.usage_limit_per_coupon) * 100).toFixed(0)}%
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" display="block">
                  {format(new Date(coupon.valid_from), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  đến
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  color={isExpired(coupon.valid_until) ? 'error' : 'inherit'}
                >
                  {format(new Date(coupon.valid_until), 'dd/MM/yyyy')}
                </Typography>
              </TableCell>
              <TableCell align="center">{getStatusChip(coupon)}</TableCell>
              <TableCell align="center">
                <Box display="flex" gap={0.5} justifyContent="center">
                  <Tooltip title="Chỉnh sửa">
                    <IconButton size="small" color="primary" onClick={() => onEdit(coupon)}>
                      <PencilSimple size={18} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title={coupon.is_active ? 'Tắt' : 'Bật'}>
                    <IconButton
                      size="small"
                      color={coupon.is_active ? 'success' : 'default'}
                      onClick={() => onToggleStatus(coupon)}
                    >
                      {coupon.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Thống kê">
                    <IconButton size="small" color="info" onClick={() => onViewStats(coupon)}>
                      <ChartBar size={18} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete(coupon)}
                      disabled={coupon.used_count > 0}
                    >
                      <Trash size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
