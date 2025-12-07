import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

interface OrderInfo {
  order_id: number;
  total_amount: number;
  final_amount: number;
  customer_name: string;
  customer_phone: string;
}

const BankTransferInstructions: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get order info from location state or URL params
    const state = location.state as { orderInfo?: OrderInfo };
    if (state?.orderInfo) {
      setOrderInfo(state.orderInfo);
    }
  }, [location]);

  const bankInfo = {
    bankName: 'Ngân hàng TMCP Á Châu (ACB)',
    accountNumber: '1234567890',
    accountName: 'CONG TY TNHH BADMINTON STORE',
    branch: 'Chi nhánh TP.HCM',
    swiftCode: 'ASCBVNVX'
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const transferContent = orderInfo 
    ? `Thanh toan don hang #${orderInfo.order_id}` 
    : 'Thanh toan don hang';

  return (
    <div style={{
      minHeight: '60vh',
      padding: '40px 20px',
      background: '#f8f9fa'
    }}>
      <div className="container">
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              background: '#2196f3',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: 'white'
            }}>
              <i className="fa fa-university"></i>
            </div>
            
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#2c3e50',
              marginBottom: '10px'
            }}>
              Hướng dẫn chuyển khoản
            </h1>
            
            <p style={{ fontSize: '16px', color: '#666' }}>
              Vui lòng chuyển khoản theo thông tin bên dưới
            </p>
          </div>

          {/* Order Info */}
          {orderInfo && (
            <div style={{
              background: '#e8f5e9',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '30px',
              border: '2px solid #4caf50'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#2e7d32',
                marginBottom: '15px'
              }}>
                Thông tin đơn hàng
              </h3>
              
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Mã đơn hàng:</strong></span>
                  <span>#{orderInfo.order_id}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong>Số tiền cần thanh toán:</strong></span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#E95211' }}>
                    {formatPrice(orderInfo.final_amount || orderInfo.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bank Account Info */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '25px',
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2c3e50',
              marginBottom: '20px'
            }}>
              Thông tin tài khoản nhận
            </h3>

            <div style={{ display: 'grid', gap: '15px' }}>
              {/* Bank Name */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'white',
                borderRadius: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    Ngân hàng
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {bankInfo.bankName}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(bankInfo.bankName, 'Tên ngân hàng')}
                  style={{
                    padding: '8px 16px',
                    background: '#E95211',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fa fa-copy"></i> Sao chép
                </button>
              </div>

              {/* Account Number */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'white',
                borderRadius: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    Số tài khoản
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#E95211' }}>
                    {bankInfo.accountNumber}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(bankInfo.accountNumber, 'Số tài khoản')}
                  style={{
                    padding: '8px 16px',
                    background: '#E95211',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fa fa-copy"></i> Sao chép
                </button>
              </div>

              {/* Account Name */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'white',
                borderRadius: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    Chủ tài khoản
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {bankInfo.accountName}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(bankInfo.accountName, 'Tên chủ tài khoản')}
                  style={{
                    padding: '8px 16px',
                    background: '#E95211',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fa fa-copy"></i> Sao chép
                </button>
              </div>

              {/* Transfer Content */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: 'white',
                borderRadius: '6px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                    Nội dung chuyển khoản
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4caf50' }}>
                    {transferContent}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(transferContent, 'Nội dung')}
                  style={{
                    padding: '8px 16px',
                    background: '#E95211',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <i className="fa fa-copy"></i> Sao chép
                </button>
              </div>
            </div>

            {copied && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: '#4caf50',
                color: 'white',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '14px'
              }}>
                ✓ Đã sao chép!
              </div>
            )}
          </div>

          {/* Instructions */}
          <div style={{
            background: '#fff3e0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#e65100',
              marginBottom: '15px'
            }}>
              <i className="fa fa-info-circle" style={{ marginRight: '8px' }}></i>
              Lưu ý quan trọng
            </h3>
            
            <ul style={{
              paddingLeft: '20px',
              margin: 0,
              color: '#666',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              <li>Vui lòng chuyển <strong>ĐÚNG số tiền</strong> và ghi <strong>ĐÚNG nội dung</strong> để đơn hàng được xử lý nhanh chóng</li>
              <li>Đơn hàng sẽ được xác nhận trong vòng <strong>30 phút - 2 giờ</strong> sau khi chuyển khoản thành công</li>
              <li>Nếu sau 2 giờ đơn hàng chưa được xác nhận, vui lòng liên hệ hotline: <strong>1900-xxxx</strong></li>
              <li>Chúng tôi sẽ gửi email/SMS thông báo khi nhận được thanh toán</li>
            </ul>
          </div>

          {/* QR Code */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#2c3e50',
              marginBottom: '15px'
            }}>
              Hoặc quét mã QR để chuyển khoản nhanh
            </h3>
            
            <div style={{
              width: '220px',
              height: '220px',
              margin: '0 auto',
              background: '#fff',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {orderInfo ? (
                <QRCodeSVG
                  value={`${bankInfo.accountNumber}|${bankInfo.bankName}|${bankInfo.accountName}|${orderInfo.final_amount}|${transferContent}`}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>
                  <i className="fa fa-qrcode" style={{ fontSize: '60px', marginBottom: '10px', display: 'block' }}></i>
                  Loading QR...
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '12px', color: '#999', marginTop: '15px', lineHeight: '1.6' }}>
              <i className="fa fa-info-circle" style={{ marginRight: '5px' }}></i>
              Quét mã QR bằng app ngân hàng để tự động điền thông tin
            </p>
          </div>

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
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankTransferInstructions;
