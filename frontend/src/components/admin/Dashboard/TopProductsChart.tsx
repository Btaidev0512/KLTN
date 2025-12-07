import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { api } from '../../../services/api';

interface TopProduct {
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

const TopProductsChart: React.FC = () => {
  const [data, setData] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      const response = await api.dashboard.getTopProducts(10);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 400,
      toolbar: {
        show: true,
        tools: {
          download: true,
        },
      },
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: ['#FF6B35', '#4CAF50'],
    dataLabels: {
      enabled: true,
      offsetX: 30,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#333'],
      },
      formatter: (val: number, opts) => {
        if (opts.seriesIndex === 0) {
          // Doanh thu
          if (val >= 1000000) {
            return (val / 1000000).toFixed(1) + 'M₫';
          } else if (val >= 1000) {
            return (val / 1000).toFixed(0) + 'K₫';
          }
          return val.toFixed(0) + '₫';
        } else {
          // Số lượng
          return val + ' sp';
        }
      },
    },
    xaxis: {
      categories: data.map(p => {
        // Rút gọn tên sản phẩm nếu quá dài
        const name = p.product_name;
        return name.length > 30 ? name.substring(0, 30) + '...' : name;
      }),
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter: (val) => {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(val);
          },
        },
        {
          formatter: (val) => val + ' sản phẩm',
        },
      ],
    },
    legend: {
      show: false,
    },
    grid: {
      borderColor: '#e0e0e0',
      strokeDashArray: 4,
    },
  };

  const series = [
    {
      name: 'Doanh thu',
      data: data.map(p => p.total_revenue || 0),
    },
    {
      name: 'Đã bán',
      data: data.map(p => p.total_sold || 0),
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: 'white',
          p: 3,
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          minHeight: 450,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: 'white',
        p: 3,
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={1}>
        Top 10 Sản phẩm Bán chạy
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Xếp hạng theo doanh thu và số lượng bán
      </Typography>

      {/* Custom Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#FF6B35' }} />
          <Typography variant="body2" color="text.secondary">Doanh thu</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: '#4CAF50' }} />
          <Typography variant="body2" color="text.secondary">Số lượng bán</Typography>
        </Box>
      </Box>

      {data.length > 0 ? (
        <Box>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="bar"
            height={400}
          />
        </Box>
      ) : (
        <Box
          sx={{
            minHeight: 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography>Không có dữ liệu sản phẩm</Typography>
        </Box>
      )}
    </Box>
  );
};

export default TopProductsChart;
