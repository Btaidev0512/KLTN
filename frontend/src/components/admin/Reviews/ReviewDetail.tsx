import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Rating,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import { X } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Review } from '../../../services/reviewService';

interface ReviewDetailProps {
  review: Review | null;
  open: boolean;
  onClose: () => void;
}

export const ReviewDetail: React.FC<ReviewDetailProps> = ({
  review,
  open,
  onClose,
}) => {
  if (!review) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      case 'pending':
        return 'Chờ duyệt';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Chi tiết đánh giá</Typography>
          <Chip
            label={getStatusLabel(review.status)}
            color={getStatusColor(review.status)}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Product Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Sản phẩm
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mt={1}>
              <Avatar
                src={review.product_image}
                alt={review.product_name}
                variant="rounded"
                sx={{ width: 80, height: 80 }}
              />
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  {review.product_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {review.product_id}
                </Typography>
                {review.product_price && (
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    {review.product_price.toLocaleString('vi-VN')} đ
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Customer Info */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Khách hàng
            </Typography>
            <Box mt={1}>
              <Typography variant="body1" fontWeight={600}>
                {review.customer_name || 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {review.customer_email}
              </Typography>
              {review.customer_phone && (
                <Typography variant="body2" color="text.secondary">
                  SĐT: {review.customer_phone}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Rating & Review */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Đánh giá
            </Typography>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Rating value={review.rating} readOnly />
              <Typography variant="body1" fontWeight={600}>
                {review.rating}/5 sao
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Ngày đánh giá: {format(new Date(review.review_date), 'dd/MM/yyyy HH:mm')}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Nội dung
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                whiteSpace: 'pre-wrap',
              }}
            >
              {review.review_text}
            </Typography>
          </Box>

          {/* Admin Reply */}
          {review.admin_reply && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Phản hồi của Admin
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1,
                    p: 2,
                    bgcolor: 'primary.50',
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {review.admin_reply}
                </Typography>
                {review.reply_date && (
                  <Typography variant="caption" color="text.secondary" mt={0.5}>
                    Phản hồi lúc: {format(new Date(review.reply_date), 'dd/MM/yyyy HH:mm')}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} startIcon={<X />}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};
