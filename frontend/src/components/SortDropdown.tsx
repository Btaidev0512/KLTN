import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography
} from '@mui/material';
import {
  Sort as SortIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as PriceIcon,
  Schedule as NewIcon,
  TextFields as AlphaIcon
} from '@mui/icons-material';

export interface SortOption {
  value: string;
  label: string;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  icon?: React.ReactNode;
}

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options?: SortOption[];
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const defaultSortOptions: SortOption[] = [
  { 
    value: 'default', 
    label: 'Mặc định',
    icon: <SortIcon fontSize="small" />
  },
  { 
    value: 'newest', 
    label: 'Mới nhất', 
    sort_by: 'created_at', 
    sort_order: 'DESC',
    icon: <NewIcon fontSize="small" />
  },
  { 
    value: 'price_asc', 
    label: 'Giá thấp → cao', 
    sort_by: 'base_price', 
    sort_order: 'ASC',
    icon: <PriceIcon fontSize="small" />
  },
  { 
    value: 'price_desc', 
    label: 'Giá cao → thấp', 
    sort_by: 'base_price', 
    sort_order: 'DESC',
    icon: <PriceIcon fontSize="small" />
  },
  { 
    value: 'name_asc', 
    label: 'Tên A → Z', 
    sort_by: 'product_name', 
    sort_order: 'ASC',
    icon: <AlphaIcon fontSize="small" />
  },
  { 
    value: 'name_desc', 
    label: 'Tên Z → A', 
    sort_by: 'product_name', 
    sort_order: 'DESC',
    icon: <AlphaIcon fontSize="small" />
  },
  { 
    value: 'best_selling', 
    label: 'Bán chạy nhất', 
    sort_by: 'sold_count', 
    sort_order: 'DESC',
    icon: <TrendingUpIcon fontSize="small" />
  }
];

const SortDropdown: React.FC<SortDropdownProps> = ({
  value,
  onChange,
  options = defaultSortOptions,
  size = 'small',
  fullWidth = false
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size={size} fullWidth={fullWidth}>
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        sx={{
          minWidth: 180,
          borderRadius: '8px',
          bgcolor: 'white',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e0e0e0'
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FF6B35'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FF6B35'
          }
        }}
        renderValue={(selected) => {
          const option = options.find(opt => opt.value === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SortIcon fontSize="small" sx={{ color: '#666' }} />
              <Typography variant="body2">
                {option?.label || 'Sắp xếp'}
              </Typography>
            </Box>
          );
        }}
      >
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            sx={{
              '&:hover': {
                bgcolor: 'rgba(255, 107, 53, 0.04)'
              },
              '&.Mui-selected': {
                bgcolor: 'rgba(255, 107, 53, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(255, 107, 53, 0.12)'
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {option.icon && (
                <Box sx={{ color: '#666', display: 'flex' }}>
                  {option.icon}
                </Box>
              )}
              <Typography variant="body2">
                {option.label}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SortDropdown;
export { defaultSortOptions };
