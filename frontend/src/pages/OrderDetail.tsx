import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { generateInvoicePDF } from '../utils/pdfInvoice';
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent,
  Button,
  Chip,
  Breadcrumbs,
  Link as MuiLink,
  Divider,
  Alert
} from '@mui/material';
import { 
  Home as HomeIcon,
  Receipt as ReceiptIcon,
  LocalShipping as ShippingIcon,
  Cancel as CancelIcon,
  Replay as ReplayIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderData {
  order_id: number;
  order_code: string;
  user_id: number;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  shipping_fee: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_ward: string;
  shipping_district: string;
  shipping_province: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  status_history?: {
    status: string;
    created_at: string;
    notes: string;
  }[];
}

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.getOrderDetail(Number(orderId));
      
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError('Không tìm thấy đơn hàng');
      }
    } catch (err: any) {
      console.error('Error loading order detail:', err);
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    
    try {
      await api.cancelOrder(Number(orderId));
      alert('Hủy đơn hàng thành công');
      loadOrderDetail();
    } catch (error) {
      console.error('Cancel order error:', error);
      alert('Không thể hủy đơn hàng');
    }
  };

  const handleDownloadInvoice = () => {
    if (!order) return;
    generateInvoicePDF(order);
  };

  const handleReorder = async () => {
    if (!order) return;
    
    try {
      // Add all items to cart
      for (const item of order.items) {
        await api.addToCart(item.product_id, item.quantity);
      }
      alert('Đã thêm sản phẩm vào giỏ hàng');
      navigate('/cart');
    } catch (error) {
      console.error('Reorder error:', error);
      alert('Không thể mua lại đơn hàng');
    }
  };

  const formatPrice = (price: number | string | undefined) => {
    if (!price && price !== 0) return '0 ₫';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0 ₫';
    return numPrice.toLocaleString('vi-VN') + ' ₫';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': '#ffa500',
      'confirmed': '#2196f3',
      'processing': '#9c27b0',
      'shipping': '#ff9800',
      'delivered': '#4caf50',
      'completed': '#4caf50',
      'cancelled': '#f44336',
      'refunded': '#607d8b'
    };
    return colors[status] || '#999';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'processing': 'Đang xử lý',
      'shipping': 'Đang giao',
      'delivered': 'Đã giao',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'refunded': 'Đã hoàn tiền'
    };
    return labels[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Chưa thanh toán',
      'paid': 'Đã thanh toán',
      'refunded': 'Đã hoàn tiền'
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'cod': 'Thanh toán khi nhận hàng (COD)',
      'bank_transfer': 'Chuyển khoản ngân hàng',
      'credit_card': 'Thẻ tín dụng/ghi nợ',
      'momo': 'Ví MoMo',
      'zalopay': 'ZaloPay'
    };
    return labels[method] || method;
  };

  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed'].includes(status);
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Đang tải thông tin đơn hàng...
        </Typography>
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Không tìm thấy đơn hàng'}</Alert>
        <Button variant="contained" onClick={() => navigate('/orders')}>
          Quay lại danh sách đơn hàng
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <MuiLink component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
            <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
            Trang chủ
          </MuiLink>
          <MuiLink component={Link} to="/orders" sx={{ color: 'inherit', textDecoration: 'none' }}>
            Đơn hàng của tôi
          </MuiLink>
          <Typography color="primary" fontWeight={600}>
            Chi tiết đơn hàng #{order.order_code}
          </Typography>
        </Breadcrumbs>

        {/* Order Header */}
        <Card sx={{ mb: 2, borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                  Đơn hàng #{order.order_code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Đặt lúc: {formatDate(order.created_at)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={getStatusLabel(order.order_status)}
                  sx={{ 
                    bgcolor: getStatusColor(order.order_status),
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: '4px'
                  }}
                />
                <Chip 
                  label={getPaymentStatusLabel(order.payment_status)}
                  variant="outlined"
                  sx={{ borderRadius: '4px' }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left Column - Main Content */}
          <Box sx={{ flex: 1 }}>
            {/* Order Timeline */}
            <Card sx={{ mb: 2, borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShippingIcon color="primary" />
                  Trạng thái đơn hàng
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {order.status_history && order.status_history.length > 0 ? (
                  <Box sx={{ position: 'relative', pl: 3 }}>
                    {order.status_history.map((history, index) => (
                      <Box key={index} sx={{ position: 'relative', pb: 3 }}>
                        <Box
                          sx={{
                            position: 'absolute',
                            left: -20,
                            top: 4,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: getStatusColor(history.status),
                            border: '2px solid white',
                            boxShadow: '0 0 0 2px ' + getStatusColor(history.status)
                          }}
                        />
                        {index < order.status_history!.length - 1 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              left: -14,
                              top: 16,
                              width: 2,
                              height: 'calc(100% - 8px)',
                              bgcolor: '#e0e0e0'
                            }}
                          />
                        )}
                        <Typography variant="body2" fontWeight={600}>
                          {getStatusLabel(history.status)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(history.created_at)}
                        </Typography>
                        {history.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {history.notes}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Chưa có lịch sử cập nhật
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card sx={{ borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReceiptIcon color="primary" />
                  Sản phẩm ({order.items.length})
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                {order.items.map((item) => (
                  <Box key={item.order_item_id} sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: '1px solid #f0f0f0' }}>
                    <Box
                      component={Link}
                      to={`/product/${item.product_slug}`}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '4px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid #e0e0e0',
                        textDecoration: 'none'
                      }}
                    >
                      <img
                        src={item.product_image || '/placeholder.png'}
                        alt={item.product_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        component={Link}
                        to={`/product/${item.product_slug}`}
                        variant="body1"
                        fontWeight={500}
                        sx={{ 
                          display: 'block',
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': { color: 'primary.main' },
                          mb: 0.5
                        }}
                      >
                        {item.product_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Số lượng: {item.quantity}
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="primary.main" sx={{ mt: 1 }}>
                        {formatPrice(item.price)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight={600}>
                        {formatPrice(item.subtotal)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Summary & Actions */}
          <Box sx={{ width: { xs: '100%', md: 360 } }}>
            {/* Shipping Info */}
            <Card sx={{ mb: 2, borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Thông tin giao hàng
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ '& > *': { mb: 1.5 } }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Người nhận</Typography>
                    <Typography variant="body2" fontWeight={500}>{order.shipping_name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Số điện thoại</Typography>
                    <Typography variant="body2" fontWeight={500}>{order.shipping_phone}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Địa chỉ</Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {order.shipping_address}, {order.shipping_ward}, {order.shipping_district}, {order.shipping_province}
                    </Typography>
                  </Box>
                  {order.notes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Ghi chú</Typography>
                      <Typography variant="body2" fontWeight={500}>{order.notes}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card sx={{ mb: 2, borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Thanh toán
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ '& > *': { display: 'flex', justifyContent: 'space-between', mb: 1.5 } }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Tạm tính</Typography>
                    <Typography variant="body2">{formatPrice(order.total_amount)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                    <Typography variant="body2">{formatPrice(order.shipping_fee)}</Typography>
                  </Box>
                  {order.discount_amount > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">Giảm giá</Typography>
                      <Typography variant="body2" color="error">-{formatPrice(order.discount_amount)}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ width: '100%' }} />
                  <Box>
                    <Typography variant="body1" fontWeight={700}>Tổng cộng</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {formatPrice(order.final_amount)}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: '4px', width: '100%' }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Phương thức thanh toán
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {getPaymentMethodLabel(order.payment_method)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card sx={{ borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ '& > button': { width: '100%', mb: 1.5, borderRadius: '4px' } }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadInvoice}
                  sx={{ bgcolor: '#2196f3', '&:hover': { bgcolor: '#1976d2' } }}
                >
                  Tải hóa đơn PDF
                </Button>
                
                <Button
                  variant="contained"
                  startIcon={<ReplayIcon />}
                  onClick={handleReorder}
                  sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E95211' } }}
                >
                  Mua lại
                </Button>
                
                {canCancelOrder(order.order_status) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelOrder}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
                
                <Button
                  variant="outlined"
                  onClick={() => navigate('/orders')}
                  sx={{ mb: 0 }}
                >
                  Quay lại danh sách
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default OrderDetail;
