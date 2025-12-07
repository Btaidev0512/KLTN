import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/OrderHistory.css';

interface OrderItem {
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  selected_attributes?: any;
}

interface Order {
  order_id: number;
  order_number: string; // ✅ Backend trả về order_number
  total_amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at?: string; // ✅ Thời gian cập nhật đơn hàng
  shipping_address_line_1: string; // ✅ Backend field
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  customer_phone: string; // ✅ Backend field
  shipping_full_name: string; // ✅ Backend field
  items?: OrderItem[];
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.getOrders();
      
      if (response.data.success) {
        let ordersData = response.data.data.orders || [];
        
        // Số ngày giữ đơn hàng đã hoàn thành
        const DAYS_TO_KEEP_COMPLETED = 30;
        
        // Filter by status if needed
        if (selectedStatus !== 'all') {
          ordersData = ordersData.filter((order: Order) => order.status === selectedStatus);
        }
        
        // Auto-hide completed/delivered orders after 30 days
        ordersData = ordersData.filter((order: Order) => {
          // Only filter completed and delivered orders
          if (['delivered', 'completed'].includes(order.status.toLowerCase())) {
            const completedDate = new Date(order.updated_at || order.created_at);
            const daysSinceCompletion = (Date.now() - completedDate.getTime()) / (1000 * 60 * 60 * 24);
            
            // Hide if older than 30 days
            if (daysSinceCompletion > DAYS_TO_KEEP_COMPLETED) {
              return false;
            }
          }
          // Keep all other orders
          return true;
        });
        
        setOrders(ordersData);
      } else {
        setError('Không thể tải danh sách đơn hàng');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      if (err.response?.status === 401) {
        setError('Vui lòng đăng nhập để xem đơn hàng');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const toggleOrderDetails = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'processing':
        return 'status-processing';
      case 'shipping':
        return 'status-shipping';
      case 'delivered':
        return 'status-delivered';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped': // ✅ Backend trả về 'shipped'
        return 'Đang giao hàng';
      case 'shipping': // Support cả 'shipping' nếu có
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      case 'returned':
        return 'Đã trả hàng';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      default:
        return 'Chưa thanh toán';
    }
  };

  const formatPrice = (price: number | string | undefined) => {
    if (!price) return '0 ₫';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numPrice);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải đơn hàng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-page">
        <div className="container">
          <div className="error-container">
            <i className="fa fa-exclamation-circle"></i>
            <p>{error}</p>
            <button onClick={fetchOrders} className="btn-retry">
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fa fa-shopping-bag"></i>
            Đơn hàng của tôi
          </h1>
          <button onClick={() => navigate('/products')} className="btn-continue-shopping">
            <i className="fa fa-plus"></i>
            Tiếp tục mua sắm
          </button>
        </div>

