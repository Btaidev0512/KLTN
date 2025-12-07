import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/BankTransfer.css';

const BankTransfer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const orderInfo = location.state?.orderInfo;

  useEffect(() => {
    if (!orderInfo) {
      navigate('/');
    }
  }, [orderInfo, navigate]);

  if (!orderInfo) {
    return null;
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép!');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="bank-transfer-page">
      <div className="bank-transfer-container">
        <div className="bank-transfer-header">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h1>Đơn hàng đã được tạo!</h1>
          <p className="order-subtitle">Vui lòng thanh toán để hoàn tất đơn hàng</p>
          <p className="order-number">Mã đơn hàng: <strong>#{orderInfo.order_id}</strong></p>
        </div>

        <div className="bank-transfer-content">
          <div className="instruction-section">
            <h2>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hướng dẫn thanh toán
            </h2>
            <p>Chọn 1 trong 2 phương thức bên dưới để hoàn tất thanh toán đơn hàng</p>
          </div>

          <div className="important-notes">
            <h3>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              Lưu ý quan trọng
            </h3>
            <ul>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Đơn hàng chưa được thanh toán</strong> - Vui lòng chuyển khoản để hoàn tất
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Chuyển khoản <strong>đúng số tiền</strong> và ghi <strong>đúng nội dung</strong> để đơn hàng được xử lý nhanh
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Đơn hàng sẽ được xác nhận trong vòng <strong>2-4 giờ</strong> sau khi nhận được chuyển khoản
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email xác nhận sẽ được gửi đến: <strong>{orderInfo.customer_email}</strong>
              </li>
              <li>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Hotline hỗ trợ: <strong>0368-238-582</strong>
              </li>
            </ul>
          </div>

          <div className="payment-split-container">
            <div className="qr-section">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Quét mã QR
              </h3>
              <p className="qr-description">Sử dụng app ngân hàng để quét mã</p>
              <div className="qr-code-wrapper">
                <img 
                  src="/images/qr-bank.png" 
                  alt="QR Code chuyển khoản" 
                  className="qr-code-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'qr-placeholder';
                    placeholder.innerHTML = `
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <p>Mã QR chưa sẵn sàng</p>
                    `;
                    target.parentElement?.appendChild(placeholder);
                  }}
                />
              </div>
              <div className="qr-info-box">
                <div className="qr-info-item">
                  <span className="qr-info-label">Số tiền:</span>
                  <span className="qr-info-value">{formatPrice(orderInfo.final_amount)}</span>
                </div>
                <div className="qr-info-item">
                  <span className="qr-info-label">Nội dung:</span>
                  <span className="qr-info-value">DH{orderInfo.order_id}</span>
                </div>
              </div>
            </div>

            <div className="divider-or">
              <span>HOẶC</span>
            </div>

            <div className="manual-transfer-section">
              <h3>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Chuyển khoản thủ công
              </h3>
              <p className="manual-description">Sao chép thông tin và chuyển qua app ngân hàng</p>
              
              <div className="manual-transfer-grid">
                <div className="transfer-info-card">
                  <label>Ngân hàng</label>
                  <div className="info-content">
                    <strong>MB Bank</strong>
                    <span className="sub-info">Chi nhánh TP.HCM</span>
                  </div>
                </div>

                <div className="transfer-info-card highlight">
                  <label>Số tài khoản</label>
                  <div className="info-content">
                    <strong className="mono-text">0368238582</strong>
                    <button 
                      className="copy-btn-mini"
                      onClick={() => copyToClipboard('0368238582')}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="transfer-info-card">
                  <label>Chủ tài khoản</label>
                  <div className="info-content">
                    <strong>ĐOÀN TRẦN BÌNH TÀI</strong>
                  </div>
                </div>

                <div className="transfer-info-card highlight">
                  <label>Số tiền</label>
                  <div className="info-content">
                    <strong className="amount-large">{formatPrice(orderInfo.final_amount)}</strong>
                    <button 
                      className="copy-btn-mini"
                      onClick={() => copyToClipboard(orderInfo.final_amount.toString())}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="transfer-info-card highlight full-width">
                  <label>Nội dung chuyển khoản</label>
                  <div className="info-content">
                    <strong className="mono-text">DH{orderInfo.order_id} {orderInfo.customer_phone}</strong>
                    <button 
                      className="copy-btn-mini"
                      onClick={() => copyToClipboard(`DH${orderInfo.order_id} ${orderInfo.customer_phone}`)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Về trang chủ
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransfer;
