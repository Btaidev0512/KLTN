import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category_id: number;
  brand_id: number;
  featured?: boolean;
}

const FeaturedProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await apiClient.get('/products');
        // Kiểm tra xem response.data có phải là mảng không
        const productsData = Array.isArray(response.data) ? response.data : response.data.products || [];
        // Giả lập lấy sản phẩm nổi bật (4 sản phẩm đầu)
        const featuredProducts = productsData.slice(0, 4);
        setProducts(featuredProducts);
      } catch (error) {
        console.error('Error fetching featured products:', error);
        // No fallback - show empty
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Sản phẩm nổi bật</h2>
          <div className="products-grid">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="product-card loading">
                <div className="product-image-skeleton"></div>
                <div className="product-info">
                  <div className="skeleton-line"></div>
                  <div className="skeleton-line short"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-products">
      <div className="container">
        <h2 className="section-title">Sản phẩm nổi bật</h2>
        <div className="products-grid">
          {Array.isArray(products) && products.map((product) => (
            <Link 
              key={product.id} 
              to={`/products/${product.id}`}
              className="product-card"
            >
              <div className="product-image">
                <img 
                  src={product.image} 
                  alt={product.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/placeholder-product.jpg';
                  }}
                />
                <div className="product-overlay">
                  <span className="view-details">Xem chi tiết</span>
                </div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">{formatPrice(product.price)}</p>
                <div className="product-actions">
                  <button className="btn btn-small btn-primary">
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="section-footer">
          <Link to="/products" className="btn btn-outline">
            Xem tất cả sản phẩm
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;