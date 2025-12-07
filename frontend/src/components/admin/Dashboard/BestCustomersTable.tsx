import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Trophy } from '@phosphor-icons/react';
import { api } from '../../../services/api';

interface TopCustomer {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url?: string;
  total_orders: number;
  total_spent: number;
}

const BestCustomersTable: React.FC = () => {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBestCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.dashboard.getBestCustomers(10);
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching best customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBestCustomers();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
    return '#E0E0E0';
  };

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Trophy size={24} weight="fill" color="#FFD700" />
        <Typography variant="h6" fontWeight={600}>
          Top 10 Khách hàng VIP
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Xếp hạng theo tổng chi tiêu
      </Typography>

      {customers.length > 0 ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 60 }}>Hạng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Khách hàng</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Đơn hàng</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Tổng chi tiêu</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={customer.user_id} hover>
                  <TableCell>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: getRankColor(index),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: index < 3 ? '#FFF' : '#666',
                      }}
                    >
                      {index + 1}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={customer.avatar_url}
                        alt={customer.full_name}
                        sx={{ width: 36, height: 36 }}
                      >
                        {customer.full_name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {customer.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {customer.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={customer.total_orders}
                      size="small"
                      sx={{
                        bgcolor: '#E3F2FD',
                        color: '#1976D2',
                        fontWeight: 600,
                        minWidth: 45,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatCurrency(customer.total_spent)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box
          sx={{
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Typography>Không có dữ liệu khách hàng</Typography>
        </Box>
      )}
    </Box>
  );
};

export default BestCustomersTable;
