import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { api } from '../../../services/api';

interface OrderStatusData {
  status: string;
  count: number;
  percentage: number;
}

const CategoryDistributionChart: React.FC = () => {
  const [data, setData] = useState<OrderStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDistributionData = async () => {
    try {
      setLoading(true);
      const response = await api.dashboard.getOrderStatusDistribution();
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLabels: { [key: string]: string } = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đã giao',
    delivered: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const statusColors: { [key: string]: string } = {
    pending: '#FFA726',
    processing: '#42A5F5',
    shipped: '#66BB6A',
    delivered: '#4CAF50',
    cancelled: '#EF5350',
  };

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    labels: data.map(d => statusLabels[d.status] || d.status),
    colors: data.map(d => statusColors[d.status] || '#757575'),
    legend: {
      show: false,  // TẮT legend của ApexChart, dùng custom legend
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              fontSize: '14px',
              fontWeight: 600,
            },
            value: {
              fontSize: '24px',
              fontWeight: 700,
              formatter: (val) => val.toString(),
            },
            total: {
              show: true,
              label: 'Tổng đơn hàng',
              fontSize: '13px',
              fontWeight: 500,
              color: '#666',
              formatter: () => {
                const total = data.reduce((sum, item) => sum + item.count, 0);
                return total.toString();
              },
            },
          },
        },
      },
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
        formatter: (val) => val + ' đơn hàng',
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  const series = data.map(d => d.count);

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
      <Typography variant="h6" fontWeight={600} mb={2}>
        Phân bố Đơn hàng
      </Typography>

      {data.length > 0 ? (
        <>
          <Box>
            <ReactApexChart
              options={chartOptions}
              series={series}
              type="donut"
              height={300}
            />
          </Box>
          
          {/* Custom Legend */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
            mt: 2 
          }}>
            {data.map((item) => (
              <Box 
                key={item.status}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Box sx={{ 
                  width: 10, 
                  height: 10, 
                  borderRadius: '50%', 
                  bgcolor: statusColors[item.status] || '#757575',
                  flexShrink: 0,
                }} />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {statusLabels[item.status] || item.status}
                </Typography>
                <Typography variant="caption" fontWeight={600} sx={{ ml: 'auto' }}>
                  {item.count}
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
          <Typography>Không có dữ liệu đơn hàng</Typography>
        </Box>
      )}
    </Box>
  );
};

export default CategoryDistributionChart;
