import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Coupon {
  coupon_id: number;
  coupon_code: string;
  coupon_name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit_per_coupon?: number;
  usage_limit_per_customer?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCouponDTO {
  coupon_code: string;
  coupon_name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_shipping';
  discount_value: number;
  minimum_order_amount?: number;
  maximum_discount_amount?: number;
  usage_limit_per_coupon?: number;
  usage_limit_per_customer?: number;
  valid_from?: string;
  valid_until: string;
  is_active?: number;
}

export interface UpdateCouponDTO extends Partial<CreateCouponDTO> {}

export interface CouponFilters {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  discount_type?: 'percentage' | 'fixed_amount' | 'free_shipping';
  search?: string;
}

export interface CouponStats {
  coupon_code: string;
  coupon_name: string;
  usage_limit_per_coupon?: number;
  used_count: number;
  total_usage: number;
  usage_percentage?: number;
}

const couponService = {
  // Get all coupons with pagination and filters
  getAllCoupons: async (filters?: CouponFilters) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.discount_type) params.append('discount_type', filters.discount_type);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(`${API_URL}/admin/coupons?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get coupon by ID
  getCouponById: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/coupons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Create new coupon
  createCoupon: async (couponData: CreateCouponDTO) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/admin/coupons`, couponData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Update coupon
  updateCoupon: async (id: number, couponData: UpdateCouponDTO) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/admin/coupons/${id}`, couponData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Delete coupon
  deleteCoupon: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/admin/coupons/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Toggle coupon active status
  toggleCouponStatus: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/admin/coupons/${id}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get coupon statistics
  getCouponStats: async (id: number) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/coupons/${id}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default couponService;
