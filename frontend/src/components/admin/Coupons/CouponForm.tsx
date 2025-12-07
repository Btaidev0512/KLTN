import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
  InputAdornment,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import { FloppyDisk, X } from '@phosphor-icons/react';
import { Coupon, CreateCouponDTO } from '../../../services/couponService';

interface CouponFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCouponDTO) => Promise<void>;
  coupon?: Coupon | null;
  mode: 'create' | 'edit';
}

export const CouponForm: React.FC<CouponFormProps> = ({
  open,
  onClose,
  onSubmit,
  coupon,
  mode,
}) => {
  const [formData, setFormData] = useState<CreateCouponDTO>({
    coupon_code: '',
    coupon_name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount_amount: undefined,
    usage_limit_per_coupon: undefined,
    usage_limit_per_customer: undefined,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (coupon && mode === 'edit') {
      setFormData({
        coupon_code: coupon.coupon_code,
        coupon_name: coupon.coupon_name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        minimum_order_amount: coupon.minimum_order_amount || 0,
        maximum_discount_amount: coupon.maximum_discount_amount || undefined,
        usage_limit_per_coupon: coupon.usage_limit_per_coupon || undefined,
        usage_limit_per_customer: coupon.usage_limit_per_customer || undefined,
        valid_from: coupon.valid_from.split('T')[0],
        valid_until: coupon.valid_until.split('T')[0],
        is_active: coupon.is_active,
      });
    } else if (mode === 'create') {
      setFormData({
        coupon_code: '',
        coupon_name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        minimum_order_amount: 0,
        maximum_discount_amount: undefined,
        usage_limit_per_coupon: undefined,
        usage_limit_per_customer: undefined,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        is_active: 1,
      });
    }
    setErrors({});
  }, [coupon, mode, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.coupon_code.trim()) {
      newErrors.coupon_code = 'Mã coupon là bắt buộc';
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.coupon_code)) {
      newErrors.coupon_code = 'Mã chỉ chứa chữ, số, gạch ngang và gạch dưới';
    }

    if (!formData.coupon_name.trim()) {
      newErrors.coupon_name = 'Tên coupon là bắt buộc';
    }

    if (formData.discount_value <= 0) {
      newErrors.discount_value = 'Giá trị giảm phải lớn hơn 0';
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      newErrors.discount_value = 'Phần trăm không thể vượt quá 100%';
    }

    if (!formData.valid_until) {
      newErrors.valid_until = 'Ngày hết hạn là bắt buộc';
    }

    if (formData.valid_from && formData.valid_until) {
      if (new Date(formData.valid_from) > new Date(formData.valid_until)) {
        newErrors.valid_until = 'Ngày hết hạn phải sau ngày bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting coupon:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CreateCouponDTO, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {mode === 'create' ? 'Tạo mã giảm giá mới' : 'Chỉnh sửa mã giảm giá'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Row 1: Code & Name */}
          <Box display="flex" gap={2.5} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              fullWidth
              required
              label="Mã Coupon"
              value={formData.coupon_code}
              onChange={(e) => handleChange('coupon_code', e.target.value.toUpperCase())}
              error={!!errors.coupon_code}
              helperText={errors.coupon_code || 'VD: SUMMER2024, NEWUSER10'}
              disabled={mode === 'edit'}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <TextField
              fullWidth
              required
              label="Tên Coupon"
              value={formData.coupon_name}
              onChange={(e) => handleChange('coupon_name', e.target.value)}
              error={!!errors.coupon_name}
              helperText={errors.coupon_name || 'Tên hiển thị cho khách hàng'}
            />
          </Box>

          {/* Description */}
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Mô tả"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            helperText="Mô tả chi tiết về ưu đãi"
          />

          {/* Row 2: Type & Value */}
          <Box display="flex" gap={2.5} flexDirection={{ xs: 'column', sm: 'row' }}>
            <FormControl fullWidth required>
              <InputLabel>Loại giảm giá</InputLabel>
              <Select
                value={formData.discount_type}
                onChange={(e) => handleChange('discount_type', e.target.value)}
                label="Loại giảm giá"
              >
                <MenuItem value="percentage">Phần trăm (%)</MenuItem>
                <MenuItem value="fixed_amount">Số tiền cố định (đ)</MenuItem>
                <MenuItem value="free_shipping">Miễn phí vận chuyển</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              required
              type="number"
              label="Giá trị giảm"
              value={formData.discount_value}
              onChange={(e) => handleChange('discount_value', parseFloat(e.target.value))}
              error={!!errors.discount_value}
              helperText={errors.discount_value}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {formData.discount_type === 'percentage' ? '%' : 'đ'}
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Row 3: Min Order & Max Discount */}
          <Box display="flex" gap={2.5} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              fullWidth
              type="number"
              label="Giá trị đơn hàng tối thiểu"
              value={formData.minimum_order_amount}
              onChange={(e) => handleChange('minimum_order_amount', parseFloat(e.target.value))}
              InputProps={{
                endAdornment: <InputAdornment position="end">đ</InputAdornment>,
              }}
              helperText="Đơn hàng tối thiểu để áp dụng"
            />
            {formData.discount_type === 'percentage' && (
              <TextField
                fullWidth
                type="number"
                label="Giảm tối đa"
                value={formData.maximum_discount_amount || ''}
                onChange={(e) =>
                  handleChange('maximum_discount_amount', e.target.value ? parseFloat(e.target.value) : undefined)
                }
                InputProps={{
                  endAdornment: <InputAdornment position="end">đ</InputAdornment>,
                }}
                helperText="Số tiền giảm tối đa"
              />
            )}
          </Box>

          {/* Row 4: Usage Limits */}
          <Box display="flex" gap={2.5} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              fullWidth
              type="number"
              label="Giới hạn sử dụng (tổng)"
              value={formData.usage_limit_per_coupon || ''}
              onChange={(e) =>
                handleChange('usage_limit_per_coupon', e.target.value ? parseInt(e.target.value) : undefined)
              }
              helperText="Tổng số lần sử dụng coupon"
            />
            <TextField
              fullWidth
              type="number"
              label="Giới hạn/khách hàng"
              value={formData.usage_limit_per_customer || ''}
              onChange={(e) =>
                handleChange('usage_limit_per_customer', e.target.value ? parseInt(e.target.value) : undefined)
              }
              helperText="Số lần mỗi khách hàng được dùng"
            />
          </Box>

          {/* Row 5: Valid Dates */}
          <Box display="flex" gap={2.5} flexDirection={{ xs: 'column', sm: 'row' }}>
            <TextField
              fullWidth
              type="date"
              label="Ngày bắt đầu"
              value={formData.valid_from}
              onChange={(e) => handleChange('valid_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              required
              type="date"
              label="Ngày hết hạn"
              value={formData.valid_until}
              onChange={(e) => handleChange('valid_until', e.target.value)}
              error={!!errors.valid_until}
              helperText={errors.valid_until}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Active Status */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active === 1}
                onChange={(e) => handleChange('is_active', e.target.checked ? 1 : 0)}
              />
            }
            label="Kích hoạt coupon ngay"
          />

          {mode === 'create' && (
            <Alert severity="info">
              Mã coupon phải là chữ HOA, không dấu, có thể chứa số, gạch ngang (-) và gạch dưới (_)
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} startIcon={<X />} disabled={submitting}>
          Hủy
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          startIcon={<FloppyDisk />}
          disabled={submitting}
        >
          {submitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo Coupon' : 'Cập nhật'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
