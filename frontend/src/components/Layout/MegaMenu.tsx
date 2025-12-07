import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, styled } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { api } from '../../services/api';

interface Category {
  category_id: number;
  category_name: string;
  category_slug: string;
  parent_id: number | null;
}

interface Brand {
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  category_id?: number; // Category that this brand belongs to
}

interface MegaMenuColumn {
  title: string;
  slug: string;
  items: {
    name: string;
    searchQuery: string;
  }[];
}

const MegaMenuWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&:hover .mega-dropdown': {
    opacity: 1,
    visibility: 'visible',
    transform: 'translateY(0)',
  }
}));

const MegaMenuButton = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '12px 20px',
  cursor: 'pointer',
  color: '#fff',
  fontWeight: 500,
  fontSize: '15px',
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#FF6B35',
  },
  '& svg': {
    fontSize: '18px',
    transition: 'transform 0.3s ease',
  },
  '&:hover svg': {
    transform: 'rotate(180deg)',
  }
}));

const MegaDropdown = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 'auto',
  left: '0',
  right: '0',
  transform: 'translateY(-10px)',
  width: '100vw',
  backgroundColor: '#fff',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  opacity: 0,
  visibility: 'hidden',
  transition: 'all 0.3s ease',
  zIndex: 1000,
  borderTop: '3px solid #FF6B35',
  marginTop: '0',
}));

const ColumnsWrapper = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: '32px',
  '@media (max-width: 1200px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
  '@media (max-width: 768px)': {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  '@media (max-width: 576px)': {
    gridTemplateColumns: '1fr',
  },
}));

const ColumnTitle = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  fontWeight: 700,
  color: '#2C3E50',
  marginBottom: '16px',
  paddingBottom: '8px',
  borderBottom: '2px solid #FF6B35',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const MenuItem = styled(Link)(({ theme }) => ({
  display: 'block',
  padding: '8px 0',
  color: '#495057',
  textDecoration: 'none',
  fontSize: '14px',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: '#FF6B35',
    paddingLeft: '8px',
  }
}));

const ViewMoreLink = styled(Link)(({ theme }) => ({
  display: 'block',
  padding: '8px 0',
  color: '#FF6B35',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 600,
  '&:hover': {
    textDecoration: 'underline',
  }
}));

const MegaMenu: React.FC = () => {
  const [megaMenuData, setMegaMenuData] = useState<MegaMenuColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [forceClose, setForceClose] = useState(false);

  useEffect(() => {
    fetchMegaMenuData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLinkClick = (e: React.MouseEvent) => {
    // Force close immediately
    setForceClose(true);
    
    // Reset after a short delay to allow re-opening
    setTimeout(() => {
      setForceClose(false);
    }, 500);
  };

  const fetchMegaMenuData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories and brands from API
      const [categoriesRes, brandsRes] = await Promise.all([
        api.getCategories(),
        api.getAllBrands()
      ]);

      if (categoriesRes.data.success && brandsRes.data.success) {
        const categories: Category[] = categoriesRes.data.data || [];
        const brands: Brand[] = brandsRes.data.data || [];

        // Filter only parent categories (Vợt cầu lông, Giày cầu lông...)
        const parentCategories = categories.filter(cat => !cat.parent_id);

        // Build mega menu columns
        const columns: MegaMenuColumn[] = parentCategories.map(parentCat => {
          // Find brands that belong to this category
          // Check both category_id (single) and category_ids (array from brand_categories)
          const categoryBrands = brands.filter(brand => {
            // Check if brand has category_ids array (from brand_categories table)
            if ((brand as any).category_ids && Array.isArray((brand as any).category_ids)) {
              return (brand as any).category_ids.includes(parentCat.category_id);
            }
            // Fallback to single category_id
            return brand.category_id === parentCat.category_id;
          });

          console.log(`📊 Category "${parentCat.category_name}" (ID: ${parentCat.category_id}):`, 
            `Found ${categoryBrands.length} brands:`, 
            categoryBrands.map(b => b.brand_name).join(', ') || 'None');

          // Show all brands assigned to this category (no limit)
          const brandsToShow = categoryBrands;
          
          const items = brandsToShow.map(brand => ({
            name: `${parentCat.category_name} ${brand.brand_name}`,
            searchQuery: `${parentCat.category_name} ${brand.brand_name}`
          }));

          return {
            title: parentCat.category_name,
            slug: parentCat.category_slug,
            items
          };
        });

        setMegaMenuData(columns);
      }
    } catch (error) {
      console.error('Error fetching mega menu data:', error);
      // No fallback - show empty menu if API fails
      setMegaMenuData([]);
    } finally {
      setLoading(false);
    }
  };

  // No fallback data - always use real data from API

  if (loading) {
    return (
      <Box sx={{ padding: '12px 20px', color: '#fff' }}>
        Đang tải...
      </Box>
    );
  }

  return (
    <MegaMenuWrapper 
      className="mega-menu-wrapper" 
      ref={wrapperRef}
      onMouseLeave={() => setForceClose(false)}
    >
      <MegaMenuButton>
        SẢN PHẨM
        <KeyboardArrowDownIcon />
      </MegaMenuButton>

      <MegaDropdown 
        className="mega-dropdown"
        sx={{
          display: forceClose ? 'none !important' : 'block',
        }}
      >
        <Container maxWidth={false} sx={{ py: 4, px: 6 }}>
          <ColumnsWrapper>
            {megaMenuData.map((column, index) => (
              <Box key={index}>
                <Link 
                  to={`/products/${column.slug}`}
                  style={{ textDecoration: 'none' }}
                  onClick={handleLinkClick}
                >
                  <ColumnTitle>
                    {column.title}
                  </ColumnTitle>
                </Link>
                <Box>
                  {column.items.map((item, itemIndex) => (
                    <MenuItem 
                      key={itemIndex}
                      to={`/products/${column.slug}?search=${encodeURIComponent(item.searchQuery)}`}
                      onClick={handleLinkClick}
                    >
                      {item.name}
                    </MenuItem>
                  ))}
                  <ViewMoreLink 
                    to={`/products/${column.slug}`}
                    onClick={handleLinkClick}
                  >
                    Xem tất cả {column.title}
                  </ViewMoreLink>
                </Box>
              </Box>
            ))}
          </ColumnsWrapper>
        </Container>
      </MegaDropdown>
    </MegaMenuWrapper>
  );
};

export default MegaMenu;
