import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  ClickAwayListener
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { api } from '../services/api';

interface Product {
  product_id: number;
  product_name: string;
  product_slug: string;
  image_url?: string;
  product_image?: string;
  base_price: number;
  sale_price?: number;
  final_price: number;
}

interface SearchBarProps {
  onSearch?: (term: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Tìm kiếm sản phẩm...',
  showSuggestions = true,
  autoFocus = false
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  // Save to recent searches
  const saveToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    
    const updated = [
      term,
      ...recentSearches.filter(t => t !== term)
    ].slice(0, 5); // Keep only 5 recent searches
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Fetch suggestions
  const fetchSuggestions = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.searchProducts(term, { limit: 8 });
      
      if (response.data.success) {
        setSuggestions(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  const debouncedFetch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (term: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fetchSuggestions(term), 300);
    };
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);

    if (showSuggestions) {
      debouncedFetch(value);
    }
  };

  // Handle search submit
  const handleSearch = (term?: string) => {
    const searchValue = term || searchTerm;
    if (!searchValue.trim()) return;

    saveToRecentSearches(searchValue);
    setShowDropdown(false);

    if (onSearch) {
      onSearch(searchValue);
    } else {
      // Navigate to products page with search query
      navigate(`/products?search=${encodeURIComponent(searchValue)}`);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product: Product) => {
    setShowDropdown(false);
    setSearchTerm('');
    navigate(`/product/${product.product_slug}`);
  };

  // Handle recent search click
  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    handleSearch(term);
  };

  // Clear search
  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Get image URL
  const getImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl) return '/placeholder.jpg';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    return `http://localhost:5000${imageUrl}`;
  };

  return (
    <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 580 }}>
        <TextField
          fullWidth
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          inputRef={inputRef}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#888', fontSize: 22 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isSearching && (
                  <CircularProgress size={20} sx={{ mr: 1, color: '#FF6B35' }} />
                )}
                {searchTerm && (
                  <IconButton
                    size="small"
                    onClick={handleClear}
                    sx={{ 
                      mr: -0.5,
                      '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.1)' }
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              bgcolor: '#f8f9fa',
              height: '46px',
              fontSize: '14px',
              paddingLeft: '8px',
              transition: 'all 0.3s ease',
              '& fieldset': {
                borderColor: '#e0e0e0',
                borderWidth: '2px'
              },
              '&:hover': {
                bgcolor: 'white',
                '& fieldset': {
                  borderColor: '#FF6B35'
                }
              },
              '&.Mui-focused': {
                bgcolor: 'white',
                boxShadow: '0 4px 20px rgba(255, 107, 53, 0.15)',
                '& fieldset': {
                  borderColor: '#FF6B35',
                  borderWidth: '2px'
                }
              }
            },
            '& input::placeholder': {
              color: '#999',
              opacity: 1,
              fontWeight: 400
            }
          }}
        />

        {/* Suggestions Dropdown */}
        {showDropdown && (suggestions.length > 0 || recentSearches.length > 0) && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              maxHeight: 400,
              overflowY: 'auto',
              zIndex: 1300,
              borderRadius: '8px'
            }}
          >
            {/* Recent Searches */}
            {searchTerm.length < 2 && recentSearches.length > 0 && (
              <>
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingIcon fontSize="small" />
                    Tìm kiếm gần đây
                  </Typography>
                </Box>
                <List sx={{ py: 0 }}>
                  {recentSearches.map((term, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => handleRecentSearchClick(term)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(255, 107, 53, 0.04)'
                        }
                      }}
                    >
                      <ListItemText 
                        primary={term}
                        primaryTypographyProps={{
                          fontSize: '14px'
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </>
            )}

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <>
                {recentSearches.length > 0 && searchTerm.length < 2 && <Divider />}
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Sản phẩm gợi ý
                  </Typography>
                </Box>
                <List sx={{ py: 0 }}>
                  {suggestions.map((product) => (
                    <ListItemButton
                      key={product.product_id}
                      onClick={() => handleSuggestionClick(product)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(255, 107, 53, 0.04)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={getImageUrl(product.image_url || product.product_image)}
                          alt={product.product_name}
                          variant="rounded"
                          sx={{ width: 50, height: 50 }}
                        />
                      </ListItemAvatar>
                      <ListItemText
                        primary={product.product_name}
                        secondary={formatPrice((product.sale_price && product.sale_price > 0) ? product.sale_price : (product.base_price || 0))}
                        primaryTypographyProps={{
                          fontSize: '14px',
                          sx: {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }
                        }}
                        secondaryTypographyProps={{
                          fontSize: '13px',
                          color: '#FF6B35',
                          fontWeight: 600
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
                
                {/* View All Results */}
                <Divider />
                <Box
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(255, 107, 53, 0.04)'
                    }
                  }}
                  onClick={() => handleSearch()}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: '#FF6B35', fontWeight: 500 }}
                  >
                    Xem tất cả kết quả cho "{searchTerm}"
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default SearchBar;
