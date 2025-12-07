import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Review {
  review_id: number;
  product_id: number;
  user_id: number;
  rating: number;
  review_text: string;
  review_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_reply?: string;
  reply_date?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  product_name?: string;
  product_image?: string;
  product_price?: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avgRating: string;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all reviews with filters
export const getAllReviews = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  rating?: string;
  product_id?: number;
  search?: string;
}): Promise<ReviewsResponse> => {
  const response = await axios.get(`${API_URL}/admin/reviews`, {
    params,
    headers: getAuthHeader(),
  });
  return response.data;
};

// Get review statistics
export const getReviewStats = async (): Promise<ReviewStats> => {
  const response = await axios.get(`${API_URL}/admin/reviews/stats`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Get single review
export const getReviewById = async (id: number): Promise<Review> => {
  const response = await axios.get(`${API_URL}/admin/reviews/${id}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Approve review
export const approveReview = async (id: number): Promise<void> => {
  await axios.put(
    `${API_URL}/admin/reviews/${id}/approve`,
    {},
    { headers: getAuthHeader() }
  );
};

// Reject review
export const rejectReview = async (id: number): Promise<void> => {
  await axios.put(
    `${API_URL}/admin/reviews/${id}/reject`,
    {},
    { headers: getAuthHeader() }
  );
};

// Reply to review
export const replyToReview = async (
  id: number,
  admin_reply: string
): Promise<void> => {
  await axios.post(
    `${API_URL}/admin/reviews/${id}/reply`,
    { admin_reply },
    { headers: getAuthHeader() }
  );
};

// Delete review
export const deleteReview = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/admin/reviews/${id}`, {
    headers: getAuthHeader(),
  });
};
