import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Product, ApiResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import FilterSidebar, { FilterState } from '../components/Products/FilterSidebar';
import '../styles/ProductList.css';
import '../styles/ProductListWithFilters.css';

const categoryNames: { [key: string]: string } = {
  'rackets': 'Vợt cầu lông',
  'badminton-rackets': 'Vợt cầu lông',
  'shuttlecocks': 'Cầu lông',
  'shoes': 'Giày cầu lông',
  'accessories': 'Phụ kiện cầu lông'
};

const ProductList: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const categoryFromQuery = searchParams.get('category');
  
  // Ưu tiên category từ URL params, nếu không có thì lấy từ query params
  const currentCategory = category || categoryFromQuery;
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20; // 4 cột x 5 hàng
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    minPrice: null,
    maxPrice: null,
    selectedBrands: [],
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Wishlist state
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set());

  // Load wishlist status for products
  useEffect(() => {
    const loadWishlistStatus = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await api.getWishlist();
        if (response.data.success && response.data.data?.items) {
          const ids = new Set<number>(response.data.data.items.map((item: any) => item.product_id));
          setWishlistItems(ids);
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      }
    };

    loadWishlistStatus();
  }, [isAuthenticated]);

  // Toggle wishlist
  const toggleWishlist = async (productId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để sử dụng tính năng yêu thích');
      return;
    }

    try {
      const isInWishlist = wishlistItems.has(productId);
      
      if (isInWishlist) {
        await api.removeFromWishlist(productId);
        setWishlistItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      } else {
        await api.addToWishlist(productId);
        setWishlistItems(prev => new Set(prev).add(productId));
      }

      // Dispatch event to update header count
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Không thể cập nhật danh sách yêu thích');
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(allProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const currentProducts = allProducts.slice(startIndex, endIndex);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        
        // Build query parameters with filters
        const queryParams: any = {
          limit: 50,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder.toUpperCase()
        };
        
        // Add price filters
        if (filters.minPrice) queryParams.min_price = filters.minPrice;
        if (filters.maxPrice) queryParams.max_price = filters.maxPrice;
        
        // Add brand filters
        if (filters.selectedBrands.length > 0) {
          queryParams.brands = filters.selectedBrands.join(',');
        }
        
        // Call the appropriate API based on category
        switch (currentCategory) {
          case 'rackets':
          case 'badminton-rackets':
            response = await api.getBadmintonRackets(queryParams);
            break;
          case 'shuttlecocks':
            response = await api.getShuttlecocks(queryParams);
            break;
          case 'shoes':
            response = await api.getBadmintonShoes(queryParams);
            break;
          case 'accessories':
            response = await api.getBadmintonAccessories(queryParams);
            break;
          default:
            response = await api.getAllProducts(queryParams);
        }
        
        const apiResponse: ApiResponse<Product[]> = response.data;
        
        if (apiResponse.success) {
          setAllProducts(apiResponse.data || []);
          setCurrentPage(1); // Reset to first page when data changes
        } else {
          setError(apiResponse.message || 'Không thể tải sản phẩm');
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError('Lỗi kết nối đến server. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentCategory, filters]);

  // Filter handlers
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setFilters({
      minPrice: null,
      maxPrice: null,
      selectedBrands: [],
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const retryFetch = () => {
    // Trigger re-fetch by updating a dependency
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let response;
        
        // Build query parameters with filters
        const queryParams: any = {
          limit: 50,
          sort_by: filters.sortBy,
          sort_order: filters.sortOrder.toUpperCase()
        };
        
        // Add price filters
        if (filters.minPrice) queryParams.min_price = filters.minPrice;
        if (filters.maxPrice) queryParams.max_price = filters.maxPrice;
        
        // Add brand filters
        if (filters.selectedBrands.length > 0) {
          queryParams.brands = filters.selectedBrands.join(',');
        }
        
        // Call the appropriate API based on category
        switch (currentCategory) {
          case 'rackets':
          case 'badminton-rackets':
            response = await api.getBadmintonRackets(queryParams);
            break;
          case 'shuttlecocks':
            response = await api.getShuttlecocks(queryParams);
            break;
          case 'shoes':
            response = await api.getBadmintonShoes(queryParams);
            break;
          case 'accessories':
            response = await api.getBadmintonAccessories(queryParams);
            break;
          default:
            response = await api.getAllProducts(queryParams);
        }
        
        const apiResponse: ApiResponse<Product[]> = response.data;
        
        if (apiResponse.success) {
          setAllProducts(apiResponse.data || []);
          setCurrentPage(1); // Reset to first page when data changes
        } else {
          setError(apiResponse.message || 'Không thể tải sản phẩm');
        }
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError('Lỗi kết nối đến server. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const calculateDiscountPercent = (originalPrice: number, finalPrice: number) => {
    if (!originalPrice || originalPrice <= finalPrice) return 0;
    return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <div className="product-list-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Đang tải sản phẩm...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-list-page">
        <div className="container">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-message">Có lỗi xảy ra</div>
            <p>{error}</p>
            <button onClick={retryFetch} className="retry-button">
              <i className="fas fa-redo-alt"></i>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-list-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span className="separator">•</span>
          <span>{currentCategory ? categoryNames[currentCategory] : 'Sản phẩm'}</span>
        </nav>

        {/* Main Content with Sidebar */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '300px 1fr', 
          gap: '2rem', 
          marginTop: '1rem' 
        }}>
          {/* Filter Sidebar */}
          <div className="sidebar">
            <FilterSidebar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearAllFilters={handleClearAllFilters}
            />
          </div>

          {/* Products Content */}
          <div className="products-content">
            {/* Products Header */}
            <div className="products-header" style={{
              background: 'white',
              borderRadius: '10px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="products-count">
                Tìm thấy <strong>{allProducts.length}</strong> sản phẩm
                {totalPages > 1 && (
                  <span style={{ marginLeft: '1rem', color: '#666' }}>
                    (Trang {currentPage} / {totalPages})
                  </span>
                )}
              </div>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>
                Sắp xếp theo: {filters.sortBy} ({filters.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'})
              </div>
            </div>

            {/* Products Grid */}
            {allProducts.length > 0 ? (
              <>
              <div className="row">
            {currentProducts.map((product: Product) => {
              const originalPrice = parseFloat(product.base_price);
              const finalPrice = parseFloat(product.final_price);
              const discountPercent = calculateDiscountPercent(originalPrice, finalPrice);
              
              return (
              <div key={product.product_id} className="col-6 col-md-3" style={{ marginBottom: '25px' }}>
                <Link to={`/product/${product.product_id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                  <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden', position: 'relative', height: '100%' }}>
                    
                    <div style={{ position: 'absolute', top: '8px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px', zIndex: 2 }}>
                      {discountPercent > 0 && (
                        <span style={{ background: '#E95211', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                          -{discountPercent}%
                        </span>
                      )}
                      <button 
                        className={`wishlist-btn ${wishlistItems.has(product.product_id) ? 'active' : ''}`}
                        onClick={(e) => toggleWishlist(product.product_id, e)}
                        title={wishlistItems.has(product.product_id) ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                        style={{ 
                          background: wishlistItems.has(product.product_id) ? '#e74c3c' : 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <i className={`fa${wishlistItems.has(product.product_id) ? 's' : 'r'} fa-heart`} style={{ color: wishlistItems.has(product.product_id) ? 'white' : '#e74c3c', fontSize: '16px' }}></i>
                      </button>
                    </div>

                    <div style={{ paddingTop: '100%', position: 'relative', background: '#f5f5f5' }}>
                      <img 
                        src={product.primary_image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'} 
                        alt={product.product_name}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>

                    <div style={{ padding: '15px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', minHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {product.product_name}
                      </h3>

                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#E95211', marginBottom: '4px' }}>
                        {formatPrice(finalPrice)}
                      </div>
                      {discountPercent > 0 && (
                        <div style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>
                          {formatPrice(originalPrice)}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  background: currentPage === 1 ? '#f5f5f5' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? '#999' : '#333'
                }}
              >
                ← Trước
              </button>

              <div className="page-numbers" style={{ display: 'flex', gap: '0.25rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      background: pageNum === currentPage ? '#FF6B35' : 'white',
                      color: pageNum === currentPage ? 'white' : '#333',
                      cursor: 'pointer',
                      minWidth: '40px'
                    }}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  background: currentPage === totalPages ? '#f5f5f5' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage === totalPages ? '#999' : '#333'
                }}
              >
                Sau →
              </button>
            </div>
          )}
          </>
        ) : (
              <div className="no-products" style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'white',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div className="no-products-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Hiện tại chưa có sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                <button 
                  onClick={handleClearAllFilters}
                  style={{
                    background: '#FF6B35',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '25px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginRight: '1rem'
                  }}
                >
                  Xóa bộ lọc
                </button>
                <Link to="/" className="btn btn-primary" style={{
                  background: '#6c757d',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  textDecoration: 'none'
                }}>
                  Quay lại trang chủ
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};export default ProductList;
