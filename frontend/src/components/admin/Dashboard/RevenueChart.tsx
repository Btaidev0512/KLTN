import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { api } from '../../../services/api';

interface RevenueData {
  period: string;
  revenue: number;
  order_count: number;
  avg_order_value: number;
}

const RevenueChart: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await api.dashboard.getRevenue(period);
      if (response.data.success) {
        setData(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handlePeriodChange = (_event: React.MouseEvent<HTMLElement>, newPeriod: 'week' | 'month' | 'year' | null) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod);
    }
  };

  const formatPeriodLabel = (periodStr: string) => {
    if (period === 'week') {
      const [year, week] = periodStr.split('-');
      return `Tuần ${week}/${year}`;
    } else if (period === 'month') {
      const [year, month] = periodStr.split('-');
      return `T${month}/${year}`;
    } else {
      return periodStr;
    }
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      fontFamily: 'Inter, sans-serif',
      offsetY: 10,
    },
    colors: ['#FF6B35', '#4CAF50'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    markers: {
      size: 4,
      colors: ['#FF6B35', '#4CAF50'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    xaxis: {
      categories: data.map(d => formatPeriodLabel(d.period)),
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: [
      {
        title: {
          text: 'Doanh thu (₫)',
          style: {
            fontSize: '12px',
            fontWeight: 500,
          },
        },
        labels: {
          formatter: (value) => {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return value.toFixed(0);
          },
        },
      },
      {
        opposite: true,
        title: {
          text: 'Số đơn hàng',
          style: {
            fontSize: '12px',
            fontWeight: 500,
          },
        },
        labels: {
          formatter: (value) => value.toFixed(0),
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: [
        {
          formatter: (value) => {
            return new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(value);
          },
        },
        {
          formatter: (value) => value.toFixed(0) + ' đơn',
        },
      ],
    },
    legend: {
      show: false,  // TẮT legend của ApexChart, dùng custom legend
    },
    grid: {
      borderColor: '#e0e0e0',
      strokeDashArray: 4,
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          legend: {
            position: 'bottom',
          },
          yaxis: [
            {
              labels: {
                show: true,
              },
            },
            {
              labels: {
                show: false,
              },
            },
          ],
        },
      },
    ],
  };

  const series = [
    {
      name: 'Doanh thu',
      data: data.map(d => d.revenue || 0),
    },
    {
      name: 'Đơn hàng',
      data: data.map(d => d.order_count || 0),
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
          minHeight: 400,
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
      {/* Header với Title và Period Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Biểu đồ Doanh thu
        </Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={handlePeriodChange}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              fontSize: '0.875rem',
              textTransform: 'none',
              border: '1px solid #ddd',
            },
            '& .Mui-selected': {
              bgcolor: '#FF6B35',
              color: 'white',
              '&:hover': {
                bgcolor: '#E55A25',
              },
            },
          }}
        >
          <ToggleButton value="week">Tuần</ToggleButton>
          <ToggleButton value="month">Tháng</ToggleButton>
          <ToggleButton value="year">Năm</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Custom Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 2, justifyContent: 'flex-end' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FF6B35' }} />
          <Typography variant="body2" color="text.secondary">Doanh thu</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4CAF50' }} />
          <Typography variant="body2" color="text.secondary">Đơn hàng</Typography>
        </Box>
      </Box>

      {data.length > 0 ? (
        <Box>
          <ReactApexChart
            options={chartOptions}
            series={series}
            type="area"
            height={350}
          />
        </Box>
      ) : (
        <Box
          sx={{
            minHeight: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography>Không có dữ liệu doanh thu</Typography>
        </Box>
      )}
    </Box>
  );
};

export default RevenueChart;
