import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import SortDropdown, { defaultSortOptions } from '../components/SortDropdown';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorMessage from '../components/UI/ErrorMessage';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import { PLACEHOLDER_IMAGE, getFullImageUrl } from '../utils/constants';

// Interface cho Product
interface Product {
  product_id: number;
  product_name: string;
  product_slug: string;
  base_price: number | string;
  sale_price?: number | string;
  image_url?: string;
  product_image?: string;
  stock_quantity: number;
  rating_average?: number | string;
  discount_percentage?: number | string;
  category_name?: string;
}

// Interface cho Category
interface Category {
  category_id: number;
  category_name: string;
  category_slug: string;
}

// Helper to get sort params from sort value
const getSortParams = (value: string) => {
  const option = defaultSortOptions.find(opt => opt.value === value);
  if (!option || value === 'default') {
    return { sort_by: 'created_at', sort_order: 'DESC' };
  }
  return {
    sort_by: option.sort_by,
    sort_order: option.sort_order
  };
};

const Products: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get category from query parameter OR from URL path
  const categoryFromQuery = searchParams.get('category');
  const activeCategorySlug = categoryFromQuery || categorySlug;
  
  // Get sale filter from query parameter
  const saleFilter = searchParams.get('sale') === 'true';
  
  // Helper function to get full image URL
  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) {
      return PLACEHOLDER_IMAGE;
    }
    // If URL already starts with http:// or https://, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('✅ Using full URL:', imageUrl);
      return imageUrl;
    }
    // Remove leading slash if exists to avoid double slashes
    const cleanPath = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
    // Otherwise, prepend backend URL
    const fullUrl = `http://localhost:5000${cleanPath}`;
    console.log('🔗 Using backend URL:', fullUrl);
    return fullUrl;
  };
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('search') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');
  
  // Attribute filters
  const [attributeFilters, setAttributeFilters] = useState<any[]>([]); // Available filters for current category
  const [selectedAttributes, setSelectedAttributes] = useState<Record<number, number[]>>({}); // {attribute_id: [value_id1, value_id2]}
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null); // Track selected brand for racket series filter
  const [brands, setBrands] = useState<any[]>([]); // List of all brands for filter
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 20;

  // Wishlist state
  const { isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set());

  // Sync searchTerm with URL params
  useEffect(() => {
    const search = searchParams.get('search') || '';
    setSearchTerm(search);
  }, [searchParams]);

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

      // Dispatch event to update header count
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert('Không thể cập nhật danh sách yêu thích');
    }
  };

  // Helper functions
  const toNumber = (value: number | string | undefined): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  };

  const formatPrice = (price: number | string | undefined): string => {
    const numPrice = toNumber(price);
    return numPrice.toLocaleString('vi-VN') + ' ₫';
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
        setError('Không thể tải danh mục sản phẩm. Vui lòng thử lại sau.');
      }
    };
    
    const fetchBrands = async () => {
      try {
        const response = await api.getAllBrands();
        if (response.data.success) {
          setBrands(response.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    
    fetchCategories();
    fetchBrands();
  }, []);

  // Load attribute filters when category changes
  useEffect(() => {
    const loadAttributeFilters = async () => {
      console.log('📍 Categories available:', categories.length, categories.map(c => ({id: c.category_id, slug: c.category_slug})));
      console.log('📍 Looking for slug:', activeCategorySlug);
      
      // Find current category ID
      const category = categories.find(c => c.category_slug === activeCategorySlug);
      const categoryId = category?.category_id;
      
      console.log('🔍 Loading filters for category:', activeCategorySlug, 'ID:', categoryId, 'Category:', category);
      
      setCurrentCategoryId(categoryId || null);
      
      // Load filters for ALL categories
      if (categoryId) {
        console.log('✅ Loading filters for category:', categoryId, 'with brandId:', selectedBrandId);
        try {
          console.log('📡 Calling API: /product-attributes/category/' + categoryId + '/filters');
          const response = await api.productAttributes.getFilterOptions(categoryId, selectedBrandId || undefined);
          console.log('📦 Filter response:', response.data);
          if (response.data.success) {
            setAttributeFilters(response.data.data || []);
            console.log('✅ Filters loaded:', response.data.data);
          }
        } catch (error) {
          console.error('❌ Error loading attribute filters:', error);
          setAttributeFilters([]);
        }
      } else {
        console.log('⏭️ No category selected, clearing filters');
        setAttributeFilters([]);
        setSelectedAttributes({});
      }
    };

    if (categories.length > 0) {
      console.log('🚀 Triggering loadAttributeFilters because categories loaded');
      loadAttributeFilters();
    } else {
      console.log('⏳ Waiting for categories to load...');
    }
  }, [activeCategorySlug, categories, selectedBrandId]);

  // Debug: Log when filters change
  useEffect(() => {
    console.log('🎨 Attribute filters updated:', attributeFilters.length, attributeFilters);
  }, [attributeFilters]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Check if we should use attribute filter API
        const hasAttributeFilters = Object.keys(selectedAttributes).length > 0;
        const category = categories.find(c => c.category_slug === activeCategorySlug);
        const categoryId = category?.category_id;
        
        // Use attribute filter API if has filters selected
        if (hasAttributeFilters && categoryId) {
          console.log('🎯 Using attribute filter API');
          
          // Convert selectedAttributes to API format: {attribute_key: 'value1,value2'}
          const filters: Record<string, string> = {};
          
          Object.entries(selectedAttributes).forEach(([attrId, valueIds]) => {
            const attr = attributeFilters.find((a: any) => a.attribute_id === parseInt(attrId));
            if (attr && valueIds.length > 0) {
              // Map value IDs to value keys
              const valueKeys = valueIds
                .map(vId => {
                  const val = attr.values?.find((v: any) => v.value_id === vId);
                  return val?.value_key;
                })
                .filter(Boolean);
              
              // QUAN TRỌNG: Nếu chọn nhiều giá trị (VD: M,S,XL) thì chỉ lấy sản phẩm có TẤT CẢ các giá trị đó
              // Không nên join bằng dấu phẩy vì sẽ thành logic OR
              // Thay vào đó, chỉ cho phép chọn 1 giá trị tại 1 thời điểm
              if (valueKeys.length > 0) {
                // Chỉ lấy giá trị đầu tiên - không cho phép chọn nhiều size cùng lúc
                filters[attr.attribute_key] = valueKeys[0];
              }
            }
          });
          
          console.log('📦 Attribute filters:', filters);
          
          // Only call API if we have valid filters
          if (Object.keys(filters).length === 0) {
            console.log('⚠️ No valid filters, using regular API');
            const response = await axios.get('http://localhost:5000/api/products', {
              params: {
                category_id: categoryId,
                page: currentPage,
                limit: productsPerPage
              }
            });
            if (response.data.success) {
              setProducts(response.data.data || []);
              setTotalPages(response.data.totalPages || 1);
            }
            setLoading(false);
            return;
          }
          
          const response = await api.productAttributes.filterProducts(categoryId, filters);
          console.log('🖼️ Filter API response:', JSON.stringify(response.data, null, 2));
          
          if (response.data.success) {
            let productsData = response.data.data || [];
            console.log('🖼️ First product:', JSON.stringify(productsData[0], null, 2));
            console.log('🖼️ Image URL:', productsData[0]?.image_url);
            console.log('🖼️ Product Image:', productsData[0]?.product_image);
            
            // Apply additional filters client-side
            if (selectedPriceRange) {
              const [min, max] = selectedPriceRange.split('-').map(Number);
              productsData = productsData.filter((p: any) => {
                const price = toNumber(p.base_price);
                return price >= min && (max === 0 || price <= max);
              });
            }
            
            if (searchTerm && searchTerm.trim()) {
              const search = searchTerm.toLowerCase();
              productsData = productsData.filter((p: any) => 
                p.product_name?.toLowerCase().includes(search)
              );
            }
            
            // Apply sorting
            if (sortBy !== 'default') {
              const sortParams = getSortParams(sortBy);
              const sortKey = sortParams.sort_by || 'created_at';
              productsData.sort((a: any, b: any) => {
                const aVal = a[sortKey];
                const bVal = b[sortKey];
                if (sortParams.sort_order === 'ASC') {
                  return aVal > bVal ? 1 : -1;
                } else {
                  return aVal < bVal ? 1 : -1;
                }
              });
            }
            
            setProducts(productsData);
            setTotalPages(1); // Client-side pagination not implemented yet
          }
        } else {
          // Use regular products API
          const url = 'http://localhost:5000/api/products';
          const params: any = {
            page: currentPage,
            limit: productsPerPage
          };

          // Add search term
          if (searchTerm && searchTerm.trim()) {
            params.search = searchTerm.trim();
            console.log('🔍 Searching for:', searchTerm);
          }

          // Add category filter
          if (activeCategorySlug) {
            if (category) {
              params.category_id = category.category_id;
              setCurrentCategory(category.category_name || '');
            }
          }

          // Add brand filter
          if (selectedBrandId) {
            params.brand_id = selectedBrandId;
          }

          // Add price range filter
          if (selectedPriceRange) {
            const [min, max] = selectedPriceRange.split('-').map(Number);
            params.min_price = min;
            if (max > 0) params.max_price = max;
          }

          // Add sort using helper function
          if (sortBy !== 'default') {
            const sortParams = getSortParams(sortBy);
            params.sort_by = sortParams.sort_by;
            params.sort_order = sortParams.sort_order;
          }

          // Add sale filter if present
          if (saleFilter) {
            params.on_sale = true;
          }

          console.log('📡 Fetching products with params:', params);
          const response = await axios.get(url, { params });
          
          console.log('✅ API Response:', response.data);
          
          if (response.data.success) {
            const productsData = response.data.data || [];
            console.log(`📦 Received ${productsData.length} products`);
            setProducts(productsData);
            setTotalPages(response.data.totalPages || response.data.pagination?.totalPages || 1);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategorySlug, currentPage, selectedPriceRange, sortBy, categories, searchTerm, selectedAttributes, attributeFilters, saleFilter, selectedBrandId]);

  // Handle price filter change
  const handlePriceChange = (range: string) => {
    setSelectedPriceRange(range === selectedPriceRange ? '' : range);
    setCurrentPage(1);
  };

  // Handle attribute filter change - CHỈ CHO PHÉP CHỌN 1 GIÁ TRỊ TẠI 1 THỜI ĐIỂM
  const handleAttributeChange = (attributeId: number, valueId: number) => {
    setSelectedAttributes(prev => {
      const current = prev[attributeId] || [];
      const isSelected = current.includes(valueId);
      
      if (isSelected) {
        // Bỏ chọn - xóa attribute này hoàn toàn
        const { [attributeId]: _, ...rest } = prev;
        return rest;
      } else {
        // Chọn mới - CHỈ LƯU 1 GIÁ TRỊ DUY NHẤT (không cho chọn nhiều)
        return { ...prev, [attributeId]: [valueId] };
      }
    });
    setCurrentPage(1);
  };

  // Handle category change
  const handleCategoryChange = (slug: string) => {
    if (slug === activeCategorySlug) {
      navigate('/products');
    } else {
      navigate(`/products/${slug}`);
    }
    setCurrentPage(1);
    setSelectedBrandId(null); // Reset brand when category changes
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedPriceRange('');
    setSortBy('default');
    setSearchTerm('');
    setSelectedAttributes({});
    setCurrentPage(1);
    if (activeCategorySlug) {
      navigate('/products');
    }
  };

  // Only show clear button when user actively selected filters (not including URL category)
  const hasActiveFilters = selectedPriceRange || sortBy !== 'default' || searchTerm || Object.keys(selectedAttributes).length > 0;

  // Price ranges
  const priceRanges = [
    { label: 'Dưới 500.000đ', value: '0-500000' },
    { label: '500.000đ - 1 triệu', value: '500000-1000000' },
    { label: '1 - 2 triệu', value: '1000000-2000000' },
    { label: '2 - 3 triệu', value: '2000000-3000000' },
    { label: 'Trên 3 triệu', value: '3000000-999999999' }
  ];

  // Show loading spinner
  if (loading && products.length === 0) {
    return <LoadingSpinner text="Đang tải sản phẩm..." fullScreen={true} />;
  }

  // Show error message
  if (error) {
    return (
      <ErrorMessage 
        message={error} 
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
        fullScreen={true}
      />
    );
  }

  // ============================================
  // 🎨 CHỈNH KÍCH THƯỚC TRANG TẠI ĐÂY
  // ============================================
  const PAGE_MAX_WIDTH = '1400px';  // Thay đổi giá trị này để điều chỉnh độ rộng tối đa
  const PAGE_PADDING = '20px 40px'; // Khoảng cách 2 bên (trái-phải trên-dưới)
  
  return (
    <div style={{ 
      maxWidth: PAGE_MAX_WIDTH,
      margin: '0 auto',
      padding: PAGE_PADDING,
      paddingBottom: '40px'
    }}>
      <SEO 
        title={currentCategory || 'Sản phẩm'}
        description={`Khám phá ${currentCategory ? currentCategory.toLowerCase() : 'sản phẩm'} chất lượng cao tại VNBSports. Giá tốt, giao hàng nhanh.`}
        keywords={`${currentCategory}, cầu lông, VNBSports, mua sắm trực tuyến`}
      />

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" style={{ marginBottom: '20px' }}>
        <ol className="breadcrumb" style={{ 
          background: '#f8f9fa', 
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <li className="breadcrumb-item">
            <Link to="/" style={{ color: '#333', textDecoration: 'none' }}>Trang chủ</Link>
          </li>
          {currentCategory && (
            <li className="breadcrumb-item active" aria-current="page">
              {currentCategory}
            </li>
          )}
          {!currentCategory && (
            <li className="breadcrumb-item active" aria-current="page">
              Sản phẩm
            </li>
          )}
        </ol>
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-left {
            order: 1;
            width: 25%;
            flex: 0 0 25%;
          }
          .products-right {
            order: 2;
            width: 75%;
            flex: 0 0 75%;
          }
        }
        
        .filter-item input[type="checkbox"],
        .filter-item input[type="radio"] {
          width: 18px;
          height: 18px;
          margin-right: 8px;
          cursor: pointer;
        }
        
        .filter-item label {
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 8px 0;
          margin: 0;
          font-size: 14px;
        }
        
        .filter-item label:hover {
          color: #e95211;
        }
        
        .category-item {
          padding: 10px 15px;
          margin: 5px 0;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }
        
        .category-item:hover {
          background: #f8f9fa;
          color: #e95211;
        }
        
        .category-item.active {
          background: #e95211;
          color: white;
        }
        
        .product-card {
          border: 1px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.3s ease;
          height: 100%;
          background: white;
        }
        
        .product-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: translateY(-5px);
        }
        
        .product-image-wrapper {
          position: relative;
          padding-top: 100%;
          overflow: hidden;
          background: #f8f9fa;
        }
        
        .product-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .product-badges {
          position: absolute;
          top: 10px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0 10px;
          z-index: 2;
        }
        
        .discount-badge {
          background: #ff4444;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-weight: bold;
          font-size: 12px;
        }
        
        .wishlist-btn {
          background: rgba(255, 255, 255, 0.95);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .wishlist-btn:hover {
          background: white;
          transform: scale(1.15);
          box-shadow: 0 4px 16px rgba(255, 107, 53, 0.3);
        }
        
        .wishlist-btn i {
          color: #FF6B35;
          font-size: 17px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .wishlist-btn.active {
          background: #FF6B35;
          animation: heartBeat 0.3s ease;
        }
        
        .wishlist-btn.active i {
          color: white;
        }
        
        .wishlist-btn.active:hover {
          background: #E55A2B;
          box-shadow: 0 4px 16px rgba(255, 107, 53, 0.4);
        }

        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        
        .out-of-stock-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          font-weight: bold;
        }
      `}</style>

      <div className="row" style={{ display: 'flex', flexWrap: 'wrap', margin: '0 -15px' }}>
        {/* Sidebar */}
        <aside className="col-12 col-lg-3 sidebar-left" style={{ 
          padding: '0 15px',
          float: 'left'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Bạn chọn</span>
                  <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#E95211', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
                    Bỏ hết ✕
                  </button>
                </div>
              </div>
            )}

            {/* Price Filter */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '2px solid #e95211'
              }}>
                Chọn mức giá
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {priceRanges.map((range) => (
                  <li key={range.value} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedPriceRange === range.value}
                        onChange={() => handlePriceChange(range.value)}
                        style={{ marginRight: '10px' }}
                      />
                      <span style={{ fontSize: '14px' }}>{range.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brand Filter - Only for Vợt cầu lông (category_id = 1) */}
            {currentCategoryId === 1 && brands.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e95211'
                }}>
                  Thương hiệu
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {brands.map((brand: any) => {
                    const isSelected = selectedBrandId === brand.brand_id;
                    
                    return (
                      <li key={brand.brand_id} style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px' }}>
                          <input
                            type="radio"
                            name="brand"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedBrandId(brand.brand_id);
                              setCurrentPage(1);
                            }}
                            style={{ marginRight: '10px' }}
                          />
                          <span style={{ fontSize: '14px' }}>
                            {brand.brand_name}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {selectedBrandId && (
                  <button
                    onClick={() => {
                      setSelectedBrandId(null);
                      setCurrentPage(1);
                    }}
                    style={{
                      marginTop: '10px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      background: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    Xóa lọc thương hiệu
                  </button>
                )}
              </div>
            )}

            {/* Attribute Filters - Hiển thị theo category */}
            {attributeFilters.map((attr: any) => (
              <div key={attr.attribute_id} style={{ marginBottom: '30px' }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e95211'
                }}>
                  {attr.attribute_name}
                  {attr.is_required ? ' *' : ''}
                </h3>
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

            {/* Categories Filter */}
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: 'bold', 
                marginBottom: '15px',
                paddingBottom: '10px',
                borderBottom: '2px solid #e95211'
              }}>
                Danh mục sản phẩm
              </h3>
              <div>
                {categories.map((category) => (
                  <div
                    key={category.category_id}
                    className={`category-item ${activeCategorySlug === category.category_slug ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category.category_slug)}
                  >
                    {category.category_name}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* Products Section */}
        <div className="col-12 col-lg-9 products-right" style={{ 
          padding: '0 15px',
          float: 'left'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            
            {/* Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              gap: '20px',
              flexWrap: 'wrap'
            }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                margin: '0',
                color: '#333'
              }}>
                {currentCategory}
              </h1>

              <SortDropdown
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
                size="small"
              />
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px', fontSize: '16px', color: '#666' }}>
                Đang tải sản phẩm...
              </div>
            )}

            {/* No Products */}
            {!loading && products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
                  Không tìm thấy sản phẩm nào
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      background: '#e95211',
                      color: 'white',
                      border: 'none',
                      padding: '10px 30px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            )}

            {/* Products Grid */}
            {!loading && products.length > 0 && (
              <>
                <style>{`
                  .products-grid-5 {
                    display: grid;
                    gap: 20px;
                    margin-bottom: 30px;
                  }
                  
                  /* Mobile: 2 sản phẩm/hàng */
                  @media (max-width: 767px) {
                    .products-grid-5 {
                      grid-template-columns: repeat(2, 1fr);
                    }
                  }
                  
                  /* Tablet: 3 sản phẩm/hàng */
                  @media (min-width: 768px) and (max-width: 991px) {
                    .products-grid-5 {
                      grid-template-columns: repeat(3, 1fr);
                    }
                  }
                  
                  /* Desktop: 4 sản phẩm/hàng */
                  @media (min-width: 992px) {
                    .products-grid-5 {
                      grid-template-columns: repeat(4, 1fr);
                    }
                  }
                `}</style>
                <div className="products-grid-5">
                  {products.map((product) => {
                    const basePrice = toNumber(product.base_price);
                    const salePrice = toNumber(product.sale_price);
                    const finalPrice = salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
                    const hasDiscount = salePrice > 0 && salePrice < basePrice;
                    const discountPercent = hasDiscount ? Math.round((1 - salePrice / basePrice) * 100) : 0;

                    return (
                      <div key={product.product_id} style={{ marginBottom: '5px' }}>
                        <Link 
                          to={`/product/${product.product_slug}`} 
                          style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
                        >
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
                                  background: wishlistItems.has(product.product_id) ? '#FF6B35' : 'rgba(255, 255, 255, 0.95)',
                                  border: 'none',
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                  transition: 'all 0.3s ease',
                                  marginLeft: 'auto'
                                }}
                              >
                                <i 
                                  className={`fa${wishlistItems.has(product.product_id) ? 's' : 'r'} fa-heart`} 
                                  style={{ 
                                    color: wishlistItems.has(product.product_id) ? 'white' : '#FF6B35', 
                                    fontSize: '16px',
                                    transition: 'all 0.3s ease'
                                  }}
                                ></i>
                              </button>
                            </div>

                            {product.stock_quantity === 0 && (
                              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold', zIndex: 1 }}>
                                Hết hàng
                              </div>
                            )}

                            <div style={{ paddingTop: '100%', position: 'relative', background: '#f5f5f5' }}>
                              <img
                                src={getImageUrl(product.image_url || product.product_image)}
                                alt={product.product_name}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  console.error('❌ Image failed:', e.currentTarget.src);
                                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                                }}
                                onLoad={(e) => {
                                  console.log('✅ Image loaded:', e.currentTarget.src);
                                }}
                              />
                            </div>
                            
                            <div style={{ padding: '15px' }}>
                              <h3 style={{ 
                                fontSize: '14px', 
                                fontWeight: '500',
                                marginBottom: '10px',
                                minHeight: '40px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {product.product_name}
                              </h3>
                              
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#E95211', marginBottom: '4px' }}>
                                {formatPrice(finalPrice)}
                              </div>
                              {hasDiscount && (
                                <div style={{ fontSize: '13px', color: '#999', textDecoration: 'line-through' }}>
                                  {formatPrice(basePrice)}
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
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '30px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 15px',
                        border: '1px solid #ddd',
                        background: currentPage === 1 ? '#f5f5f5' : 'white',
                        borderRadius: '5px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      « Trước
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          style={{
                            padding: '8px 15px',
                            border: '1px solid #ddd',
                            background: currentPage === pageNum ? '#e95211' : 'white',
                            color: currentPage === pageNum ? 'white' : '#333',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 15px',
                        border: '1px solid #ddd',
                        background: currentPage === totalPages ? '#f5f5f5' : 'white',
                        borderRadius: '5px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Sau »
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
  );
};

export default Products;
