import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardMedia, 
  CardContent, 
  Button, 
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Divider,
  Snackbar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Home as HomeIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import '../styles/Wishlist.css';

interface WishlistItem {
  wishlist_id: number;
  product_id: number;
  product_name: string;
  product_slug?: string;
  product_image?: string;
  base_price: number;
  sale_price?: number;
  final_price: number;
  stock_quantity?: number;
  product_status?: string;
  added_at: string;
}

const Wishlist: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState<Set<number>>(new Set());

  const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="18" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';

  // Helper function to get image URL
  const getImageUrl = (imageUrl?: string | null): string => {
    if (!imageUrl) return placeholderImage;
    // If already absolute URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // If relative path, prepend backend URL
    return `http://localhost:5000${imageUrl}`;
  };

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getWishlist();
      console.log('Wishlist response:', response.data);
      
      if (response.data.success) {
        const result = response.data.data;
        if (result && Array.isArray(result.items)) {
          setWishlistItems(result.items);
        } else if (Array.isArray(result)) {
          setWishlistItems(result);
        } else {
          setWishlistItems([]);
        }
      } else {
        setWishlistItems([]);
        setError('Không thể tải danh sách yêu thích');
      }
    } catch (err: any) {
      console.error('Error fetching wishlist:', err);
      setWishlistItems([]);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Không thể tải danh sách yêu thích. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  const handleRemove = async (productId: number) => {
    try {
      const response = await api.removeFromWishlist(productId);
      
      if (response.data.success) {
        setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
        window.dispatchEvent(new Event('wishlistUpdated'));
        setSnackbar({ open: true, message: 'Đã xóa khỏi danh sách yêu thích', type: 'success' });
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setSnackbar({ open: true, message: 'Không thể xóa sản phẩm', type: 'error' });
    }
  };

  const handleMoveToCart = async (productId: number) => {
    setAddingToCart(prev => new Set(prev).add(productId));
    try {
      // Add to cart
      await api.addToCart(productId, 1);
      
      // Remove from wishlist
      await api.removeFromWishlist(productId);
      
      // Update UI
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
      window.dispatchEvent(new Event('cartUpdated'));
      window.dispatchEvent(new Event('wishlistUpdated'));
      
      setSnackbar({ open: true, message: 'Đã chuyển vào giỏ hàng', type: 'success' });
    } catch (err) {
      console.error('Error moving to cart:', err);
      setSnackbar({ open: true, message: 'Không thể chuyển vào giỏ hàng', type: 'error' });
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setSnackbar({ open: true, message: 'Đã sao chép link!', type: 'success' });
    setShareDialogOpen(false);
  };

  const handleShareEmail = () => {
    const subject = 'My Wishlist - Badminton Store';
    const body = `Xem danh sách yêu thích của tôi: ${window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShareDialogOpen(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}
      >
        <CircularProgress sx={{ color: '#FF6B35' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          sx={{ mb: 3 }}
          separator="›"
        >
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: '#666',
              fontSize: '14px'
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Trang chủ
          </Link>
          <Typography 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: '#FF6B35',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            <FavoriteIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Sản phẩm yêu thích
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box 
          sx={{ 
            bgcolor: 'white', 
            p: 3, 
            mb: 3,
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                color: '#333',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <FavoriteIcon sx={{ color: '#FF6B35', fontSize: 32 }} />
              Sản phẩm yêu thích
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {wishlistItems.length} sản phẩm
            </Typography>
          </Box>
          
          {wishlistItems.length > 0 && (
            <Tooltip title="Chia sẻ danh sách">
              <Button
                variant="outlined"
                onClick={handleShare}
                startIcon={<ShareIcon />}
                sx={{
                  borderColor: '#FF6B35',
                  color: '#FF6B35',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: '4px',
                  '&:hover': {
                    borderColor: '#E55A2B',
                    bgcolor: 'rgba(255, 107, 53, 0.04)'
                  }
                }}
              >
                Chia sẻ
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '4px' }}>
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!error && wishlistItems.length === 0 ? (
          <Box 
            sx={{ 
              bgcolor: 'white', 
              p: 8, 
              textAlign: 'center',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <FavoriteIcon 
              sx={{ 
                fontSize: 80, 
                color: '#ddd', 
                mb: 2 
              }} 
            />
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#333' }}>
              Danh sách yêu thích trống
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              Bạn chưa có sản phẩm yêu thích nào
            </Typography>
            <Button
              component={Link}
              to="/products"
              variant="contained"
              sx={{
                bgcolor: '#FF6B35',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: '4px',
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#E55A2B'
                }
              }}
            >
              Khám phá sản phẩm
            </Button>
          </Box>
        ) : (
          <>
            {/* Products Grid */}
            <div className="row">
              {wishlistItems.map((item) => {
                const discountPercent = item.sale_price && item.sale_price < item.base_price
                  ? Math.round(((item.base_price - item.sale_price) / item.base_price) * 100)
                  : 0;

                return (
                  <div key={item.wishlist_id} className="col-6 col-md-3" style={{ marginBottom: '25px' }}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                          transform: 'translateY(-4px)'
                        }
                      }}
                    >
                      {/* Remove Button */}
                      <IconButton
                        onClick={() => handleRemove(item.product_id)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'white',
                          zIndex: 2,
                          width: 32,
                          height: 32,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          '&:hover': {
                            bgcolor: '#f5f5f5',
                            color: '#FF6B35'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>

                      {/* Discount Badge */}
                      {discountPercent > 0 && (
                        <Chip
                          label={`-${discountPercent}%`}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#FF6B35',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '12px',
                            height: '24px',
                            zIndex: 2,
                            borderRadius: '4px'
                          }}
                        />
                      )}

                      {/* Product Image */}
                      <Box
                        component={Link}
                        to={`/product/${item.product_slug || item.product_id}`}
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          overflow: 'hidden',
                          bgcolor: '#f9f9f9',
                          textDecoration: 'none'
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={getImageUrl(item.product_image)}
                          alt={item.product_name}
                          onError={(e: any) => {
                            e.target.src = placeholderImage;
                          }}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />

                        {/* Out of Stock Overlay */}
                        {item.stock_quantity === 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1
                            }}
                          >
                            <Chip
                              label="Hết hàng"
                              sx={{
                                bgcolor: '#666',
                                color: 'white',
                                fontWeight: 600,
                                borderRadius: '4px'
                              }}
                            />
                          </Box>
                        )}
                      </Box>

                      {/* Product Info */}
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Typography
                          component={Link}
                          to={`/product/${item.product_slug || item.product_id}`}
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontSize: '14px',
                            lineHeight: 1.5,
                            color: '#333',
                            textDecoration: 'none',
                            mb: 1.5,
                            minHeight: '42px',
                            '&:hover': {
                              color: '#FF6B35'
                            }
                          }}
                        >
                          {item.product_name}
                        </Typography>

                        {/* Price */}
                        <Box sx={{ mb: 1.5 }}>
                          {item.sale_price && item.sale_price < item.base_price ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  color: '#FF6B35',
                                  fontWeight: 700,
                                  fontSize: '20px'
                                }}
                              >
                                {formatPrice(item.sale_price)}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#000',
                                  textDecoration: 'line-through',
                                  fontSize: '15px',
                                  opacity: 0.5
                                }}
                              >
                                {formatPrice(item.base_price)}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography
                              variant="h6"
                              sx={{
                                color: '#FF6B35',
                                fontWeight: 700,
                                fontSize: '20px'
                              }}
                            >
                              {formatPrice(item.final_price)}
                            </Typography>
                          )}
                        </Box>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Tooltip title="Chuyển vào giỏ hàng">
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => handleMoveToCart(item.product_id)}
                              disabled={item.stock_quantity === 0 || addingToCart.has(item.product_id)}
                              startIcon={addingToCart.has(item.product_id) ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CartIcon />}
                              sx={{
                                bgcolor: item.stock_quantity === 0 ? '#ccc' : '#FF6B35',
                                color: 'white',
                                py: 1,
                                borderRadius: '4px',
                                textTransform: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                '&:hover': {
                                  bgcolor: item.stock_quantity === 0 ? '#ccc' : '#E55A2B'
                                },
                                '&:disabled': {
                                  color: 'white',
                                  bgcolor: '#ccc'
                                }
                              }}
                            >
                              {item.stock_quantity === 0 ? 'Hết hàng' : 'Giỏ hàng'}
                            </Button>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping Button */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                component={Link}
                to="/products"
                variant="outlined"
                sx={{
                  borderColor: '#FF6B35',
                  color: '#FF6B35',
                  px: 4,
                  py: 1.5,
                  borderRadius: '4px',
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#E55A2B',
                    bgcolor: 'rgba(255, 107, 53, 0.04)'
                  }
                }}
              >
                Tiếp tục mua sắm
              </Button>
            </Box>
          </>
        )}

        {/* Share Dialog */}
        <Dialog 
          open={shareDialogOpen} 
          onClose={() => setShareDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShareIcon sx={{ color: '#FF6B35' }} />
              <Typography variant="h6">Chia sẻ danh sách yêu thích</Typography>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCopyLink}
                startIcon={<CopyIcon />}
                sx={{
                  py: 1.5,
                  borderColor: '#FF6B35',
                  color: '#FF6B35',
                  textTransform: 'none',
                  fontSize: '15px',
                  '&:hover': {
                    borderColor: '#E55A2B',
                    bgcolor: 'rgba(255, 107, 53, 0.04)'
                  }
                }}
              >
                Sao chép link
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleShareEmail}
                startIcon={<EmailIcon />}
                sx={{
                  py: 1.5,
                  borderColor: '#FF6B35',
                  color: '#FF6B35',
                  textTransform: 'none',
                  fontSize: '15px',
                  '&:hover': {
                    borderColor: '#E55A2B',
                    bgcolor: 'rgba(255, 107, 53, 0.04)'
                  }
                }}
              >
                Chia sẻ qua Email
              </Button>
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setShareDialogOpen(false)}
              sx={{
                color: '#666',
                textTransform: 'none'
              }}
            >
              Đóng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.type}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Wishlist;
