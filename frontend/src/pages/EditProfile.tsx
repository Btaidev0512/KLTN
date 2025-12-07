import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/EditProfile.css';

interface UserFormData {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  birth_month: string;
  birth_day: string;
  birth_year: string;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const EditProfile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // User info form state
  const [userForm, setUserForm] = useState<UserFormData>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    gender: '',
    birth_month: '',
    birth_day: '',
    birth_year: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [loading, setLoading] = useState(false);
  const [userMessage, setUserMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load user data into form
    if (user) {
      setUserForm(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        gender: user.gender || '',
        // Parse birth_date if exists
        birth_month: user.birth_date ? new Date(user.birth_date).getMonth() + 1 + '' : '',
        birth_day: user.birth_date ? new Date(user.birth_date).getDate() + '' : '',
        birth_year: user.birth_date ? new Date(user.birth_date).getFullYear() + '' : ''
      }));
    }
  }, [isAuthenticated, navigate, user]);

  // Auto clear user messages after 5 seconds
  useEffect(() => {
    if (userMessage) {
      const timer = setTimeout(() => {
        setUserMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userMessage]);

  // Auto clear password messages after 5 seconds
  useEffect(() => {
    if (passwordMessage) {
      const timer = setTimeout(() => {
        setPasswordMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  // Generate years for select dropdown (from 1925 to current year)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1925; year--) {
      years.push(year);
    }
    return years;
  };

  // Generate days for select dropdown
  const generateDays = () => {
    const days = [];
    for (let day = 1; day <= 31; day++) {
      days.push(day);
    }
    return days;
  };

  // Handle user info form change
  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password form change
  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit user info form
  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUserMessage(null);

    try {
      // Create birth_date from form data
      let birth_date = null;
      if (userForm.birth_year && userForm.birth_month && userForm.birth_day) {
        birth_date = `${userForm.birth_year}-${userForm.birth_month.padStart(2, '0')}-${userForm.birth_day.padStart(2, '0')}`;
      }

      const response = await fetch(`http://localhost:5000/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          full_name: userForm.full_name,
          phone: userForm.phone,
          address: userForm.address,
          gender: userForm.gender,
          birth_date: birth_date
        })
      });

      const data = await response.json();

      if (response.ok) {
        setUserMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
        
        // Dispatch custom event to trigger Profile page refetch
        window.dispatchEvent(new Event('profileUpdated'));
        console.log('✅ Profile updated - event dispatched');
        
        // Wait a bit then navigate back
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        setUserMessage({ type: 'error', text: data.message || 'Cập nhật thông tin thất bại!' });
      }
    } catch (error) {
      setUserMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin!' });
    } finally {
      setLoading(false);
    }
  };

  // Submit password form
  const handlePasswordFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordMessage(null);

    // Validate password match
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setPasswordMessage({ type: 'error', text: data.message || 'Đổi mật khẩu thất bại!' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'Có lỗi xảy ra khi đổi mật khẩu!' });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container page_customer_account">
      <section className="page-login mr-20">
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="row">
            <div className="col-lg-1"></div>
            <div className="col-lg-10 form-signup">
              <div className="text-centers" style={{ marginBottom: '30px' }}>
                <h1 className="title-head margin-top-0" style={{ fontSize: '28px', marginBottom: '20px' }}>Trang thông tin tài khoản</h1>
                <Link to="/profile" className="btn btn-blues" style={{ padding: '10px 24px', fontSize: '15px' }}>
                  <i className="fa fa-reply" aria-hidden="true"></i> Quay lại
                </Link>
              </div>



              {/* User Info Form */}
              <form onSubmit={handleUserFormSubmit} className="form form--general">
                <div className="panel panel-primary" id="update_thong_tin">
                  <div className="panel-heading">
                    <h4>Thông tin tài khoản</h4>
                  </div>
                  <div className="panel-body">
                    {/* Email (Disabled) */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label>Email <span className="error">*</span></label>
                        <input 
                          type="email" 
                          className="form-control form-control-lg" 
                          value={userForm.email} 
                          disabled 
                        />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label>Họ tên <span className="error">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="full_name"
                          value={userForm.full_name}
                          onChange={handleUserFormChange}
                          placeholder="Nhập tên của bạn (*)" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label>Số điện thoại <span className="error">*</span></label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          name="phone"
                          value={userForm.phone}
                          onChange={handleUserFormChange}
                          placeholder="Nhập số điện thoại của bạn (*)" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label>Địa chỉ</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="address"
                          value={userForm.address}
                          onChange={handleUserFormChange}
                          placeholder="Nhập địa chỉ của bạn" 
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label><strong>Giới tính:</strong></label>
                        <select 
                          className="form-control" 
                          name="gender"
                          value={userForm.gender}
                          onChange={handleUserFormChange}
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                        </select>
                      </div>
                    </div>

                    {/* Birth Date */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label><strong>Ngày sinh:</strong></label>
                        <div className="birth-date-wrapper">
                          <select 
                            className="birth-select" 
                            name="birth_month"
                            value={userForm.birth_month}
                            onChange={handleUserFormChange}
                          >
                            <option value="">Chọn tháng</option>
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                            ))}
                          </select>
                          <select 
                            className="birth-select" 
                            name="birth_day"
                            value={userForm.birth_day}
                            onChange={handleUserFormChange}
                          >
                            <option value="">Chọn ngày</option>
                            {generateDays().map(day => (
                              <option key={day} value={day}>{day.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                          <select 
                            className="birth-select" 
                            name="birth_year"
                            value={userForm.birth_year}
                            onChange={handleUserFormChange}
                          >
                            <option value="">Chọn năm</option>
                            {generateYears().map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="panel-footer">
                    <div className="form-group-lg">
                      <div className="wrap-submit" style={{ textAlign: 'center' }}>
                        <input 
                          className="btn btn-style" 
                          type="submit" 
                          value={loading ? "Đang cập nhật..." : "Cập nhật thông tin"}
                          disabled={loading}
                          style={{ 
                            padding: '14px 50px', 
                            fontSize: '16px', 
                            fontWeight: '600',
                            minWidth: '250px',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      {/* User Message Display */}
                      {userMessage && (
                        <div className={`alert ${userMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{marginTop: '20px', fontSize: '15px', padding: '15px'}}>
                          {userMessage.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* Password Form */}
              <form onSubmit={handlePasswordFormSubmit} className="form form--general">
                <div className="panel panel-primary" id="update_mat_khau">
                  <div className="panel-heading">
                    <h4>Đổi mật khẩu</h4>
                  </div>
                  <div className="panel-body">
                    {/* Current Password */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label><strong>Mật khẩu hiện tại:</strong> <span className="error">*</span></label>
                        <input 
                          type="password" 
                          name="current_password" 
                          className="form-control" 
                          value={passwordForm.current_password}
                          onChange={handlePasswordFormChange}
                          placeholder="Nhập mật khẩu hiện tại" 
                          required 
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label><strong>Mật khẩu mới:</strong> <span className="error">*</span></label>
                        <input 
                          type="password" 
                          name="new_password" 
                          className="form-control" 
                          value={passwordForm.new_password}
                          onChange={handlePasswordFormChange}
                          placeholder="Nhập mật khẩu mới" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group form-group-lg box_text">
                      <div className="form-group">
                        <label><strong>Nhập lại mật khẩu mới:</strong> <span className="error">*</span></label>
                        <input 
                          type="password" 
                          name="confirm_password" 
                          className="form-control" 
                          value={passwordForm.confirm_password}
                          onChange={handlePasswordFormChange}
                          placeholder="Nhập lại mật khẩu mới" 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="panel-footer">
                    <div className="form-group-lg">
                      <div className="wrap-submit" style={{ textAlign: 'center' }}>
                        <input 
                          className="btn btn-style" 
                          type="submit" 
                          value={loading ? "Đang đổi..." : "Đổi mật khẩu"}
                          disabled={loading}
                          style={{ 
                            padding: '14px 50px', 
                            fontSize: '16px', 
                            fontWeight: '600',
                            minWidth: '250px',
                            borderRadius: '6px'
                          }}
                        />
                      </div>
                      {/* Password Message Display */}
                      {passwordMessage && (
                        <div className={`alert ${passwordMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`} style={{marginTop: '20px', fontSize: '15px', padding: '15px'}}>
                          {passwordMessage.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="col-lg-1"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EditProfile;