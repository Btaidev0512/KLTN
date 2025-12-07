import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/MyReviews.css';

interface Review {
  review_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  product_slug: string;
  rating: number;
  review_title?: string;
  review_text?: string;
  review_date: string;
  status: string;
}

const MyReviews: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    rating: 5,
    review_title: '',
    review_text: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getMyReviews();

      if (response.data.success) {
        setReviews(response.data.data || []);
      } else {
        setError('Không thể tải danh sách đánh giá');
      }
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Không thể tải danh sách đánh giá. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review.review_id);
    setEditForm({
      rating: review.rating,
      review_title: review.review_title || '',
      review_text: review.review_text || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditForm({
      rating: 5,
      review_title: '',
      review_text: ''
    });
  };

  const handleUpdateReview = async (reviewId: number) => {
    try {
      await api.updateReview(reviewId, editForm);
      
      // Refresh reviews
      fetchReviews();
      setEditingReview(null);
      
      alert('Đánh giá đã được cập nhật');
    } catch (err) {
      console.error('Error updating review:', err);
      alert('Không thể cập nhật đánh giá. Vui lòng thử lại.');
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      return;
    }

    try {
      await api.deleteReview(reviewId);
      
      setReviews(prev => prev.filter(r => r.review_id !== reviewId));
      
      alert('Đã xóa đánh giá');
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Không thể xóa đánh giá. Vui lòng thử lại.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStars = (rating: number, interactive: boolean = false, onChange?: (rating: number) => void) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-reviews-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải đánh giá...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-reviews-page">
        <div className="container">
          <div className="error-container">
            <i className="fa fa-exclamation-circle"></i>
            <p>{error}</p>
            <button onClick={fetchReviews} className="btn-retry">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reviews-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fa fa-star"></i>
            Đánh giá của tôi
          </h1>
          <span className="review-count">
            {reviews.length} đánh giá
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="empty-reviews">
            <div className="empty-icon">
              <i className="fa fa-star-o"></i>
            </div>
            <h3>Chưa có đánh giá nào</h3>
            <p>Hãy mua sắm và chia sẻ trải nghiệm của bạn!</p>
            <Link to="/products" className="btn-browse">
              <i className="fa fa-shopping-bag"></i>
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.review_id} className="review-card">
                <div className="review-product">
                  <Link to={`/product/${review.product_id}`}>
                    <img src={review.product_image || '/placeholder.png'} alt={review.product_name} />
                  </Link>
                  <div className="product-info">
                    <Link to={`/product/${review.product_id}`}>
                      <h3>{review.product_name}</h3>
                    </Link>
                    <span className="review-date">
                      <i className="fa fa-calendar"></i>
                      {formatDate(review.review_date)}
                    </span>
                  </div>
                </div>

                {editingReview === review.review_id ? (
                  <div className="edit-review-form">
                    <div className="form-group">
                      <label>Đánh giá:</label>
                      {renderStars(editForm.rating, true, (rating) => 
                        setEditForm({...editForm, rating})
                      )}
                    </div>

                    <div className="form-group">
                      <label>Tiêu đề:</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editForm.review_title}
                        onChange={(e) => setEditForm({...editForm, review_title: e.target.value})}
                        placeholder="Tóm tắt đánh giá của bạn"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nội dung:</label>
                      <textarea
                        className="form-textarea"
                        value={editForm.review_text}
                        onChange={(e) => setEditForm({...editForm, review_text: e.target.value})}
                        placeholder="Chia sẻ trải nghiệm của bạn..."
                        rows={4}
                      />
                    </div>

                    <div className="form-actions">
                      <button
                        className="btn-save"
                        onClick={() => handleUpdateReview(review.review_id)}
                      >
                        <i className="fa fa-save"></i>
                        Lưu
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={handleCancelEdit}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="review-content">
                      {renderStars(review.rating)}
                      
                      {review.review_title && (
                        <h4 className="review-title">{review.review_title}</h4>
                      )}
                      
                      {review.review_text && (
                        <p className="review-text">{review.review_text}</p>
                      )}

                      <span className={`review-status ${review.status}`}>
                        {review.status === 'approved' ? '✓ Đã duyệt' : 
                         review.status === 'pending' ? '⏳ Chờ duyệt' : 
                         '✗ Bị từ chối'}
                      </span>
                    </div>

                    <div className="review-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(review)}
                      >
                        <i className="fa fa-edit"></i>
                        Sửa
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteReview(review.review_id)}
                      >
                        <i className="fa fa-trash"></i>
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviews;
