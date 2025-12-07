import React from 'react';

interface SortFilterProps {
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
}

const SortFilter: React.FC<SortFilterProps> = ({ 
  onSortChange, 
  currentSort, 
  currentOrder 
}) => {
  const sortOptions = [
    { value: 'name-asc', label: 'Tên A-Z', sortBy: 'name', order: 'asc' as const },
    { value: 'name-desc', label: 'Tên Z-A', sortBy: 'name', order: 'desc' as const },
    { value: 'price-asc', label: 'Giá thấp đến cao', sortBy: 'price', order: 'asc' as const },
    { value: 'price-desc', label: 'Giá cao đến thấp', sortBy: 'price', order: 'desc' as const },
    { value: 'created_at-desc', label: 'Mới nhất', sortBy: 'created_at', order: 'desc' as const },
    { value: 'created_at-asc', label: 'Cũ nhất', sortBy: 'created_at', order: 'asc' as const }
  ];

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = sortOptions.find(option => option.value === e.target.value);
    if (selectedOption) {
      onSortChange(selectedOption.sortBy, selectedOption.order);
    }
  };

  const getCurrentValue = () => {
    return `${currentSort}-${currentOrder}`;
  };

  return (
    <div className="sort-filter" style={{
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
        Sắp xếp
      </h3>

      <div>
        <label style={{
          display: 'block',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          color: '#555'
        }}>
          Sắp xếp theo:
        </label>

        <select
          value={getCurrentValue()}
          onChange={handleSortChange}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '5px',
            fontSize: '0.9rem',
            background: 'white',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Current Sort Display */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#f8f9fa',
        borderRadius: '5px',
        border: '1px solid #e9ecef'
      }}>
        <small style={{ color: '#6c757d', fontWeight: 'bold' }}>
          Hiện tại: {' '}
          <span style={{ color: '#FF6B35' }}>
            {sortOptions.find(option => option.value === getCurrentValue())?.label}
          </span>
        </small>
      </div>
    </div>
  );
};

export default SortFilter;