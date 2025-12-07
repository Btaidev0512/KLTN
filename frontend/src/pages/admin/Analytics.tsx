import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from '../../services/api';
import RevenueChart from '../../components/admin/Dashboard/RevenueChart';
import TopProductsChart from '../../components/admin/Dashboard/TopProductsChart';
import BestCustomersTable from '../../components/admin/Dashboard/BestCustomersTable';
import SalesByCategoryChart from '../../components/admin/Dashboard/SalesByCategoryChart';
import RecentOrdersTable from '../../components/admin/Dashboard/RecentOrdersTable';
import CategoryDistributionChart from '../../components/admin/Dashboard/CategoryDistributionChart';
import {
  CurrencyCircleDollar,
  ShoppingCart,
  Users,
  Package,
  TrendUp,
} from '@phosphor-icons/react';

interface Stats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  revenue_growth?: number;
  orders_growth?: number;
  customers_growth?: number;
  pending_orders?: number;
  low_stock_products?: number;
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard overview
      const dashboardResponse = await api.dashboard.getOverview();
      
      if (dashboardResponse.data.success) {
        setStats(dashboardResponse.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError('Không thể tải dữ liệu thống kê');
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Stat Card Component
  const StatCardComponent: React.FC<{
    icon: React.ElementType;
    title: string;
    value: string | number;
    color: string;
    growth?: number;
  }> = ({ icon: Icon, title, value, color, growth }) => (
    <Paper
      sx={{
        p: 3,
        borderLeft: `4px solid ${color}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            bgcolor: `${color}15`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={32} color={color} weight="duotone" />
        </Box>
        {growth !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendUp size={16} color={growth >= 0 ? '#4caf50' : '#f44336'} weight="bold" />
            <Typography
              variant="caption"
              sx={{
                color: growth >= 0 ? '#4caf50' : '#f44336',
                fontWeight: 600,
              }}
            >
              {growth >= 0 ? '+' : ''}{growth}%
            </Typography>
          </Box>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={700} color={color}>
        {value}
      </Typography>
    </Paper>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Không có dữ liệu thống kê</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          📊 Thống kê & Phân tích
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Tổng quan và phân tích chi tiết về hoạt động kinh doanh
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        <StatCardComponent
          icon={CurrencyCircleDollar}
          title="Tổng doanh thu"
          value={formatCurrency(stats.total_revenue || 0)}
          color="#FF6B35"
          growth={stats.revenue_growth}
        />
        <StatCardComponent
          icon={ShoppingCart}
          title="Tổng đơn hàng"
          value={formatNumber(stats.total_orders || 0)}
          color="#2196F3"
          growth={stats.orders_growth}
        />
        <StatCardComponent
          icon={Users}
          title="Tổng khách hàng"
          value={formatNumber(stats.total_customers || 0)}
          color="#4CAF50"
          growth={stats.customers_growth}
        />
        <StatCardComponent
          icon={Package}
          title="Tổng sản phẩm"
          value={formatNumber(stats.total_products || 0)}
          color="#9C27B0"
        />
      </Box>

      {/* Revenue Chart - Full Width */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            📈 Biểu đồ doanh thu theo thời gian
          </Typography>
          <RevenueChart />
        </Paper>
      </Box>

      {/* Top Products and Sales by Category */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            🏆 Sản phẩm bán chạy nhất
          </Typography>
          <TopProductsChart />
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            📊 Doanh thu theo danh mục
          </Typography>
          <SalesByCategoryChart />
        </Paper>
      </Box>

      {/* Category Distribution Chart */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            🎯 Phân bố sản phẩm theo danh mục
          </Typography>
          <CategoryDistributionChart />
        </Paper>
      </Box>

      {/* Best Customers Table */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            👥 Khách hàng thân thiết
          </Typography>
          <BestCustomersTable />
        </Paper>
      </Box>

      {/* Recent Orders Table */}
      <Box sx={{ mb: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            🛒 Đơn hàng gần đây
          </Typography>
          <RecentOrdersTable />
        </Paper>
      </Box>
    </Box>
  );
};

export default Analytics;
