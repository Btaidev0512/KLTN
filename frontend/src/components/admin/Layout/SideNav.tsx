import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  Stack,
} from '@mui/material';
import {
  ChartPie,
  ShoppingCart,
  Users,
  Package,
  Tag,
  Image,
  Ticket,
  Star,
  ChartBar,
  Gear,
  SignOut,
  Folder,
  Sparkle,
} from '@phosphor-icons/react';

const drawerWidth = 280;

interface NavItem {
  title: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { title: 'Tổng quan', path: '/admin/dashboard', icon: ChartPie },
  { title: 'Đơn hàng', path: '/admin/orders', icon: ShoppingCart },
  { title: 'Sản phẩm', path: '/admin/products', icon: Package },
  { title: 'Khách hàng', path: '/admin/customers', icon: Users },
  { title: 'Danh mục', path: '/admin/categories', icon: Folder },
  { title: 'Thương hiệu', path: '/admin/brands', icon: Sparkle },
  { title: 'Banners', path: '/admin/banners', icon: Image },
  { title: 'Mã giảm giá', path: '/admin/coupons', icon: Ticket },
  { title: 'Đánh giá', path: '/admin/reviews', icon: Star },
  { title: 'Thống kê', path: '/admin/analytics', icon: ChartBar },
  { title: 'Cài đặt', path: '/admin/settings', icon: Gear },
];

interface SideNavProps {
  open?: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'temporary';
}

const SideNav: React.FC<SideNavProps> = ({ 
  open = true, 
  onClose,
  variant = 'permanent' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 700,
            color: '#FF6B35',
            mb: 0.5
          }}
        >
          TT Shop Admin
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Quản trị cửa hàng
        </Typography>
      </Box>

      <Divider />

      {/* Admin Info */}
      <Box sx={{ p: 2 }}>
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center"
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(255, 107, 53, 0.05)',
            border: '1px solid rgba(255, 107, 53, 0.1)'
          }}
        >
          <Avatar 
            sx={{ 
              bgcolor: '#FF6B35',
              width: 40,
              height: 40
            }}
          >
            A
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Admin
            </Typography>
            <Typography variant="caption" color="text.secondary">
              admin@ttshop.com
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <List sx={{ p: 0 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    py: 1.5,
                    bgcolor: active ? '#FF6B35' : 'transparent',
                    color: active ? '#fff' : 'text.primary',
                    '&:hover': {
                      bgcolor: active ? '#FF6B35' : 'rgba(255, 107, 53, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 40,
                      color: active ? '#fff' : '#FF6B35'
                    }}
                  >
                    <Icon size={24} weight={active ? 'fill' : 'regular'} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.title}
                    primaryTypographyProps={{
                      fontWeight: active ? 600 : 500,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Logout Button */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            py: 1.5,
            color: 'error.main',
            '&:hover': {
              bgcolor: 'error.lighter',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <SignOut size={24} />
          </ListItemIcon>
          <ListItemText 
            primary="Đăng xuất"
            primaryTypographyProps={{
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default SideNav;
