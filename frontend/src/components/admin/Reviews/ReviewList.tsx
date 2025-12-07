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
  Avatar,
  Rating,
} from '@mui/material';
import {
  CheckCircle,
  XCircle,
  Trash,
  ChatCircle,
  Eye,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { Review } from '../../../services/reviewService';

interface ReviewListProps {
  reviews: Review[];
  onApprove: (review: Review) => void;
  onReject: (review: Review) => void;
  onDelete: (review: Review) => void;
  onReply: (review: Review) => void;
  onViewDetail: (review: Review) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  onApprove,
  onReject,
  onDelete,
  onReply,
  onViewDetail,
}) => {
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

  if (reviews.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Không có đánh giá nào
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell>Sản phẩm</TableCell>
            <TableCell>Khách hàng</TableCell>
            <TableCell align="center">Rating</TableCell>
            <TableCell>Nội dung</TableCell>
            <TableCell align="center">Ngày</TableCell>
            <TableCell align="center">Trạng thái</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reviews.map((review) => (
            <TableRow
              key={review.review_id}
              hover
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar
                    src={review.product_image}
                    alt={review.product_name}
                    variant="rounded"
                    sx={{ width: 50, height: 50 }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {review.product_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {review.product_id}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              <TableCell>
                <Typography variant="body2" fontWeight={500}>
                  {review.customer_name || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {review.customer_email}
                </Typography>
              </TableCell>

              <TableCell align="center">
                <Rating value={review.rating} readOnly size="small" />
                <Typography variant="caption" display="block" color="text.secondary">
                  {review.rating}/5
                </Typography>
              </TableCell>

              <TableCell sx={{ maxWidth: 300 }}>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {review.review_text}
                </Typography>
                {review.admin_reply && (
                  <Chip
                    label="Đã trả lời"
                    size="small"
                    color="info"
                    sx={{ mt: 0.5 }}
                  />
                )}
              </TableCell>

              <TableCell align="center">
                <Typography variant="body2">
                  {format(new Date(review.review_date), 'dd/MM/yyyy')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(review.review_date), 'HH:mm')}
                </Typography>
              </TableCell>

              <TableCell align="center">
                <Chip
                  label={getStatusLabel(review.status)}
                  color={getStatusColor(review.status)}
                  size="small"
                />
              </TableCell>

              <TableCell align="center">
                <Box display="flex" gap={0.5} justifyContent="center">
                  <Tooltip title="Xem chi tiết">
                    <IconButton size="small" color="info" onClick={() => onViewDetail(review)}>
                      <Eye size={18} />
                    </IconButton>
                  </Tooltip>

                  {review.status === 'pending' && (
                    <>
                      <Tooltip title="Duyệt">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => onApprove(review)}
                        >
                          <CheckCircle size={18} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Từ chối">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onReject(review)}
                        >
                          <XCircle size={18} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  <Tooltip title="Trả lời">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onReply(review)}
                    >
                      <ChatCircle size={18} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Xóa">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDelete(review)}
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
