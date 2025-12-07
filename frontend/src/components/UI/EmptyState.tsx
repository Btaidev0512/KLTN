import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ShoppingCart, FavoriteBorder, Search, Inbox } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  type: 'cart' | 'wishlist' | 'search' | 'orders';
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, message }) => {
  const navigate = useNavigate();

  const configs = {
    cart: {
      icon: <ShoppingCart sx={{ fontSize: 80, color: '#ccc' }} />,
      title: 'Giỏ hàng trống',
      description: message || 'Bạn chưa có sản phẩm nào trong giỏ hàng',
      buttonText: 'Mua sắm ngay',
      buttonAction: () => navigate('/products')
    },
    wishlist: {
      icon: <FavoriteBorder sx={{ fontSize: 80, color: '#ccc' }} />,
      title: 'Chưa có sản phẩm yêu thích',
      description: message || 'Hãy thêm sản phẩm vào danh sách yêu thích',
      buttonText: 'Khám phá sản phẩm',
      buttonAction: () => navigate('/products')
    },
    search: {
      icon: <Search sx={{ fontSize: 80, color: '#ccc' }} />,
      title: 'Không tìm thấy kết quả',
      description: message || 'Thử tìm kiếm với từ khóa khác',
      buttonText: 'Xem tất cả sản phẩm',
      buttonAction: () => navigate('/products')
    },
    orders: {
      icon: <Inbox sx={{ fontSize: 80, color: '#ccc' }} />,
      title: 'Chưa có đơn hàng',
      description: message || 'Bạn chưa có đơn hàng nào',
      buttonText: 'Mua sắm ngay',
      buttonAction: () => navigate('/products')
    }
  };

  const config = configs[type];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 4,
        textAlign: 'center'
      }}
    >
      {config.icon}
      <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
        {config.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {config.description}
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={config.buttonAction}
        sx={{
          backgroundColor: '#FF6B35',
          '&:hover': { backgroundColor: '#F7931E' }
        }}
      >
        {config.buttonText}
      </Button>
    </Box>
  );
};

export default EmptyState;