        {/* Status Filter */}
        <div className="status-filter">
          <button
            className={`filter-btn ${selectedStatus === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('all')}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${selectedStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('pending')}
          >
            Chờ xác nhận
          </button>
          <button
            className={`filter-btn ${selectedStatus === 'processing' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('processing')}
          >
            Đang xử lý
          </button>
          <button
            className={`filter-btn ${selectedStatus === 'shipped' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('shipped')}
          >
            Đang giao
          </button>
          <button
            className={`filter-btn ${selectedStatus === 'delivered' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('delivered')}
          >
            Đã giao
          </button>
          <button
            className={`filter-btn ${selectedStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('completed')}
          >
            Hoàn thành
          </button>
          <button
            className={`filter-btn ${selectedStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('cancelled')}
          >
            Đã hủy
          </button>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="empty-orders">
            <i className="fa fa-inbox"></i>
            <h3>Chưa có đơn hàng nào</h3>
            <p>Hãy khám phá và đặt hàng những sản phẩm yêu thích của bạn!</p>
            <button onClick={() => navigate('/products')} className="btn-shop-now">
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.order_id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <div className="order-code">
                      <i className="fa fa-file-text"></i>
                      <span>Mã đơn: {order.order_number}</span>
                    </div>
                    <div className="order-date">
                      <i className="fa fa-calendar"></i>
                      <span>Ngày đặt: {formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="order-status-badges">
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className={`payment-badge ${order.payment_status === 'paid' ? 'paid' : 'unpaid'}`}>
                      {getPaymentStatusText(order.payment_status)}
                    </span>
                  </div>
                </div>

                <div className="order-body">
                  <div className="order-summary">
                    <div className="summary-item">
                      <span className="label">Tổng tiền:</span>
                      <span className="value price">{formatPrice(order.total_amount)}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Thanh toán:</span>
                      <span className="value">{order.payment_method === 'cod' ? 'COD' : order.payment_method?.toUpperCase()}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">Người nhận:</span>
                      <span className="value">{order.shipping_full_name}</span>
                    </div>
                    <div className="summary-item">
                      <span className="label">SĐT:</span>
                      <span className="value">{order.customer_phone}</span>
                    </div>
                    <div className="summary-item full-width">
                      <span className="label">Địa chỉ:</span>
                      <span className="value">
                        {order.shipping_address_line_1}
                        {order.shipping_city && `, ${order.shipping_city}`}
                        {order.shipping_state && `, ${order.shipping_state}`}
                      </span>
                    </div>
                  </div>

                  {expandedOrders.has(order.order_id) && (
                    <div className="order-details">
                      <div className="shipping-info">
                        <h4>
                          <i className="fa fa-map-marker"></i>
                          Địa chỉ giao hàng chi tiết
                        </h4>
                        <p>
                          <strong>{order.shipping_full_name}</strong> - {order.customer_phone}
                        </p>
                        <p>
                          {order.shipping_address_line_1}
                          {order.shipping_city && `, ${order.shipping_city}`}
                          {order.shipping_state && `, ${order.shipping_state}`}
                          {order.shipping_postal_code && ` - ${order.shipping_postal_code}`}
                        </p>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="order-items">
                          <h4>
                            <i className="fa fa-box"></i>
                            Sản phẩm ({order.items.length})
                          </h4>
                          {order.items.map((item, index) => (
                            <div key={index} className="order-item">
                              <div className="item-image">
                                <img src={item.product_image || '/placeholder.png'} alt={item.product_name} />
                              </div>
                              <div className="item-info">
                                <h5>{item.product_name}</h5>
                                {item.selected_attributes && (
                                  <p className="item-attributes">
                                    {typeof item.selected_attributes === 'string'
                                      ? item.selected_attributes
                                      : JSON.stringify(item.selected_attributes)}
                                  </p>
                                )}
                                <p className="item-quantity">Số lượng: {item.quantity}</p>
                              </div>
                              <div className="item-price">
                                {formatPrice(item.unit_price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="order-footer">
                  <button
                    className="btn-toggle-details"
                    onClick={() => toggleOrderDetails(order.order_id)}
                  >
                    {expandedOrders.has(order.order_id) ? (
                      <>
                        <i className="fa fa-chevron-up"></i>
                        Thu gọn
                      </>
                    ) : (
                      <>
                        <i className="fa fa-chevron-down"></i>
                        Xem chi tiết
                      </>
                    )}
                  </button>

                  <div className="order-actions">
                    <button 
                      className="btn-action btn-track"
                      onClick={() => navigate(`/order-tracking/${order.order_id}`)}
                    >
                      <i className="fa fa-map-marker"></i>
                      Theo dõi đơn hàng
                    </button>
                    {order.status === 'pending' && (
                      <button className="btn-action btn-cancel">
                        <i className="fa fa-times"></i>
                        Hủy đơn
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <button className="btn-action btn-review">
                        <i className="fa fa-star"></i>
                        Đánh giá
                      </button>
                    )}
                    <button className="btn-action btn-contact">
                      <i className="fa fa-phone"></i>
                      Liên hệ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
