import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ProductList.css';

interface Product {
  product_id: number;
  product_name: string;
  product_slug: string;
  base_price: number | string;
  sale_price: number | string;
  final_price: number | string;
  discount_percentage: number | string;
  primary_image?: string | null;
  image_url?: string | null;
  rating_average: number | string;
  rating_count: number | string;
  category_name: string;
  brand_name: string;
  category_id?: number;
}

interface Category {
  category_id: number;
  category_name: string;
  category_slug: string;
}

const SaleProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('discount_desc');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Attribute filters
  const [attributeFilters, setAttributeFilters] = useState<any[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, number[]>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Wishlist state
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set());

  // Load wishlist status
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

      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Không thể cập nhật danh sách yêu thích');
    }
  };

  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ESale%3C/text%3E%3C/svg%3E';

  // Helper function to get image URL
  const getImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl) return placeholderImage;
    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If relative path, prepend backend URL
    return `http://localhost:5000${imageUrl}`;
  };

  const loadSaleProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we should use attribute filter API
      const hasAttributeFilters = Object.keys(selectedAttributes).length > 0;
      
      if (hasAttributeFilters && selectedCategory && [5, 6, 7, 8].includes(selectedCategory)) {
        // Use attribute filter API
        const filters: Record<string, string> = {};
        
        Object.entries(selectedAttributes).forEach(([attrId, valueIds]) => {
          const attr = attributeFilters.find((a: any) => a.attribute_id === parseInt(attrId));
          if (attr) {
            const valueKeys = valueIds
              .map(vId => {
                const val = attr.values?.find((v: any) => v.value_id === vId);
                return val?.value_key;
              })
              .filter(Boolean);
            
            if (valueKeys.length > 0) {
              filters[attr.attribute_key] = valueKeys.join(',');
            }
          }
        });
        
        const response = await api.productAttributes.filterProducts(selectedCategory, filters);
        
        if (response.data.success) {
          let productsData = response.data.data || [];
          
          // Filter only sale products
          productsData = productsData.filter((p: any) => {
            const basePrice = toNumber(p.base_price);
            const salePrice = toNumber(p.sale_price);
            return salePrice > 0 && salePrice < basePrice;
          });
          
          // Apply additional filters
          if (selectedDiscount) {
            productsData = productsData.filter((p: any) => {
              const discount = toNumber(p.discount_percentage);
              return discount >= selectedDiscount;
            });
          }
          
          if (selectedPriceRange) {
            const [min, max] = selectedPriceRange.split('-').map(Number);
            productsData = productsData.filter((p: any) => {
              const price = toNumber(p.sale_price || p.base_price);
              return price >= min && (max === 0 || price <= max);
            });
          }
          
          setProducts(productsData);
          setTotalProducts(productsData.length);
          setTotalPages(1);
        }
      } else {
        // Use regular products API
        const params: any = {
          page: currentPage,
          limit: 20,
          is_featured: true,
          sort_by: sortBy === 'discount_desc' ? 'discount_percentage' : 'final_price',
          sort_order: sortBy === 'price_asc' ? 'asc' : 'desc'
        };

        if (selectedDiscount) params.min_discount = selectedDiscount;
        if (selectedPriceRange) {
          const [min, max] = selectedPriceRange.split('-');
          if (min) params.min_price = min;
          if (max) params.max_price = max;
        }
        if (selectedCategory) params.category_id = selectedCategory;

        const response = await api.getAllProducts(params);

        if (response.data.success) {
          const productsData = Array.isArray(response.data.data) 
            ? response.data.data 
            : response.data.data?.products || [];
          
          setProducts(productsData);
          setTotalPages(response.data.pagination?.totalPages || 1);
          setTotalProducts(response.data.pagination?.totalItems || 0);
        } else {
          setProducts([]);
          setError('Không tìm thấy sản phẩm khuyến mãi.');
        }
      }
    } catch (err: any) {
      console.error('Load sale products error:', err);
      setError('Không thể tải sản phẩm. Vui lòng thử lại.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load products when filters change
  useEffect(() => {
    loadSaleProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedDiscount, selectedPriceRange, sortBy, selectedCategory, selectedAttributes]);

  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null || price === '') return '0 ₫';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0 ₫';
    return numPrice.toLocaleString('vi-VN') + ' ₫';
  };

  const toNumber = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    return typeof value === 'string' ? parseFloat(value) || 0 : value;
  };

  const clearFilters = () => {
    setSelectedDiscount(null);
    setSelectedPriceRange('');
    setSortBy('discount_desc');
    setSelectedCategory(null);
    setSelectedAttributes({});
    setCurrentPage(1);
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/categories');
        if (response.data.success) {
          setCategories(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Load attribute filters when category changes
  useEffect(() => {
    const loadAttributeFilters = async () => {
      if (selectedCategory && [5, 6, 7, 8].includes(selectedCategory)) {
        try {
          const response = await api.productAttributes.getFilterOptions(selectedCategory);
          if (response.data.success) {
            setAttributeFilters(response.data.data || []);
          }
        } catch (error) {
          console.error('Error loading attribute filters:', error);
          setAttributeFilters([]);
        }
      } else {
        setAttributeFilters([]);
        setSelectedAttributes({});
      }
    };

    loadAttributeFilters();
  }, [selectedCategory]);

  // Handle attribute filter change
  const handleAttributeChange = (attributeId: number, valueId: number) => {
    setSelectedAttributes(prev => {
      const current = prev[attributeId] || [];
      const newValues = current.includes(valueId)
        ? current.filter(id => id !== valueId)
        : [...current, valueId];
      
      if (newValues.length === 0) {
        const { [attributeId]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [attributeId]: newValues };
    });
    setCurrentPage(1);
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
        <p style={{ fontSize: '18px', color: '#666' }}>Đang tải sản phẩm khuyến mãi...</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
        <p style={{ fontSize: '18px', color: '#e74c3c', marginBottom: '20px' }}>{error}</p>
        <button onClick={loadSaleProducts} style={{
          padding: '12px 30px',
          background: '#E95211',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}>
          Thử lại
        </button>
      </div>
    );
  }

  // ============================================
  // 🎨 CHỈNH KÍCH THƯỚC TRANG TẠI ĐÂY
  // ============================================
  const PAGE_MAX_WIDTH = '1400px';  // Độ rộng tối đa của trang
  const PAGE_PADDING = '20px 40px'; // Khoảng cách 2 bên

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '40px' }}>
      <style>{`
        @media (min-width: 768px) {
          .sidebar-left { 
            order: 1 !important; 
            width: 25% !important;
            flex: 0 0 25% !important;
          }
          .products-right { 
            order: 2 !important;
            width: 75% !important;
            flex: 0 0 75% !important;
          }
        }
        @media (max-width: 767px) {
          .sidebar-left { order: 2 !important; }
          .products-right { order: 1 !important; }
        }
        
        .sale-products-grid {
          display: grid;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        /* Mobile: 2 sản phẩm/hàng */
        @media (max-width: 767px) {
          .sale-products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* Tablet: 3 sản phẩm/hàng */
        @media (min-width: 768px) and (max-width: 991px) {
          .sale-products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* Desktop: 4 sản phẩm/hàng */
        @media (min-width: 992px) {
          .sale-products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
      
      {/* Breadcrumb */}
      <div style={{ background: '#fff', padding: '15px 0', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ maxWidth: PAGE_MAX_WIDTH, margin: '0 auto', padding: '0 40px' }}>
          <ul style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, alignItems: 'center', fontSize: '14px' }}>
            <li>
              <Link to="/" style={{ color: '#333', textDecoration: 'none' }}>Trang chủ</Link>
              <span style={{ margin: '0 8px', color: '#999' }}>›</span>
            </li>
            <li><strong style={{ color: '#E95211' }}>Sản phẩm thanh lý</strong></li>
          </ul>
        </div>
      </div>

      <div style={{ paddingTop: '30px' }}>
        <div style={{ maxWidth: PAGE_MAX_WIDTH, margin: '0 auto', padding: PAGE_PADDING }}>
          <div className="row" style={{ margin: '0 -15px', display: 'flex', flexWrap: 'wrap' }}>
            
            {/* Sidebar */}
            <aside className="col-12 col-lg-3 sidebar-left" style={{ 
              marginBottom: '30px',
              paddingLeft: '15px',
              paddingRight: '15px',
              float: 'left'
            }}>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                
                {(selectedDiscount || selectedPriceRange || selectedCategory || Object.keys(selectedAttributes).length > 0) && (
                  <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>Bạn chọn</span>
                      <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#E95211', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                        Bỏ hết ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Range */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #E95211' }}>
                    Chọn mức giá
                  </h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                      { label: 'Tất cả', value: '' },
                      { label: 'Giá dưới 500.000đ', value: '0-500000' },
                      { label: '500.000đ - 1 triệu', value: '500000-1000000' },
                      { label: '1 - 2 triệu', value: '1000000-2000000' },
                      { label: '2 - 3 triệu', value: '2000000-3000000' },
                      { label: 'Giá trên 3 triệu', value: '3000000-999999999' }
                    ].map(range => (
                      <li key={range.value} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                          <input type="checkbox" checked={selectedPriceRange === range.value} onChange={() => { setSelectedPriceRange(selectedPriceRange === range.value ? '' : range.value); setCurrentPage(1); }} style={{ marginRight: '10px' }} />
                          <span style={{ fontSize: '14px' }}>{range.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Attribute Filters */}
                {attributeFilters.map((attr: any) => (
                  <div key={attr.attribute_id} style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #E95211' }}>
                      {attr.attribute_name}
                    </h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {attr.values && attr.values.length > 0 ? (
                        attr.values.map((value: any) => {
                          const isSelected = (selectedAttributes[attr.attribute_id] || []).includes(value.value_id);
                          const count = value.product_count || 0;
                          
                          return (
                            <li key={value.value_id} style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleAttributeChange(attr.attribute_id, value.value_id)}
                                  style={{ marginRight: '10px' }}
                                />
                                <span style={{ fontSize: '14px' }}>
                                  {value.value_name}
                                  {count > 0 && (
                                    <span style={{ color: '#999', fontSize: '12px', marginLeft: '5px' }}>
                                      ({count})
                                    </span>
                                  )}
                                </span>
                              </label>
                            </li>
                          );
                        })
                      ) : (
                        <li style={{ padding: '8px' }}>
                          <span style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
                            Chưa có tùy chọn
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}

                {/* Discount Filter */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #E95211' }}>
                    Mức giảm giá
                  </h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                        <input type="radio" name="discount" checked={selectedDiscount === null} onChange={() => { setSelectedDiscount(null); setCurrentPage(1); }} style={{ marginRight: '10px' }} />
                        <span style={{ fontSize: '14px' }}>Tất cả</span>
                      </label>
                    </li>
                    {[70, 60, 50, 40, 30, 20].map(discount => (
                      <li key={discount} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                          <input type="radio" name="discount" checked={selectedDiscount === discount} onChange={() => { setSelectedDiscount(discount); setCurrentPage(1); }} style={{ marginRight: '10px' }} />
                          <span style={{ fontSize: '14px' }}>{discount}%</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Category Filter - Moved to bottom */}
                <div style={{ marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #E95211' }}>
                    Danh mục sản phẩm
                  </h2>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <li style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                        <input type="radio" name="category" checked={selectedCategory === null} onChange={() => { setSelectedCategory(null); setCurrentPage(1); }} style={{ marginRight: '10px' }} />
                        <span style={{ fontSize: '14px' }}>Tất cả</span>
                      </label>
                    </li>
                    {categories.map(category => (
                      <li key={category.category_id} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                          <input 
                            type="radio" 
                            name="category" 
                            checked={selectedCategory === category.category_id} 
                            onChange={() => { 
                              setSelectedCategory(category.category_id); 
                              setCurrentPage(1); 
                            }} 
                            style={{ marginRight: '10px' }} 
                          />
                          <span style={{ fontSize: '14px' }}>{category.category_name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            {/* Products */}
            <div className="col-12 col-lg-9 products-right" style={{
              paddingLeft: '15px',
              paddingRight: '15px',
              float: 'left'
            }}>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '20px',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>Sản phẩm thanh lý</h1>
                  
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}>
                    <option value="discount_desc">Giảm giá nhiều nhất</option>
                    <option value="price_asc">Giá thấp đến cao</option>
                    <option value="price_desc">Giá cao đến thấp</option>
                  </select>
                </div>

                {products.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>😢</div>
                    <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Không tìm thấy sản phẩm</h3>
                    <p style={{ color: '#666', marginBottom: '20px' }}>Thử thay đổi bộ lọc hoặc tìm kiếm khác</p>
                    <button onClick={clearFilters} style={{ padding: '10px 24px', background: '#E95211', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Xóa bộ lọc</button>
                  </div>
                ) : (
                  <>
                    <div className="sale-products-grid">
                      {products.map((product) => {
                        // Calculate prices safely
                        const basePrice = toNumber(product.base_price);
                        const salePrice = toNumber(product.sale_price);
                        const finalPrice = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
                        const discountPercent = salePrice > 0 && salePrice < basePrice 
                          ? Math.round((1 - salePrice / basePrice) * 100)
                          : 0;

                        return (
                        <div key={product.product_id} style={{ marginBottom: '5px' }}>
                          <Link to={`/product/${product.product_slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                            <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden', position: 'relative', height: '100%' }}>
                              
                              <div style={{ position: 'absolute', top: '8px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 8px', zIndex: 2 }}>
                                {discountPercent > 0 && (
                                  <span style={{ background: '#E95211', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                                    Giảm {discountPercent}%
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
                                <img src={getImageUrl(product.image_url || product.primary_image)} alt={product.product_name} 
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => { (e.target as HTMLImageElement).src = placeholderImage; }} />
                              </div>

                              <div style={{ padding: '15px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px', minHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {product.product_name}
                                </h3>

                                {discountPercent > 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'nowrap' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF6B35', whiteSpace: 'nowrap' }}>
                                      {formatPrice(finalPrice)}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#000', opacity: '0.5', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                                      {formatPrice(basePrice)}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF6B35', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                                    {formatPrice(finalPrice)}
                                  </div>
                                )}

                                {toNumber(product.rating_average) > 0 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', marginTop: '8px' }}>
                                    <span style={{ color: '#ffc107' }}>⭐</span>
                                    <span>{toNumber(product.rating_average).toFixed(1)}</span>
                                    <span style={{ color: '#999' }}>({product.rating_count})</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        </div>
                        );
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #e0e0e0' }}>
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '8px 16px', border: '1px solid #ddd', background: currentPage === 1 ? '#f5f5f5' : '#fff', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                          ← Trước
                        </button>
                        <span style={{ fontSize: '14px' }}>Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong></span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '8px 16px', border: '1px solid #ddd', background: currentPage === totalPages ? '#f5f5f5' : '#fff', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                          Sau →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
          <div style={{ clear: 'both' }}></div>
        </div>
      </div>
    </div>
  );
};

export default SaleProducts;
