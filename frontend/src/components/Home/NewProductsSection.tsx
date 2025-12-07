import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';
import '../../styles/NewProductsSection.css';

interface Product {
  product_id: number;
  product_name: string;
  base_price: string;
  sale_price?: string;
  image_url: string;
  category_id: number;
  brand_id: number;
  product_slug?: string;
  featured?: number;
}

interface Category {
  category_id: number;
  category_name: string;
  category_slug?: string;
}

const NewProductsSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [currentPosition, setCurrentPosition] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiClient.get('/products?limit=100'), // Lấy nhiều sản phẩm hơn
          apiClient.get('/categories')
        ]);

        const productsData = Array.isArray(productsResponse.data) 
          ? productsResponse.data 
          : productsResponse.data.data || productsResponse.data.products || [];
        
        const categoriesData = Array.isArray(categoriesResponse.data)
          ? categoriesResponse.data
          : categoriesResponse.data.data || categoriesResponse.data.categories || [];

        setProducts(productsData);
        setCategories(categoriesData);
        
        // Debug: xem cấu trúc product và category
        if (productsData.length > 0) {
          console.log('📦 Sample product:', productsData[0]);
          console.log('📦 Total products:', productsData.length);
          console.log('📦 Products by category:', productsData.reduce((acc: any, p: any) => {
            const catId = p.category_id || p.categoryId;
            acc[catId] = (acc[catId] || 0) + 1;
            return acc;
          }, {}));
        }
        if (categoriesData.length > 0) {
          console.log('📂 Sample category:', categoriesData[0]);
          console.log('📂 Total categories:', categoriesData.length);
          console.log('📂 All categories:', categoriesData.map((c: any) => ({ id: c.category_id, name: c.category_name })));
        }
        
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatPrice = (price: string | number | null | undefined) => {
    if (!price) return '0';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || numPrice === 0) return '0';
    return numPrice.toLocaleString('vi-VN');
  };

  const getFilteredProducts = () => {
    if (activeTab === 0) {
      return products.slice(0, 10); // Tab "Tất cả" hiển thị 10 sản phẩm mới nhất
    }
    // Lọc theo category và lấy 7 sản phẩm đầu tiên
    const filtered = products.filter(p => {
      const categoryId = p.category_id || (p as any).categoryId;
      return categoryId === activeTab;
    });
    
    console.log(`🔍 Filter results for category ${activeTab}:`, filtered.length, 'products');
    if (filtered.length === 0) {
      console.log('Available product category IDs:', products.map(p => p.category_id || (p as any).categoryId));
    }
    
    return filtered.slice(0, 7);
  };

  const handleNext = () => {
    if (!trackRef.current) return;
    const cardWidth = 200; // Approximate card width + gap
    const maxScroll = trackRef.current.scrollWidth - trackRef.current.parentElement!.offsetWidth;
    
    if (currentPosition < maxScroll) {
      const newPosition = Math.min(currentPosition + cardWidth, maxScroll);
      setCurrentPosition(newPosition);
    }
  };

  const handlePrev = () => {
    if (currentPosition > 0) {
      const cardWidth = 200;
      const newPosition = Math.max(currentPosition - cardWidth, 0);
      setCurrentPosition(newPosition);
    }
  };

  const handleTabChange = (categoryId: number) => {
    setActiveTab(categoryId);
    setCurrentPosition(0); // Reset slider position
  };

  if (loading) {
    return (
      <div className="new-products-container">
        <div className="header-section">
          <h2>Sản phẩm mới</h2>
          <div className="header-underline"></div>
        </div>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();
  const displayCategories = categories.slice(0, 6); // Hiển thị tối đa 6 categories

  return (
    <div className="new-products-container">
      {/* Decorative SVG - Left */}
      <div className="hcate-decor hcate-decor-left">
        <img src="https://static.fbshop.vn/template/assets/images/hcate-dcor.svg" alt="" />
      </div>

      {/* Decorative SVG - Right */}
      <div className="hcate-decor hcate-decor-right">
        <img src="https://static.fbshop.vn/template/assets/images/hcate-dcor.svg" alt="" />
      </div>

      {/* Header */}
      <div className="header-section">
        <h2>Sản phẩm mới</h2>
        <div className="header-underline"></div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        <button
          className={`tab-item ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => handleTabChange(0)}
        >
          Tất cả
        </button>
        {displayCategories.map((category) => (
          <button
            key={category.category_id}
            className={`tab-item ${activeTab === category.category_id ? 'active' : ''}`}
            onClick={() => handleTabChange(category.category_id)}
          >
            {category.category_name}
          </button>
        ))}
      </div>

      {/* Slider Container */}
      <div className="slider-container">
        <div className="slider-wrapper">
          <button 
            className="arrow-btn prev-btn" 
            onClick={handlePrev}
            disabled={currentPosition === 0}
          >
            ‹
          </button>
          
          <div className="products-slider">
            <div 
              className="products-track"
              ref={trackRef}
              style={{
                transform: `translateX(-${currentPosition}px)`,
                transition: 'transform 0.3s ease'
              }}
            >
              {filteredProducts.length === 0 ? (
                <div key="no-products" className="no-products">Không có sản phẩm nào</div>
              ) : (
                filteredProducts.map((product) => (
                  <Link
                    key={product.product_id}
                    to={`/product/${product.product_id}`}
                    className="product-card"
                  >
                    <div className="product-image">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.product_name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span>🏸</span>';
                          }}
                        />
                      ) : (
                        <span>🏸</span>
                      )}
                    </div>
                    <div className="product-content">
                      <div className="product-name">{product.product_name}</div>
                      <div className="product-price">
                        <div className="current-price">{formatPrice(product.sale_price || product.base_price)} đ</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <button 
            className="arrow-btn next-btn" 
            onClick={handleNext}
            disabled={!trackRef.current || currentPosition >= (trackRef.current.scrollWidth - trackRef.current.parentElement!.offsetWidth)}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProductsSection;
