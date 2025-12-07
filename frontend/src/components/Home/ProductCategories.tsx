import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import '../../styles/ProductCategories.css';

interface Category {
  category_id: number;
  category_name: string;
  category_slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
  product_count?: number;
}

const ProductCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getParentCategories();
      
      if (response.data.success) {
        const apiCategories = response.data.data || [];
        // Giới hạn 8 categories
        setCategories(apiCategories.slice(0, 8));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="product-categories-section">
        <div className="container">
          <div className="categories-loading">
            <div className="skeleton-title"></div>
            <div className="skeleton-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="skeleton-item"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="product-categories-section">
      <div className="container">
        <div className="hcate-block">
          <h2 className="t-title">
            Danh mục sản phẩm
          </h2>

          {/* Decorative Arrow Animation */}
          <div className="hprd-dcorr">
            <div className="dcor-arrow">
              <i className="fa fa-angle-down"></i>
              <i className="fa fa-angle-down"></i>
              <i className="fa fa-angle-down"></i>
              <i className="fa fa-angle-down"></i>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.category_id} className="hcate-item">
                <Link
                  to={`/products?category=${category.category_slug}`}
                  className="hcate-inner"
                >
                  <span className="icon">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.category_name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="icon-placeholder">
                        {category.category_name.charAt(0)}
                      </div>
                    )}
                  </span>
                  <span className="t-link">
                    {category.category_name}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCategories;