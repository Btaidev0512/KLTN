import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { PLACEHOLDER_IMAGE } from '../utils/constants';
import { formatPrice } from '../utils/formatPrice';

interface RelatedProductsProps {
  categoryId: number;
  currentProductId?: number;
  title?: string;
  maxItems?: number;
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ 
  categoryId,
  currentProductId, 
  title = 'Sản phẩm liên quan',
  maxItems = 10
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRelatedProducts = async () => {
      try {
        setLoading(true);
        const response = await api.getAllProducts({ 
          category_id: categoryId, 
          limit: maxItems + 1 
        });
        
        if (response.data.success) {
          let items = response.data.data || [];
          
          // Exclude current product
          if (currentProductId) {
            items = items.filter((p: any) => p.product_id !== currentProductId);
          }
          
          // Fix image URLs
          items = items.map((product: any) => {
            const imageUrl = product.image_url || product.product_image;
            let fullImageUrl = PLACEHOLDER_IMAGE;
            
            if (imageUrl) {
              if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                fullImageUrl = imageUrl;
              } else {
                const cleanPath = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
                fullImageUrl = `http://localhost:5000${cleanPath}`;
              }
            }
            
            return {
              ...product,
              image_url: fullImageUrl
            };
          });
          
          setProducts(items.slice(0, maxItems));
        }
      } catch (error) {
        console.error('Error loading related products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      loadRelatedProducts();
    }
  }, [categoryId, currentProductId, maxItems]);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (carouselRef.current) {
      setScrollPosition(carouselRef.current.scrollLeft);
    }
  };

  if (loading || products.length === 0) {
    return null;
  }

  const showLeftArrow = scrollPosition > 0;
  const showRightArrow = carouselRef.current 
    ? scrollPosition < (carouselRef.current.scrollWidth - carouselRef.current.clientWidth - 10)
    : products.length > 5;

  return (
    <div style={{ 
      padding: '40px 0',
      backgroundColor: '#f9f9f9',
      overflow: 'hidden'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '700',
          marginBottom: '30px',
          color: '#333',
          textAlign: 'center'
        }}>
          {title}
        </h2>
        
        <div style={{ position: 'relative', margin: '0 auto', padding: '0 50px' }}>
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              style={{
                position: 'absolute',
                left: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF6B35';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#333';
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          )}

          {/* Products Carousel */}
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            style={{
              display: 'flex',
              gap: '20px',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '10px 5px',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <style>
              {`
                div::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            {products.map((product) => (
              <Link
                key={product.product_id}
                to={`/products/${product.product_slug}`}
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit',
                  minWidth: '240px',
                  maxWidth: '240px',
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                }}
              >
                <div style={{ 
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  height: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                >
                  <div style={{ 
                    paddingTop: '100%', 
                    position: 'relative', 
                    background: '#f5f5f5' 
                  }}>
                    <img
                      src={product.image_url || PLACEHOLDER_IMAGE}
                      alt={product.product_name}
                      style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    {product.sale_price && product.sale_price < product.base_price && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: '#FF6B35',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700',
                        zIndex: 1
                      }}>
                        -{Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div style={{ padding: '12px' }}>
                    <h3 style={{ 
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      minHeight: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      color: '#333'
                    }}>
                      {product.product_name}
                    </h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {product.sale_price && product.sale_price < product.base_price ? (
                        <>
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: '700',
                            color: '#FF6B35'
                          }}>
                            {formatPrice(Number(product.sale_price))}
                          </span>
                          <span style={{ 
                            fontSize: '12px',
                            textDecoration: 'line-through',
                            color: '#999'
                          }}>
                            {formatPrice(Number(product.base_price))}
                          </span>
                        </>
                      ) : (
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '700',
                          color: '#FF6B35'
                        }}>
                          {formatPrice(Number(product.base_price))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              style={{
                position: 'absolute',
                right: '0',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF6B35';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#333';
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RelatedProducts;
