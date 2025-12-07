import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/OrderTracking.css';

interface OrderItem {
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface TrackingHistory {
  status: string;
  timestamp: string;
  description: string;
  notes?: string;
}

interface TrackingData {
  order_id: number;
  order_code: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_district: string;
  shipping_ward: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
  tracking_history: TrackingHistory[];
}

const OrderTracking: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.trackOrder(orderId!);
        
        if (response.data.success) {
          setTracking(response.data.data);
        } else {
          setError(response.data.message || 'Không thể tải thông tin đơn hàng');
        }
      } catch (err: any) {
        console.error('Error fetching tracking:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadTracking();
    }
  }, [orderId]);

  const getStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'processing': 'Đang xử lý',
      'shipping': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy',
      'returned': 'Đã trả hàng'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'pending': '#FFA500',
      'confirmed': '#4169E1',
      'processing': '#9370DB',
      'shipping': '#20B2AA',
      'delivered': '#32CD32',
      'cancelled': '#DC143C',
      'returned': '#FF6347'
    };
    return colorMap[status] || '#999';
  };

  const getPaymentMethodText = (method: string): string => {
    const methodMap: { [key: string]: string } = {
      'cod': 'Thanh toán khi nhận hàng (COD)',
      'bank_transfer': 'Chuyển khoản ngân hàng',
      'vnpay': 'VNPay',
      'momo': 'Ví MoMo'
    };
    return methodMap[method] || method;
  };

  const getPaymentStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Chờ thanh toán',
      'paid': 'Đã thanh toán',
      'failed': 'Thanh toán thất bại',
      'refunded': 'Đã hoàn tiền'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (!price) return '0 ₫';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numPrice);
  };

  const orderSteps = [
    { key: 'pending', label: 'Đặt hàng', icon: '📝' },
    { key: 'confirmed', label: 'Xác nhận', icon: '✅' },
    { key: 'processing', label: 'Xử lý', icon: '📦' },
    { key: 'shipping', label: 'Vận chuyển', icon: '🚚' },
    { key: 'delivered', label: 'Hoàn thành', icon: '🎉' }
  ];

  const getCurrentStepIndex = (status: string): number => {
    if (status === 'cancelled' || status === 'returned') return -1;
    const index = orderSteps.findIndex(step => step.key === status);
    return index !== -1 ? index : 0;
  };

  if (loading) {
    return (
      <div className="order-tracking-container">
        <div className="tracking-loading">
          <div className="spinner"></div>
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="order-tracking-container">
        <div className="tracking-error">
          <div className="error-icon">⚠️</div>
          <h2>Không tìm thấy đơn hàng</h2>
          <p>{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền truy cập'}</p>
          <button onClick={() => navigate('/order-history')} className="back-button">
            Quay lại lịch sử đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(tracking.status);
  const isCancelled = tracking.status === 'cancelled';
  const isReturned = tracking.status === 'returned';

  return (
    <div className="order-tracking-container">
      {/* Header */}
      <div className="tracking-header">
        <button onClick={() => navigate('/order-history')} className="back-btn">
          ← Quay lại
        </button>
        <h1>Theo dõi đơn hàng</h1>
      </div>

      {/* Order Info Card */}
      <div className="tracking-card order-info-card">
        <div className="order-info-header">
          <div className="order-code-section">
            <h2>Đơn hàng #{tracking.order_code}</h2>
            <span className="order-date">{formatDate(tracking.created_at)}</span>
          </div>
          <div className="order-status-badge" style={{ background: getStatusColor(tracking.status) }}>
            {getStatusText(tracking.status)}
          </div>
        </div>

        {tracking.tracking_number && (
          <div className="tracking-number">
            <span className="label">Mã vận đơn:</span>
            <span className="value">{tracking.tracking_number}</span>
          </div>
        )}
      </div>

      {/* Progress Timeline */}
      {!isCancelled && !isReturned && (
        <div className="tracking-card timeline-card">
          <h3>Trạng thái đơn hàng</h3>
          <div className="order-timeline">
            {orderSteps.map((step, index) => (
              <div 
                key={step.key} 
                className={`timeline-step ${index <= currentStepIndex ? 'completed' : ''} ${index === currentStepIndex ? 'current' : ''}`}
              >
                <div className="step-icon">{step.icon}</div>
                <div className="step-label">{step.label}</div>
                {index < orderSteps.length - 1 && (
                  <div className={`step-line ${index < currentStepIndex ? 'completed' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancelled/Returned Status */}
      {(isCancelled || isReturned) && (
        <div className="tracking-card status-alert-card">
          <div className="status-alert cancelled">
            <span className="alert-icon">❌</span>
            <div className="alert-content">
              <h3>{isReturned ? 'Đơn hàng đã trả' : 'Đơn hàng đã hủy'}</h3>
              <p>
                {isReturned 
                  ? 'Đơn hàng này đã được trả lại.' 
                  : 'Đơn hàng này đã bị hủy.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tracking History */}
      {tracking.tracking_history && tracking.tracking_history.length > 0 && (
        <div className="tracking-card history-card">
          <h3>Lịch sử vận chuyển</h3>
          <div className="tracking-history">
            {tracking.tracking_history.map((history, index) => (
              <div key={index} className="history-item">
                <div className="history-dot"></div>
                <div className="history-content">
                  <div className="history-status">{getStatusText(history.status)}</div>
                  <div className="history-time">{formatDate(history.timestamp)}</div>
                  <div className="history-description">{history.description}</div>
                  {history.notes && <div className="history-notes">{history.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tracking-grid">
        {/* Shipping Info */}
        <div className="tracking-card shipping-card">
          <h3>📍 Thông tin giao hàng</h3>
          <div className="info-group">
            <div className="info-item">
              <span className="label">Người nhận:</span>
              <span className="value">{tracking.shipping_name}</span>
            </div>
            <div className="info-item">
              <span className="label">Số điện thoại:</span>
              <span className="value">{tracking.shipping_phone}</span>
            </div>
            <div className="info-item">
              <span className="label">Địa chỉ:</span>
              <span className="value">
                {tracking.shipping_address}
                {tracking.shipping_ward && `, ${tracking.shipping_ward}`}
                {tracking.shipping_district && `, ${tracking.shipping_district}`}
                {tracking.shipping_city && `, ${tracking.shipping_city}`}
              </span>
            </div>
            {tracking.estimated_delivery && (
              <div className="info-item highlighted">
                <span className="label">Dự kiến giao:</span>
                <span className="value">{formatDate(tracking.estimated_delivery)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="tracking-card payment-card">
          <h3>💳 Thông tin thanh toán</h3>
          <div className="info-group">
            <div className="info-item">
              <span className="label">Phương thức:</span>
              <span className="value">{getPaymentMethodText(tracking.payment_method)}</span>
            </div>
            <div className="info-item">
              <span className="label">Trạng thái:</span>
              <span className={`value payment-status ${tracking.payment_status}`}>
                {getPaymentStatusText(tracking.payment_status)}
              </span>
            </div>
            <div className="info-item total">
              <span className="label">Tổng tiền:</span>
              <span className="value price">{formatPrice(tracking.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="tracking-card items-card">
        <h3>📦 Sản phẩm ({tracking.items.length})</h3>
        <div className="order-items">
          {tracking.items.map((item, index) => (
            <div key={index} className="order-item">
              <div className="item-image">
                <img 
                  src={item.product_image || '/placeholder.png'} 
                  alt={item.product_name}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.png';
                  }}
                />
              </div>
              <div className="item-details">
                <h4>{item.product_name}</h4>
                <div className="item-meta">
                  <span className="item-quantity">Số lượng: {item.quantity}</span>
                  <span className="item-price">{formatPrice(item.unit_price)}</span>
                </div>
              </div>
              <div className="item-total">
                {formatPrice(item.total_price)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="tracking-actions">
        {tracking.status === 'delivered' && (
          <button className="action-btn review-btn">
            ⭐ Đánh giá sản phẩm
          </button>
        )}
        {tracking.status === 'pending' && (
          <button className="action-btn cancel-btn" onClick={() => {
            if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
              // TODO: Call cancel order API
              alert('Chức năng hủy đơn đang được phát triển');
            }
          }}>
            ❌ Hủy đơn hàng
          </button>
        )}
        <button className="action-btn contact-btn" onClick={() => {
          window.location.href = 'tel:1900xxxx';
        }}>
          📞 Liên hệ hỗ trợ
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;
