import axios from 'axios';

// API Base URL - pointing to your backend
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Generate unique tab ID for tracking
const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

// Store logout callback
let logoutCallback: (() => void) | null = null;

// Function to set logout callback from AuthContext
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Add request interceptor to include auth token and session ID
apiClient.interceptors.request.use(
  (config) => {
    // Add tab ID for backend tracking
    config.headers['x-tab-id'] = getTabId();
    
    // Add auth token if exists
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add session ID for guest cart (if not logged in)
    if (!token || token === 'null') {
      let sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) {
        // Generate new session ID
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('cart_session_id', sessionId);
      }
      config.headers['x-session-id'] = sessionId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and session ID
apiClient.interceptors.response.use(
  (response) => {
    // Save session ID from response header (for guest cart)
    const sessionId = response.headers['x-session-id'];
    if (sessionId) {
      localStorage.setItem('cart_session_id', sessionId);
    }
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      console.log('🔐 Token expired or invalid, logging out...');
      
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      
      // Call logout callback to update AuthContext state
      if (logoutCallback) {
        logoutCallback();
      }
      
      // Only redirect to login if not already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Show notification
        const message = error.response?.data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        alert(message);
        
        // Redirect to login with return URL
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    
    // Handle 403 Forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      console.log('🚫 Access forbidden');
      const message = error.response?.data?.message || 'Bạn không có quyền truy cập.';
      alert(message);
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const api = {
  // 🎾 Badminton Products
  getBadmintonRackets: (params?: any) => 
    apiClient.get('/products', { params: { ...params, search: 'vợt cầu lông OR racket OR yonex OR victor' } }),
  
  getShuttlecocks: (params?: any) => 
    apiClient.get('/products', { params: { ...params, search: 'cầu lông OR shuttlecock' } }),
    
  getBadmintonShoes: (params?: any) => 
    apiClient.get('/products', { params: { ...params, search: 'giày cầu lông OR badminton shoes' } }),
    
  getBadmintonAccessories: (params?: any) => 
    apiClient.get('/products', { params: { ...params, search: 'phụ kiện cầu lông OR badminton accessories OR grip OR string' } }),

  // 📦 General Products
  getAllProducts: (params?: any) => 
    apiClient.get('/products', { params }),
    
  searchProducts: (query: string, params?: any) =>
    apiClient.get('/products/search', { params: { q: query, ...params } }),
    
  getProductById: (id: string) => 
    apiClient.get(`/products/${id}`),
    
  getProductBySlug: (slug: string) =>
    apiClient.get(`/products/slug/${slug}`),
    
  getFeaturedProducts: () => 
    apiClient.get('/products/featured'),
  
  // 🛠️ Product CRUD (Admin)
  createProduct: (productData: any) =>
    apiClient.post('/products', productData),
    
  updateProduct: (id: number, productData: any) =>
    apiClient.put(`/products/${id}`, productData),
    
  deleteProduct: (id: number) =>
    apiClient.delete(`/products/${id}`),
  
  // 🖼️ Product Image Upload
  uploadProductImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 🖼️ Product Images Management
  getProductImages: (productId: number) =>
    apiClient.get(`/products/${productId}/images`),
    
  createProductImage: (productId: number, imageData: any) =>
    apiClient.post(`/products/${productId}/images`, imageData),
    
  updateProductImage: (imageId: number, imageData: any) =>
    apiClient.put(`/products/images/${imageId}`, imageData),
    
  deleteProductImage: (imageId: number) =>
    apiClient.delete(`/products/images/${imageId}`),
    
  setImagePrimary: (imageId: number) =>
    apiClient.patch(`/products/images/${imageId}/set-primary`),
    
  assignImageToColor: (imageId: number, colorId: number | null) =>
    apiClient.patch(`/products/images/${imageId}/assign-color`, { color_id: colorId }),

  // 🎨 Product Colors
  getProductColors: (productId: number) =>
    apiClient.get(`/products/${productId}/colors`),
    
  getImagesByColor: (productId: number, colorId: number) =>
    apiClient.get(`/products/${productId}/colors/${colorId}/images`),
    
  createProductColor: (productId: number, colorData: any) =>
    apiClient.post(`/products/${productId}/colors`, colorData),
    
  updateProductColor: (colorId: number, colorData: any) =>
    apiClient.put(`/products/colors/${colorId}`, colorData),
    
  deleteProductColor: (colorId: number) =>
    apiClient.delete(`/products/colors/${colorId}`),
    
  updateColorSortOrders: (orders: Array<{ color_id: number; sort_order: number }>) =>
    apiClient.put('/products/colors/sort-orders', { orders }),

  // 📦 Product Variants (Color × Size)
  getProductVariants: (productId: number) =>
    apiClient.get(`/products/${productId}/variants`),
    
  getVariantsByColor: (productId: number, colorId: number) =>
    apiClient.get(`/products/${productId}/colors/${colorId}/variants`),
    
  getAvailableSizes: (productId: number, colorId: number) =>
    apiClient.get(`/products/${productId}/colors/${colorId}/available-sizes`),
    
  getTotalStockByColor: (productId: number, colorId: number) =>
    apiClient.get(`/products/${productId}/colors/${colorId}/total-stock`),
    
  getVariant: (variantId: number) =>
    apiClient.get(`/products/variants/${variantId}`),
    
  createVariant: (variantData: any) =>
    apiClient.post(`/products/${variantData.product_id}/variants`, variantData),
    
  createBulkVariants: (variants: any[]) =>
    apiClient.post('/products/variants/bulk', { variants }),
    
  updateVariant: (variantId: number, variantData: any) =>
    apiClient.put(`/products/variants/${variantId}`, variantData),
    
  deleteVariant: (variantId: number) =>
    apiClient.delete(`/products/variants/${variantId}`),
    
  checkVariantStock: (variantId: number, quantity: number) =>
    apiClient.post(`/products/variants/${variantId}/check-stock`, { quantity }),
    
  updateVariantStock: (variantId: number, quantity: number) =>
    apiClient.patch(`/products/variants/${variantId}/stock`, { quantity }),

  // 📋 Categories
  getCategories: () =>
    apiClient.get('/categories'),
    
  getParentCategories: () =>
    apiClient.get('/categories/parents'),
    
  getCategoryBySlug: (slug: string) =>
    apiClient.get(`/categories/slug/${slug}`),
    
  searchCategories: (params?: any) =>
    apiClient.get('/categories/search', { params }),

  // 🏷️ Brands
  getAllBrands: () =>
    apiClient.get('/brands?is_active=true'),
    
  getPopularBrands: () =>
    apiClient.get('/brands/popular'),
    
  getBrandById: (id: string) =>
    apiClient.get(`/brands/${id}`),
    
  getBrandBySlug: (slug: string) =>
    apiClient.get(`/brands/slug/${slug}`),
    
  searchBrands: (params?: any) =>
    apiClient.get('/brands/search', { params }),
    
  getBrandsByCountry: (country: string) =>
    apiClient.get(`/brands/country/${country}`),

  // 🎨 Banners
  getActiveBanners: () =>
    apiClient.get('/banners/active'),
    
  getAllBanners: () =>
    apiClient.get('/banners'),
    
  getBannerById: (id: number) =>
    apiClient.get(`/banners/${id}`),
    
  createBanner: (data: any) =>
    apiClient.post('/banners', data),
    
  updateBanner: (id: number, data: any) =>
    apiClient.put(`/banners/${id}`, data),
    
  toggleBannerStatus: (id: number) =>
    apiClient.put(`/banners/${id}/toggle`),
    
  reorderBanners: (banners: Array<{ banner_id: number; sort_order: number }>) =>
    apiClient.put('/banners/reorder/batch', { banners }),
    
  deleteBanner: (id: number) =>
    apiClient.delete(`/banners/${id}`),

  // 🔐 Authentication
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) =>
    apiClient.post('/auth/login', credentials),
    
  register: (userData: any) =>
    apiClient.post('/auth/register', userData),
    
  logout: () =>
    apiClient.post('/auth/logout'),
    
  getProfile: () =>
    apiClient.get('/auth/profile'),
    
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, newPassword: password }),

  // 🛒 Cart & Orders
  getCart: () =>
    apiClient.get('/cart'),
    
  addToCart: (productId: number, quantity: number) =>
    apiClient.post('/cart/add', { product_id: productId, quantity }),
    
  updateCartItem: (itemId: number, quantity: number) =>
    apiClient.put(`/cart/${itemId}`, { quantity }),
    
  removeFromCart: (itemId: number) =>
    apiClient.delete(`/cart/${itemId}`),

  applyCouponToCart: (couponCode: string) =>
    apiClient.post('/cart/coupon', { coupon_code: couponCode }),

  // 🎟️ Coupons
  validateCoupon: (couponCode: string, orderAmount: number) =>
    apiClient.get(`/coupons/validate/${couponCode}`, {
      params: { order_amount: orderAmount }
    }),

  // 📋 Orders
  createOrder: (orderData: any) =>
    apiClient.post('/orders', orderData),
    
  getOrders: () =>
    apiClient.get('/orders/my-orders'),
  
  // ✅ Get orders for Profile (exclude completed/delivered)
  getActiveOrders: () =>
    apiClient.get('/users/orders?excludeCompleted=true'),
    
  getOrderById: (id: string) =>
    apiClient.get(`/orders/${id}`),
    
  getOrderDetail: (id: number) =>
    apiClient.get(`/orders/${id}`),
    
  cancelOrder: (id: number) =>
    apiClient.put(`/orders/${id}/cancel`),
    
  trackOrder: (id: string) =>
    apiClient.get(`/orders/${id}/tracking`),

  // 💳 Payments
  createVNPayPayment: (paymentData: any) =>
    apiClient.post('/payments/vnpay/create', paymentData),
    
  createMoMoPayment: (paymentData: any) =>
    apiClient.post('/payments/momo/create', paymentData),
    
  getPaymentMethods: () =>
    apiClient.get('/payments/methods'),

  // 👤 User Management
  getUserAddresses: () =>
    apiClient.get('/users/addresses'),
    
  addUserAddress: (addressData: any) =>
    apiClient.post('/users/addresses', addressData),
    
  updateUserAddress: (id: string, addressData: any) =>
    apiClient.put(`/users/addresses/${id}`, addressData),

  // 📊 Admin APIs (require admin role)
  admin: {
    getOrders: (params?: any) =>
      apiClient.get('/admin/orders', { params }),
      
    getOrderDetails: (id: string) =>
      apiClient.get(`/admin/orders/${id}/details`),
      
    updateOrderStatus: (id: string, status: string) =>
      apiClient.put(`/admin/orders/${id}/status`, { status }),
      
    getUsers: (params?: any) =>
      apiClient.get('/admin/users', { params }),
      
    updateUserStatus: (id: string, status: string) =>
      apiClient.put(`/admin/users/${id}/status`, { status }),
      
    getLowStockProducts: (threshold?: number) =>
      apiClient.get('/admin/products/low-stock', { params: { threshold } }),
      
    getRevenue: (period: 'daily' | 'monthly') =>
      apiClient.get(`/admin/revenue/${period}`),
      
    getDashboardAnalytics: () =>
      apiClient.get('/admin/analytics/dashboard'),
  },

  // 🏷️ Categories CRUD (Admin)
  createCategory: (categoryData: any) =>
    apiClient.post('/categories', categoryData),
    
  updateCategory: (id: number, categoryData: any) =>
    apiClient.put(`/categories/${id}`, categoryData),
    
  deleteCategory: (id: number) =>
    apiClient.delete(`/categories/${id}`),
  
  reorderCategories: (orders: {id: number, sort_order: number}[]) =>
    apiClient.patch('/categories/reorder', { orders }),

  // 🔖 Brands CRUD (Admin)
  createBrand: (brandData: any) =>
    apiClient.post('/brands', brandData),
    
  updateBrand: (id: number, brandData: any) =>
    apiClient.put(`/brands/${id}`, brandData),
    
  deleteBrand: (id: number) =>
    apiClient.delete(`/brands/${id}`),
  
  updateBrandOrders: (orders: { id: number; sort_order: number }[]) =>
    apiClient.patch('/brands/reorder', { orders }),

  // ❤️ Wishlist APIs
  getWishlist: () =>
    apiClient.get('/wishlist'),
    
  addToWishlist: (productId: number) =>
    apiClient.post('/wishlist', { product_id: productId }),
    
  removeFromWishlist: (productId: number) =>
    apiClient.delete(`/wishlist/${productId}`),
    
  checkWishlist: (productId: number) =>
    apiClient.get(`/wishlist/check/${productId}`),
    
  getWishlistCount: () =>
    apiClient.get('/wishlist/count'),

  // ⭐ Reviews APIs
  createReview: (reviewData: { product_id: number; rating: number; review_text?: string; review_title?: string }) =>
    apiClient.post('/reviews', reviewData),
    
  getProductReviews: (productId: number, params?: any) =>
    apiClient.get(`/reviews/product/${productId}`, { params }),
    
  getReviewStats: (productId: number) =>
    apiClient.get(`/reviews/product/${productId}/stats`),
    
  getMyReviews: (params?: any) =>
    apiClient.get('/reviews/my-reviews', { params }),
    
  updateReview: (reviewId: number, reviewData: any) =>
    apiClient.put(`/reviews/${reviewId}`, reviewData),
    
  deleteReview: (reviewId: number) =>
    apiClient.delete(`/reviews/${reviewId}`),

  // 📊 Dashboard APIs (require admin role)
  dashboard: {
    getFullDashboard: () =>
      apiClient.get('/dashboard'),
      
    getOverview: () =>
      apiClient.get('/dashboard/overview'),
      
    getRevenue: (period: 'week' | 'month' | 'year' = 'month') =>
      apiClient.get('/dashboard/revenue', { params: { period } }),
      
    getTopProducts: (limit: number = 10) =>
      apiClient.get('/dashboard/top-products', { params: { limit } }),
      
    getRecentOrders: (limit: number = 10) =>
      apiClient.get('/dashboard/recent-orders', { params: { limit } }),
      
    getOrderStatusDistribution: () =>
      apiClient.get('/dashboard/order-status'),
      
    getInventoryAlerts: () =>
      apiClient.get('/dashboard/inventory-alerts'),
      
    getCustomerInsights: () =>
      apiClient.get('/dashboard/customer-insights'),
      
    getBestCustomers: (limit: number = 10) =>
      apiClient.get('/dashboard/best-customers', { params: { limit } }),
      
    getSalesByCategory: () =>
      apiClient.get('/dashboard/sales-by-category'),
  },

  // 🏷️ Product Attributes (Vợt attributes)
  productAttributes: {
    // Get attribute definitions for a category
    getAttributesByCategory: (categoryId: number, brandId?: number) =>
      apiClient.get(`/product-attributes/category/${categoryId}/definitions`, {
        params: brandId ? { brandId } : {}
      }),
    
    // Get filter options with product counts
    getFilterOptions: (categoryId: number, brandId?: number) =>
      apiClient.get(`/product-attributes/category/${categoryId}/filters`, {
        params: brandId ? { brandId } : {}
      }),
    
    // Get product's attributes
    getProductAttributes: (productId: number) =>
      apiClient.get(`/product-attributes/product/${productId}`),
    
    // Set/update product attributes
    setProductAttributes: (productId: number, attributes: any[]) =>
      apiClient.post(`/product-attributes/product/${productId}`, { attributes }),
    
    // Filter products by attributes
    filterProducts: (categoryId: number, filters: any) =>
      apiClient.get(`/product-attributes/category/${categoryId}/products/filter`, { params: filters }),
  },

  // 💬 Chat API
  chat: {
    startChat: () =>
      apiClient.post('/chat/start'),
    
    sendMessage: (sessionId: string, message: string) =>
      apiClient.post('/chat/message', { session_id: sessionId, message }),
    
    getChatHistory: (sessionId: string) =>
      apiClient.get(`/chat/history/${sessionId}`),
    
    endChat: (sessionId: string) =>
      apiClient.post('/chat/end', { session_id: sessionId }),
    
    getQuickReplies: () =>
      apiClient.get('/chat/quick-replies'),
  },

  // ⚙️ Settings API
  settings: {
    getPublicSettings: () =>
      apiClient.get('/settings/public'),
    
    getShippingSettings: () =>
      apiClient.get('/settings/shipping'),
  },

  // Generic GET/POST methods for backward compatibility
  get: (url: string, config?: any) => apiClient.get(url, config),
  post: (url: string, data?: any, config?: any) => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiClient.put(url, data, config),
  delete: (url: string, config?: any) => apiClient.delete(url, config),
};

// Export apiClient for use in other services
export { apiClient };
export default apiClient;