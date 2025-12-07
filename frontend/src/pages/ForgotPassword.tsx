import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Login.css';

type Step = 'email' | 'verify' | 'reset' | 'success';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Gửi mã xác nhận
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Vui lòng nhập email của bạn');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.forgotPassword(email);
      
      if (response.data.success) {
        setStep('success');
      } else {
        setError(response.data.message || 'Có lỗi xảy ra, vui lòng thử lại');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Xác nhận mã
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    if (!verificationCode.trim()) {
      setError('Vui lòng nhập mã xác nhận');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Giả sử mã xác nhận là token từ email
      // Backend sẽ verify token này
      setStep('reset');
      setError(null);
    } catch (err: any) {
      console.error('Verify code error:', err);
      setError('Mã xác nhận không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Đặt lại mật khẩu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Gọi API reset password với token (verificationCode)
      const response = await api.resetPassword(verificationCode, newPassword);
      
      if (response.data.success) {
        alert('Đặt lại mật khẩu thành công!');
        navigate('/login');
      } else {
        setError(response.data.message || 'Có lỗi xảy ra');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  // Render: Bước hiển thị "Email đã được gửi"
  if (step === 'success') {
    return (
      <div className="container page_customer_account">
        <section className="section">
          <div className="container">
            <div className="wrap_background_aside page_login">
              <div className="row">
                <div className="col-lg-4 col-md-6 col-sm-12 col-xl-4 offset-0 offset-xl-4 offset-lg-4 offset-md-3 col-12">
                  <div className="row">
                    <div className="page-login pagecustome clearfix">
                      <div className="wpx">
                        <h1 className="title_heads a-center">
                          <span>✅ Email đã được gửi!</span>
                        </h1>
                        
                        <div className="section" style={{ textAlign: 'center', padding: '20px 0' }}>
                          <p style={{ marginBottom: '15px', color: '#333' }}>
                            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email:
                          </p>
                          <p style={{ marginBottom: '20px', fontWeight: 'bold', color: '#E95211' }}>
                            {email}
                          </p>
                          <p style={{ marginBottom: '20px', fontSize: '13px', color: '#666' }}>
                            Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu. 
                            <br />Nếu không thấy email, hãy kiểm tra thư mục <strong>Spam</strong>.
                          </p>
                          
                          <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0' }}>
                            <button
                              onClick={() => {
                                setStep('verify');
                                setVerificationCode('');
                              }}
                              className="btn btn-style"
                              style={{ 
                                width: '100%',
                                padding: '14px 40px',
                                fontSize: '15px',
                                border: 'none',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                              }}
                            >
                              XÁC NHẬN
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Render: Bước 2 - Xác nhận mã
  if (step === 'verify') {
    return (
      <div className="container page_customer_account">
        <section className="section">
          <div className="container">
            <div className="wrap_background_aside page_login">
              <div className="row">
                <div className="col-lg-4 col-md-6 col-sm-12 col-xl-4 offset-0 offset-xl-4 offset-lg-4 offset-md-3 col-12">
                  <div className="row">
                    <div className="page-login pagecustome clearfix">
                      <div className="wpx">
                        <h1 className="title_heads a-center">
                          <span>Xác nhận mã</span>
                        </h1>
                        
                        <p className="a-center" style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                          Nhập email và mã xác nhận đã được gửi đến hộp thư của bạn
                        </p>

                        <div id="login" className="section">
                          {error && (
                            <div className="alert alert-danger" style={{ 
                              padding: '10px 15px', 
                              marginBottom: '20px', 
                              background: '#f8d7da', 
                              border: '1px solid #f5c6cb', 
                              borderRadius: '4px',
                              color: '#721c24'
                            }}>
                              {error}
                            </div>
                          )}

                          <form onSubmit={handleVerifyCode}>
                            <div className="form-signup clearfix">
                              <fieldset className="form-group">
                                <input
                                  type="email"
                                  className="form-control form-control-lg"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="Email"
                                  required
                                  disabled={loading}
                                />
                              </fieldset>

                              <fieldset className="form-group">
                                <input
                                  type="text"
                                  className="form-control form-control-lg"
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value)}
                                  placeholder="Mã xác nhận"
                                  required
                                  disabled={loading}
                                />
                              </fieldset>

                              <div className="pull-xs-left">
                                <button 
                                  type="submit" 
                                  className="btn btn-style btn_50"
                                  disabled={loading}
                                >
                                  {loading ? 'Đang xác nhận...' : 'Xác nhận'}
                                </button>
                              </div>
                              
                              <div className="btn_boz_khac">
                                <div className="btn_khac">
                                  <button 
                                    type="button"
                                    onClick={() => setStep('email')}
                                    className="btn-link-style"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                  >
                                    ← Quay lại
                                  </button>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Render: Bước 3 - Đặt lại mật khẩu
  if (step === 'reset') {
    return (
      <div className="container page_customer_account">
        <section className="section">
          <div className="container">
            <div className="wrap_background_aside page_login">
              <div className="row">
                <div className="col-lg-4 col-md-6 col-sm-12 col-xl-4 offset-0 offset-xl-4 offset-lg-4 offset-md-3 col-12">
                  <div className="row">
                    <div className="page-login pagecustome clearfix">
                      <div className="wpx">
                        <h1 className="title_heads a-center">
                          <span>Đặt lại mật khẩu</span>
                        </h1>
                        
                        <p className="a-center" style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                          Nhập mật khẩu mới cho tài khoản của bạn
                        </p>

                        <div id="login" className="section">
                          {error && (
                            <div className="alert alert-danger" style={{ 
                              padding: '10px 15px', 
                              marginBottom: '20px', 
                              background: '#f8d7da', 
                              border: '1px solid #f5c6cb', 
                              borderRadius: '4px',
                              color: '#721c24'
                            }}>
                              {error}
                            </div>
                          )}

                          <form onSubmit={handleResetPassword}>
                            <div className="form-signup clearfix">
                              <fieldset className="form-group">
                                <input
                                  type="password"
                                  className="form-control form-control-lg"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Mật khẩu mới"
                                  required
                                  disabled={loading}
                                />
                              </fieldset>

                              <fieldset className="form-group">
                                <input
                                  type="password"
                                  className="form-control form-control-lg"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Nhập lại mật khẩu mới"
                                  required
                                  disabled={loading}
                                />
                              </fieldset>

                              <div className="pull-xs-left">
                                <button 
                                  type="submit" 
                                  className="btn btn-style btn_50"
                                  disabled={loading}
                                >
                                  {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Render: Bước 1 - Nhập email
  return (
    <div className="container page_customer_account">
      <section className="section">
        <div className="container">
          <div className="wrap_background_aside page_login">
            <div className="row">
              <div className="col-lg-4 col-md-6 col-sm-12 col-xl-4 offset-0 offset-xl-4 offset-lg-4 offset-md-3 col-12">
                <div className="row">
                  <div className="page-login pagecustome clearfix">
                    <div className="wpx">
                      <h1 className="title_heads a-center">
                        <span>Quên mật khẩu</span>
                      </h1>
                      
                      <p className="a-center" style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                        Nhập email của bạn để nhận mã xác nhận
                      </p>
                      
                      <div className="social">
                        <Link to="/login" className="line_item item_login">
                          <i className="fa fa-arrow-left"></i>
                          Đã có tài khoản, đăng nhập tại đây
                        </Link>
                      </div>

                      <div id="login" className="section">
                        {error && (
                          <div className="alert alert-danger" style={{ 
                            padding: '10px 15px', 
                            marginBottom: '20px', 
                            background: '#f8d7da', 
                            border: '1px solid #f5c6cb', 
                            borderRadius: '4px',
                            color: '#721c24'
                          }}>
                            {error}
                          </div>
                        )}

                        <form onSubmit={handleSendCode} id="customer_forgot_password">
                          <div className="form-signup clearfix">
                            <fieldset className="form-group">
                              <input
                                type="email"
                                className="form-control form-control-lg"
                                value={email}
                                onChange={(e) => {
                                  setEmail(e.target.value);
                                  if (error) setError(null);
                                }}
                                placeholder="Email"
                                required
                                disabled={loading}
                              />
                            </fieldset>

                            <div className="pull-xs-left">
                              <button 
                                type="submit" 
                                className="btn btn-style btn_50"
                                disabled={loading}
                              >
                                {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                              </button>
                            </div>
                            
                            <div className="btn_boz_khac">
                              <div className="btn_khac">
                                <Link to="/register" className="btn-link-style btn-register" title="Đăng ký tài khoản">
                                  Chưa có tài khoản? Đăng ký ngay
                                </Link>
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForgotPassword;