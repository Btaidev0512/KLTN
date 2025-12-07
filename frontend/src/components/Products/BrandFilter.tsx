import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

interface Brand {
  id: number;
  name: string;
  slug?: string;
  logo?: string;
  country?: string;
}

interface BrandFilterProps {
  onBrandChange: (selectedBrands: string[]) => void;
  selectedBrands: string[];
}

const BrandFilter: React.FC<BrandFilterProps> = ({ onBrandChange, selectedBrands }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.getAllBrands();
      
      // Process and validate API data
      let brandsData = response.data?.data || [];
      
      // Filter out invalid brands and ensure name property exists
      brandsData = brandsData.filter((brand: any) => 
        brand && typeof brand === 'object' && brand.brand_name && typeof brand.brand_name === 'string'
      );
      
      // Map to expected format
      const mappedBrands = brandsData.map((brand: any) => ({
        id: brand.brand_id,
        name: brand.brand_name,
        slug: brand.brand_slug,
        country: brand.country
      }));
      
      setBrands(mappedBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      // No fallback - show empty list
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandToggle = (brandName: string) => {
    // Logic chọn một thương hiệu duy nhất - chỉ cho phép chọn 1 thương hiệu
    const newSelectedBrands = selectedBrands.includes(brandName)
      ? [] // Bỏ chọn nếu đã được chọn
      : [brandName]; // Chọn thương hiệu này và bỏ chọn các thương hiệu khác
    
    onBrandChange(newSelectedBrands);
  };

  const handleClearAll = () => {
    onBrandChange([]);
  };

  const handleSelectAll = () => {
    // Cho single selection, chọn thương hiệu đầu tiên
    const firstBrandName = filteredBrands.find(brand => brand.name)?.name;
    onBrandChange(firstBrandName ? [firstBrandName] : []);
  };

  const filteredBrands = brands.filter(brand =>
    brand.name && brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedBrands = showAll ? filteredBrands : filteredBrands.slice(0, 6);

  const getBrandIcon = (brandName: string) => {
    const icons: { [key: string]: string } = {
      'Yonex': '🏸',
      'Victor': '⚡',
      'Li-Ning': '🔥',
      'Mizuno': '💎',
      'Kawasaki': '🚀',
      'Apacs': '⭐',
      'FZ Forza': '🌟',
      'Babolat': '🎾'
    };
    return icons[brandName] || '🏷️';
  };

  if (loading) {
    return (
      <div className="brand-filter" style={{
        background: 'white',
        borderRadius: '10px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          Đang tải thương hiệu...
        </div>
      </div>
    );
  }

  return (
    <div className="brand-filter" style={{
      background: 'white',
      borderRadius: '10px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        borderBottom: '2px solid #FF6B35',
        paddingBottom: '0.5rem'
      }}>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: 'bold',
          margin: 0,
          color: '#2c3e50'
        }}>
          Thương hiệu
        </h3>
        <span style={{
          fontSize: '0.85rem',
          color: '#FF6B35',
          fontWeight: 'bold'
        }}>
          Chỉ chọn 1
        </span>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Tìm thương hiệu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {/* Brand List */}
      <div className="brand-list">
        {displayedBrands.map((brand) => (
          <label
            key={brand.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              borderRadius: '5px',
              transition: 'background 0.2s',
              background: (brand.name && selectedBrands.includes(brand.name)) ? '#fff3e0' : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (brand.name && !selectedBrands.includes(brand.name)) {
                e.currentTarget.style.background = '#f8f9fa';
              }
            }}
            onMouseLeave={(e) => {
              if (brand.name && !selectedBrands.includes(brand.name)) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <input
              type="radio"
              name="selectedBrand"
              checked={brand.name ? selectedBrands.includes(brand.name) : false}
              onChange={() => brand.name && handleBrandToggle(brand.name)}
              style={{
                marginRight: '0.75rem',
                cursor: 'pointer',
                accentColor: '#FF6B35'
              }}
            />
            
            <span style={{
              fontSize: '1.2rem',
              marginRight: '0.5rem'
            }}>
              {getBrandIcon(brand.name)}
            </span>
            
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: (brand.name && selectedBrands.includes(brand.name)) ? 'bold' : 'normal',
                color: (brand.name && selectedBrands.includes(brand.name)) ? '#FF6B35' : '#333'
              }}>
                {brand.name}
              </span>
              {brand.country && (
                <small style={{
                  display: 'block',
                  color: '#999',
                  fontSize: '0.8rem'
                }}>
                  {brand.country}
                </small>
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Show More/Less Button */}
      {filteredBrands.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%',
            padding: '0.5rem',
            background: 'transparent',
            border: '1px solid #FF6B35',
            borderRadius: '5px',
            color: '#FF6B35',
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginTop: '0.5rem'
          }}
        >
          {showAll ? 'Thu gọn' : `Xem thêm ${filteredBrands.length - 6} thương hiệu`}
        </button>
      )}

      {/* Action Buttons */}
      {selectedBrands.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #eee'
        }}>
          <button
            onClick={handleSelectAll}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Chọn tất cả
          </button>
          
          <button
            onClick={handleClearAll}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Bỏ chọn tất cả
          </button>
        </div>
      )}

      {/* Selected Brands Display */}
      {selectedBrands.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f8f9fa',
          borderRadius: '5px',
          border: '1px solid #e9ecef'
        }}>
          <small style={{ color: '#6c757d', fontWeight: 'bold' }}>
            Đã chọn ({selectedBrands.length}): {' '}
            <span style={{ color: '#FF6B35' }}>
              {selectedBrands.join(', ')}
            </span>
          </small>
        </div>
      )}
    </div>
  );
};

export default BrandFilter;