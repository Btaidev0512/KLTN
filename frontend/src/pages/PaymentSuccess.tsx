import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('order');
    
    if (orderId) {
      fetchOrderInfo(orderId);
    } else {
      setLoading(false);
    }
  }, [location]);

  const fetchOrderInfo = async (orderId: string) => {
    try {
      const response = await api.getOrderById(orderId);
      if (response.data.success) {
        setOrderInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '60vh',
      padding: '40px 20px',
      background: '#f8f9fa'
    }}>
      <div className="container">
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          {/* Success Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 30px',
            background: '#4caf50',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: 'white'
          }}>
            ✓
          </div>

          {/* Success Message */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '15px'
          }}>
            Thanh toán thành công!
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '30px'
          }}>
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được xác nhận thanh toán.
          </p>

          {/* Order Info */}
          {orderInfo && (
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px',
              textAlign: 'left'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '15px',
                color: '#2c3e50'
              }}>
                Thông tin đơn hàng
              </h3>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Mã đơn hàng:</strong> #{orderInfo.order_id}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Tổng tiền:</strong> {formatPrice(orderInfo.final_amount || orderInfo.total_amount)}
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <strong>Phương thức thanh toán:</strong> {
                  orderInfo.payment_method === 'cod' ? 'COD' :
                  orderInfo.payment_method === 'vnpay' ? 'VNPay' :
                  orderInfo.payment_method === 'momo' ? 'MoMo' :
                  'Chuyển khoản ngân hàng'
                }
              </div>
              
              <div>
                <strong>Trạng thái:</strong>{' '}
                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>
                  Đã thanh toán
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/order-history')}
              style={{
                padding: '12px 30px',
                background: '#E95211',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#d14710'}
              onMouseOut={(e) => e.currentTarget.style.background = '#E95211'}
            >
              Xem đơn hàng
            </button>
            
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 30px',
                background: 'white',
                color: '#E95211',
                border: '2px solid #E95211',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#E95211';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#E95211';
              }}
            >
              Tiếp tục mua sắm
            </button>
          </div>

          {/* Additional Info */}
          <div style={{
            marginTop: '30px',
            padding: '15px',
            background: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1976d2'
          }}>
            <i className="fa fa-info-circle" style={{ marginRight: '8px' }}></i>
            Chúng tôi đã gửi email xác nhận đơn hàng đến địa chỉ email của bạn.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
