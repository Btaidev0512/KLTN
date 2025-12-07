import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentFailed: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const error = searchParams.get('error');
    const orderId = searchParams.get('order');

    if (error === 'invalid_signature') {
      setErrorMessage('Chữ ký không hợp lệ. Giao dịch bị từ chối.');
    } else if (error === 'system_error') {
      setErrorMessage('Lỗi hệ thống. Vui lòng thử lại sau.');
    } else if (error === 'cancelled') {
      setErrorMessage('Bạn đã hủy giao dịch.');
    } else if (orderId) {
      setErrorMessage('Thanh toán không thành công. Vui lòng thử lại.');
    } else {
      setErrorMessage('Có lỗi xảy ra trong quá trình thanh toán.');
    }
  }, [location]);

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
          {/* Error Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 30px',
            background: '#f44336',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px',
            color: 'white'
          }}>
            ✕
          </div>

          {/* Error Message */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '15px'
          }}>
            Thanh toán thất bại
          </h1>

          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '30px'
          }}>
            {errorMessage || 'Giao dịch của bạn không thành công. Vui lòng thử lại.'}
          </p>

          {/* Error Details */}
          <div style={{
            background: '#fff3e0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '15px',
              color: '#e65100'
            }}>
              <i className="fa fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
              Lý do có thể gặp lỗi:
            </h3>
            
            <ul style={{
              paddingLeft: '20px',
              margin: 0,
              color: '#666',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              <li>Số dư tài khoản không đủ</li>
              <li>Thông tin thẻ không chính xác</li>
              <li>Giao dịch bị hủy bởi người dùng</li>
              <li>Thẻ đã hết hạn hoặc bị khóa</li>
              <li>Vượt quá hạn mức giao dịch</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/checkout')}
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
              Thử lại
            </button>
            
            <button
              onClick={() => navigate('/cart')}
              style={{
                padding: '12px 30px',
                background: 'white',
                color: '#666',
                border: '2px solid #ddd',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#E95211';
                e.currentTarget.style.color = '#E95211';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#ddd';
                e.currentTarget.style.color = '#666';
              }}
            >
              Quay lại giỏ hàng
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
              Về trang chủ
            </button>
          </div>

          {/* Support Info */}
          <div style={{
            marginTop: '30px',
            padding: '15px',
            background: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#1976d2'
          }}>
            <i className="fa fa-phone" style={{ marginRight: '8px' }}></i>
            Cần hỗ trợ? Liên hệ hotline: <strong>1900-xxxx</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
