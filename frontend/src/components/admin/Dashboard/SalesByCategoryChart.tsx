import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { api } from '../../../services/api';

interface CategorySales {
  category_name: string;
  total_revenue: number;
  total_products: number;
  percentage: number;
}

type ChartType = 'pie' | 'bar';

const SalesByCategoryChart: React.FC = () => {
  const [data, setData] = useState<CategorySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('pie');

  const fetchCategorySales = async () => {
    try {
      setLoading(true);
      const response = await api.dashboard.getSalesByCategory();
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching category sales:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorySales();
  }, []);

  const handleChartTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: ChartType | null) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const colors = [
    '#FF6B35', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0',
    '#00BCD4', '#FF5722', '#8BC34A', '#3F51B5', '#E91E63'
  ];

  const pieChartOptions: ApexOptions = {
    chart: {
      type: 'pie',
      fontFamily: 'Inter, sans-serif',
    },
    labels: data.map(d => d.category_name),
    colors: colors,
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return val.toFixed(1) + '%';
      },
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#fff'],
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.45,
      },
    },
    tooltip: {
      y: {
        formatter: (val) => {
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(val);
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
        },
      },
    ],
  };

  const barChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
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
        horizontal: false,
        borderRadius: 6,
        columnWidth: '60%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    colors: colors,
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#333'],
      },
      formatter: (val: number) => {
        if (val >= 1000000) {
          return (val / 1000000).toFixed(1) + 'M₫';
        } else if (val >= 1000) {
          return (val / 1000).toFixed(0) + 'K₫';
        }
        return val.toFixed(0) + '₫';
      },
    },
    xaxis: {
      categories: data.map(d => d.category_name),
      labels: {
        style: {
          fontSize: '11px',
        },
        rotate: -45,
        rotateAlways: data.length > 5,
      },
    },
    yaxis: {
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
    tooltip: {
      y: {
        formatter: (val) => {
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(val);
        },
      },
    },
    legend: {
      show: false,
    },
    grid: {
      borderColor: '#e0e0e0',
      strokeDashArray: 4,
    },
  };

  const pieSeries = data.map(d => d.total_revenue || 0);
  const barSeries = [
    {
      name: 'Doanh thu',
      data: data.map(d => d.total_revenue || 0),
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Doanh thu theo Danh mục
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Phân tích doanh thu từng danh mục sản phẩm
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
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
          <ToggleButton value="pie">Tròn</ToggleButton>
          <ToggleButton value="bar">Cột</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {data.length > 0 ? (
        <>
          <Box sx={{ mt: 2 }}>
            {chartType === 'pie' ? (
              <ReactApexChart
                options={pieChartOptions}
                series={pieSeries}
                type="pie"
                height={350}
              />
            ) : (
              <ReactApexChart
                options={barChartOptions}
                series={barSeries}
                type="bar"
                height={350}
              />
            )}
          </Box>

          {/* Custom Legend */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 1.5,
              mt: 2,
            }}
          >
            {data.map((item, index) => (
              <Box
                key={item.category_name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: colors[index % colors.length],
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.category_name}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
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
          <Typography>Không có dữ liệu danh mục</Typography>
        </Box>
      )}
    </Box>
  );
};

export default SalesByCategoryChart;
