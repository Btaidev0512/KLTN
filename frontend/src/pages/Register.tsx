import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Login.css';

interface RegisterFormData {
  username: string;
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
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

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số');
      return false;
    }
    if (formData.full_name.trim().length < 2) {
      setError('Họ và tên phải có ít nhất 2 ký tự');
      return false;
    }
    if (formData.phone && !/^(0|\+84)[0-9]{8,10}$/.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ (ví dụ: 0123456789)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const registerData = {
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address
      };

      console.log('Sending register data:', registerData);
      const response = await api.register(registerData);
      console.log('Register response:', response);

      if (response.data.success) {
        // Auto login after successful registration
        const loginResponse = await api.login({
          email: formData.email,
          password: formData.password
        });

        if (loginResponse.data.success) {
          localStorage.setItem('token', loginResponse.data.token);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.data.user));
          navigate('/');
        } else {
          navigate('/login?message=Đăng ký thành công. Vui lòng đăng nhập.');
        }
      } else {
        setError(response.data.message || 'Đăng ký thất bại');
      }
    } catch (err: any) {
      console.error('Register error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối. Vui lòng thử lại.');
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
                        <span>ĐĂNG KÝ</span>
                      </h1>
                      <span className="block a-center dkm margin-top-10">
                        Đã có tài khoản, đăng nhập <Link to="/login" className="btn-link-style btn-register">tại đây</Link>
                      </span>

                      {/* Register Form */}
                      <div id="login" className="section">
                        <form onSubmit={handleSubmit} id="customer_register" method="post">
                          {/* Error Message */}
                          {error && (
                            <div className="form-signup" style={{ color: 'red' }}>
                              {error}
                            </div>
                          )}

                          <div className="form-signup clearfix">
                            <div className="row">
                              {/* Full Name */}
                              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                <fieldset className="form-group">
                                  <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    value={formData.full_name}
                                    name="full_name"
                                    placeholder="Nhập tên của bạn (*)"
                                    onChange={handleChange}
                                    required
                                  />
                                </fieldset>
                              </div>
                            </div>

                            <div className="row">
                              {/* Email */}
                              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                <fieldset className="form-group">
                                  <input
                                    type="email"
                                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,63}$"
                                    className="form-control form-control-lg"
                                    value={formData.email}
                                    name="email"
                                    placeholder="Nhập email của bạn (*)"
                                    onChange={handleChange}
                                    required
                                  />
                                </fieldset>
                              </div>

                              {/* Phone */}
                              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                <fieldset className="form-group">
                                  <input
                                    type="text"
                                    pattern="\d+"
                                    className="form-control form-control-lg"
                                    value={formData.phone}
                                    name="phone"
                                    placeholder="Số điện thoại"
                                    onChange={handleChange}
                                    required
                                  />
                                </fieldset>
                              </div>

                              {/* Password */}
                              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                <fieldset className="form-group">
                                  <input
                                    type="password"
                                    className="form-control form-control-lg"
                                    value={formData.password}
                                    name="password"
                                    placeholder="Mật khẩu"
                                    onChange={handleChange}
                                    required
                                  />
                                </fieldset>
                              </div>

                              {/* Confirm Password */}
                              <div className="col-md-12 col-lg-12 col-sm-12 col-xs-12">
                                <fieldset className="form-group">
                                  <input
                                    type="password"
                                    className="form-control form-control-lg"
                                    value={formData.confirmPassword}
                                    name="confirmPassword"
                                    placeholder="Nhập lại mật khẩu"
                                    onChange={handleChange}
                                    required
                                  />
                                </fieldset>
                              </div>
                            </div>

                            {/* Submit Button */}
                            <div className="section">
                              <button
                                type="submit"
                                className="btn btn-style btn_50"
                                disabled={loading}
                              >
                                {loading ? 'Đang đăng ký...' : 'ĐĂNG KÝ'}
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
};

export default Register;