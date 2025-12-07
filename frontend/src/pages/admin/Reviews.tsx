import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Button,
} from '@mui/material';
import {
  MagnifyingGlass,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Trash,
} from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import {
  getAllReviews,
  getReviewStats,
  approveReview,
  rejectReview,
  deleteReview,
  replyToReview,
  Review,
  ReviewStats,
} from '../../services/reviewService';
import { ReviewList } from '../../components/admin/Reviews/ReviewList';
import { ReviewDetail } from '../../components/admin/Reviews/ReviewDetail';

export const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Stats
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgRating: '0',
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Detail Modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  // Reply Dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [reviewToReply, setReviewToReply] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadReviews();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, ratingFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadReviews();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getAllReviews({
        page,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        rating: ratingFilter !== 'all' ? ratingFilter : undefined,
        search: search || undefined,
      });

      setReviews(data.reviews);
      setTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getReviewStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprove = async (review: Review) => {
    try {
      await approveReview(review.review_id);
      toast.success('Đã duyệt đánh giá');
      loadReviews();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt đánh giá');
    }
  };

  const handleReject = async (review: Review) => {
    try {
      await rejectReview(review.review_id);
      toast.success('Đã từ chối đánh giá');
      loadReviews();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối đánh giá');
    }
  };

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;

    try {
      await deleteReview(reviewToDelete.review_id);
      toast.success('Đã xóa đánh giá');
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      loadReviews();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa đánh giá');
    }
  };

  const handleReplyClick = (review: Review) => {
    setReviewToReply(review);
    setReplyText(review.admin_reply || '');
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!reviewToReply || !replyText.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    try {
      setReplying(true);
      await replyToReview(reviewToReply.review_id, replyText);
      toast.success('Đã trả lời đánh giá');
      setReplyDialogOpen(false);
      setReviewToReply(null);
      setReplyText('');
      loadReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi trả lời đánh giá');
    } finally {
      setReplying(false);
    }
  };

  const handleViewDetail = (review: Review) => {
    setSelectedReview(review);
    setDetailOpen(true);
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Quản lý đánh giá
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box display="flex" gap={3} mb={3} flexWrap="wrap">
        <Box flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' }} minWidth={200}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Star size={40} weight="duotone" color="#1976d2" />
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {stats.avgRating}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rating trung bình
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
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chờ duyệt
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
                    {stats.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Đã duyệt
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
                    {stats.rejected}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Từ chối
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
          <Box flex={{ xs: '1', md: '1 1 50%' }}>
            <TextField
              fullWidth
              placeholder="Tìm theo nội dung, khách hàng, sản phẩm..."
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
                <MenuItem value="pending">Chờ duyệt</MenuItem>
                <MenuItem value="approved">Đã duyệt</MenuItem>
                <MenuItem value="rejected">Từ chối</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box flex={{ xs: '1', sm: '1 1 calc(50% - 8px)', md: '1 1 25%' }}>
            <FormControl fullWidth>
              <InputLabel>Rating</InputLabel>
              <Select
                value={ratingFilter}
                onChange={(e: any) => setRatingFilter(e.target.value)}
                label="Rating"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="5">5 sao</MenuItem>
                <MenuItem value="4">4 sao</MenuItem>
                <MenuItem value="3">3 sao</MenuItem>
                <MenuItem value="2">2 sao</MenuItem>
                <MenuItem value="1">1 sao</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      {/* Review List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <ReviewList
          reviews={reviews}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDeleteClick}
          onReply={handleReplyClick}
          onViewDetail={handleViewDetail}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Review Detail Modal */}
      <ReviewDetail
        review={selectedReview}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedReview(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" startIcon={<Trash />}>
            Xóa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Trả lời đánh giá</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Nội dung trả lời"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Nhập nội dung trả lời cho khách hàng..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setReplyDialogOpen(false)} disabled={replying}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmitReply}
            variant="contained"
            disabled={replying || !replyText.trim()}
          >
            {replying ? 'Đang gửi...' : 'Gửi trả lời'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
