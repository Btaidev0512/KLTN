import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Login.css';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      if (response.data.success) {
        // Use AuthContext to store login state
        login(response.data.data.user, response.data.token);
        
        const user = response.data.data.user;
        
        toast.success(`Chào mừng ${user.full_name || user.username}!`);
        
        // Redirect based on user role
        if (user.role === 'admin') {
          // Admin ALWAYS go to admin dashboard
          console.log('✅ Admin login, redirecting to /admin');
          setTimeout(() => {
            window.location.href = '/admin'; // Force reload to admin
          }, 500);
        } else {
          // Regular user redirect to home or previous page
          const redirectTo = new URLSearchParams(window.location.search).get('redirect') || '/';
          console.log('✅ User login, redirecting to:', redirectTo);
          navigate(redirectTo, { replace: true });
        }
      } else {
        setError(response.data.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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
                        <span>ĐĂNG NHẬP</span>
                      </h1>
                      
                      <div id="login" className="section">
                        <form onSubmit={handleSubmit} id="customer_login" method="post">
                          {/* Error Message */}
                          {error && (
                            <span className="form-signup" style={{ color: 'red' }}>
                              {error}
                            </span>
                          )}

                          <div className="form-signup clearfix">
                            {/* Email Input */}
                            <fieldset className="form-group">
                              <input
                                type="text"
                                className="form-control form-control-lg"
                                value={formData.email}
                                name="email"
                                placeholder="Email/Số ĐT"
                                onChange={handleChange}
                                required
                              />
                            </fieldset>

                            {/* Password Input */}
                            <fieldset className="form-group">
                              <input
                                type="password"
                                className="form-control form-control-lg"
                                value={formData.password}
                                name="password"
                                id="customer_password"
                                placeholder="Mật khẩu"
                                onChange={handleChange}
                                required
                              />
                            </fieldset>

                            {/* Submit Button */}
                            <div className="pull-xs-left">
                              <input
                                className="btn btn-style btn_50"
                                type="submit"
                                value={loading ? "Đang đăng nhập..." : "ĐĂNG NHẬP"}
                                disabled={loading}
                              />
                            </div>

                            {/* Links */}
                            <div className="btn_boz_khac">
                              <div className="btn_khac">
                                <Link to="/register" className="btn-link-style btn-register" title="Đăng ký tại đây">
                                  Đăng ký tại đây
                                </Link>
                              </div>
                              <div className="btn_khac">
                                <Link to="/forgot-password" className="btn-link-style btn-register">
                                  Quên mật khẩu
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

export default Login;