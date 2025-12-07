import React, { useState } from 'react';
import PriceFilter from './PriceFilter';
import BrandFilter from './BrandFilter';
import SortFilter from './SortFilter';

export interface FilterState {
  minPrice: number | null;
  maxPrice: number | null;
  selectedBrands: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearAllFilters: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFiltersChange,
  onClearAllFilters
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handlePriceChange = (minPrice: number | null, maxPrice: number | null) => {
    onFiltersChange({
      ...filters,
      minPrice,
      maxPrice
    });
  };

  const handleBrandChange = (selectedBrands: string[]) => {
    onFiltersChange({
      ...filters,
      selectedBrands
    });
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder
    });
  };

  const hasActiveFilters = () => {
    return filters.minPrice || 
           filters.maxPrice || 
           filters.selectedBrands.length > 0;
  };

  return (
    <div className="filter-sidebar" style={{
      position: 'sticky',
      top: '20px',
      height: 'fit-content'
    }}>
      {/* Header với toggle button */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#2c3e50',
          margin: 0
        }}>
          🔍 Bộ lọc
        </h2>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {hasActiveFilters() && (
            <button
              onClick={onClearAllFilters}
              style={{
                padding: '0.5rem 1rem',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              title="Xóa tất cả bộ lọc"
            >
              Xóa tất cả
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              padding: '0.5rem',
              background: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          >
            {isCollapsed ? '📋' : '📁'}
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && !isCollapsed && (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '2px solid #FF6B35'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            color: '#FF6B35',
            marginBottom: '0.5rem'
          }}>
            Bộ lọc đang áp dụng:
          </h4>

          <div style={{ fontSize: '0.85rem', color: '#666' }}>
            {(filters.minPrice || filters.maxPrice) && (
              <div style={{ marginBottom: '0.25rem' }}>
                💰 Giá: {filters.minPrice?.toLocaleString() || '0'}đ - {filters.maxPrice?.toLocaleString() || '∞'}
              </div>
            )}
            
            {filters.selectedBrands.length > 0 && (
              <div style={{ marginBottom: '0.25rem' }}>
                🏷️ Thương hiệu: {filters.selectedBrands.join(', ')} ({filters.selectedBrands.length})
              </div>
            )}
            
            <div style={{ marginBottom: '0.25rem' }}>
              📊 Sắp xếp: {filters.sortBy} ({filters.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'})
            </div>
          </div>
        </div>
      )}

      {/* Filter Components */}
      {!isCollapsed && (
        <>
          {/* Sort Filter - đặt đầu tiên */}
          <SortFilter
            onSortChange={handleSortChange}
            currentSort={filters.sortBy}
            currentOrder={filters.sortOrder}
          />

          {/* Price Filter */}
          <PriceFilter
            onPriceChange={handlePriceChange}
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
          />

          {/* Brand Filter */}
          <BrandFilter
            onBrandChange={handleBrandChange}
            selectedBrands={filters.selectedBrands}
          />
        </>
      )}

      {/* Filter Stats */}
      {!isCollapsed && (
        <div style={{
          background: 'linear-gradient(135deg, #FF6B35, #F7931E)',
          color: 'white',
          borderRadius: '10px',
          padding: '1rem',
          textAlign: 'center',
          boxShadow: '0 2px 10px rgba(255, 107, 53, 0.3)'
        }}>
          <div style={{
            fontSize: '0.9rem',
            marginBottom: '0.5rem',
            opacity: 0.9
          }}>
            💡 Mẹo: Kết hợp nhiều bộ lọc để tìm sản phẩm phù hợp nhất!
          </div>
          <div style={{
            fontSize: '0.8rem',
            opacity: 0.8
          }}>
            Các bộ lọc sẽ được áp dụng tự động
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;