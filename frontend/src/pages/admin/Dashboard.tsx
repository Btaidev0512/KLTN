import React, { useState, useEffect } from 'react';
import { Typography, Box, Stack, CircularProgress, Alert } from '@mui/material';
import {
  CurrencyCircleDollar,
  ShoppingCart,
  Users,
  Package,
} from '@phosphor-icons/react';
import StatCard from '../../components/admin/Dashboard/StatCard';
import RevenueChart from '../../components/admin/Dashboard/RevenueChart';
import CategoryDistributionChart from '../../components/admin/Dashboard/CategoryDistributionChart';
import RecentOrdersTable from '../../components/admin/Dashboard/RecentOrdersTable';
import TopProductsChart from '../../components/admin/Dashboard/TopProductsChart';
import BestCustomersTable from '../../components/admin/Dashboard/BestCustomersTable';
import SalesByCategoryChart from '../../components/admin/Dashboard/SalesByCategoryChart';
import { api } from '../../services/api';

interface DashboardStats {
  total_revenue: number;
  revenue_growth: number;
  total_orders: number;
  orders_growth: number;
  total_customers: number;
  customers_growth: number;
  total_products: number;
}

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.dashboard.getOverview();
      
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Dashboard Tổng Quan
        </Typography>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Dashboard Tổng Quan
      </Typography>

      {/* Stats Cards */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)'
          },
          gap: 3,
          mb: 4
        }}
      >
        <StatCard
          title="Doanh thu tháng này"
          value={stats ? formatCurrency(stats.total_revenue) : '0₫'}
          icon={CurrencyCircleDollar}
          color="#FF6B35"
          trend={stats?.revenue_growth ? { 
            value: Math.abs(stats.revenue_growth), 
            isPositive: stats.revenue_growth > 0 
          } : undefined}
        />

        <StatCard
          title="Đơn hàng"
          value={stats?.total_orders?.toString() || '0'}
          icon={ShoppingCart}
          color="#4CAF50"
          trend={stats?.orders_growth ? { 
            value: Math.abs(stats.orders_growth), 
            isPositive: stats.orders_growth > 0 
          } : undefined}
        />

        <StatCard
          title="Khách hàng"
          value={stats?.total_customers?.toString() || '0'}
          icon={Users}
          color="#2196F3"
          trend={stats?.customers_growth ? { 
            value: Math.abs(stats.customers_growth), 
            isPositive: stats.customers_growth > 0 
          } : undefined}
        />

        <StatCard
          title="Sản phẩm"
          value={stats?.total_products?.toString() || '0'}
          icon={Package}
          color="#9C27B0"
        />
      </Box>

      {/* Charts and Tables */}
      <Stack spacing={3}>
        {/* Row 1: Revenue Chart & Order Status */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: 3
          }}
        >
          <RevenueChart />
          <CategoryDistributionChart />
        </Box>

        {/* Row 2: Top Products & Best Customers */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3
          }}
        >
          <TopProductsChart />
          <BestCustomersTable />
        </Box>

        {/* Row 3: Sales by Category (Full width) */}
        <SalesByCategoryChart />

        {/* Row 4: Recent Orders Table */}
        <RecentOrdersTable />
      </Stack>
    </Box>
  );
};

export default DashboardOverview;


