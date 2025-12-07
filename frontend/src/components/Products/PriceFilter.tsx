import React, { useState } from 'react';

interface PriceFilterProps {
  onPriceChange: (minPrice: number | null, maxPrice: number | null) => void;
  minPrice: number | null;
  maxPrice: number | null;
}

const PriceFilter: React.FC<PriceFilterProps> = ({ onPriceChange, minPrice, maxPrice }) => {
  const [tempMinPrice, setTempMinPrice] = useState<string>(minPrice?.toString() || '');
  const [tempMaxPrice, setTempMaxPrice] = useState<string>(maxPrice?.toString() || '');

  const priceRanges = [
    { label: 'Dưới 500,000đ', min: null, max: 500000 },
    { label: '500,000đ - 1,000,000đ', min: 500000, max: 1000000 },
    { label: '1,000,000đ - 2,000,000đ', min: 1000000, max: 2000000 },
    { label: '2,000,000đ - 5,000,000đ', min: 2000000, max: 5000000 },
    { label: 'Trên 5,000,000đ', min: 5000000, max: null }
  ];

  const handlePriceRangeClick = (min: number | null, max: number | null) => {
    onPriceChange(min, max);
    setTempMinPrice(min?.toString() || '');
    setTempMaxPrice(max?.toString() || '');
  };

  const handleCustomPriceApply = () => {
    const min = tempMinPrice ? parseInt(tempMinPrice) : null;
    const max = tempMaxPrice ? parseInt(tempMaxPrice) : null;
    
    if (min && max && min > max) {
      alert('Giá tối thiểu không thể lớn hơn giá tối đa');
      return;
    }
    
    onPriceChange(min, max);
  };

  const handleClearFilter = () => {
    onPriceChange(null, null);
    setTempMinPrice('');
    setTempMaxPrice('');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <div className="price-filter" style={{
      background: 'white',
      borderRadius: '10px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        fontSize: '1.2rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        color: '#2c3e50',
        borderBottom: '2px solid #FF6B35',
        paddingBottom: '0.5rem'
      }}>
        Lọc theo giá
      </h3>

      {/* Preset Price Ranges */}
      <div className="price-ranges" style={{ marginBottom: '1.5rem' }}>
        {priceRanges.map((range, index) => (
          <button
            key={index}
            onClick={() => handlePriceRangeClick(range.min, range.max)}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem',
              marginBottom: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '5px',
              background: (minPrice === range.min && maxPrice === range.max) ? '#FF6B35' : 'white',
              color: (minPrice === range.min && maxPrice === range.max) ? 'white' : '#333',
              cursor: 'pointer',
              transition: 'all 0.3s',
              textAlign: 'left',
              fontSize: '0.9rem'
            }}
            onMouseEnter={(e) => {
              if (!(minPrice === range.min && maxPrice === range.max)) {
                e.currentTarget.style.background = '#f8f9fa';
              }
            }}
            onMouseLeave={(e) => {
              if (!(minPrice === range.min && maxPrice === range.max)) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Custom Price Input */}
      <div className="custom-price" style={{
        borderTop: '1px solid #eee',
        paddingTop: '1rem'
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#555'
        }}>
          Khoảng giá tùy chỉnh:
        </label>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Từ"
            value={tempMinPrice}
            onChange={(e) => setTempMinPrice(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '0.9rem'
            }}
          />
          
          <span style={{ color: '#999', fontSize: '0.9rem' }}>-</span>
          
          <input
            type="number"
            placeholder="Đến"
            value={tempMaxPrice}
            onChange={(e) => setTempMaxPrice(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '0.9rem'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            onClick={handleCustomPriceApply}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Áp dụng
          </button>
          
          <button
            onClick={handleClearFilter}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Current Filter Display */}
      {(minPrice || maxPrice) && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#f8f9fa',
          borderRadius: '5px',
          border: '1px solid #e9ecef'
        }}>
          <small style={{ color: '#6c757d', fontWeight: 'bold' }}>
            Lọc hiện tại: {' '}
            <span style={{ color: '#FF6B35' }}>
              {minPrice ? formatPrice(minPrice) : '0đ'} - {maxPrice ? formatPrice(maxPrice) : '∞'}
            </span>
          </small>
        </div>
      )}
    </div>
  );
};

export default PriceFilter;