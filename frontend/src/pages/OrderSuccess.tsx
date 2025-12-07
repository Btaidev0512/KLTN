import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/OrderSuccess.css';

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId;

  return (
    <div className="order-success-page">
      <div className="success-container">
        <div className="success-icon">
          <i className="fa fa-check-circle"></i>
        </div>
        
        <h1 className="success-title">Đặt hàng thành công!</h1>
        
        <p className="success-message">
          Cảm ơn bạn đã đặt hàng tại TTShop. 
          {orderId && ` Mã đơn hàng của bạn là: #${orderId}`}
        </p>
        
        <div className="success-info">
          <div className="info-item">
            <i className="fa fa-envelope"></i>
            <p>Chúng tôi đã gửi email xác nhận đơn hàng đến địa chỉ email của bạn.</p>
          </div>
          
          <div className="info-item">
            <i className="fa fa-phone"></i>
            <p>Nhân viên của chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.</p>
          </div>
          
          <div className="info-item">
            <i className="fa fa-truck"></i>
            <p>Đơn hàng sẽ được giao trong vòng 2-3 ngày làm việc.</p>
          </div>
        </div>
        
        <div className="success-actions">
          {orderId && (
            <button 
              className="btn btn-success"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              <i className="fa fa-file-text"></i>
              Xem chi tiết đơn hàng
            </button>
          )}
          
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/products')}
          >
            <i className="fa fa-shopping-bag"></i>
            Tiếp tục mua sắm
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            <i className="fa fa-home"></i>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
