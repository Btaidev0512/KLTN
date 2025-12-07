import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import '../styles/Profile.css';

interface Order {
  order_id: number;
  order_number: string; // ✅ Backend field
  created_at: string; // ✅ Backend field (was order_date)
  shipping_address_line_1: string; // ✅ Backend field (was shipping_address)
  shipping_city?: string;
  shipping_state?: string;
  total_amount: number;
  status: string;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    price: number;
  }>;
}

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]); // ✅ Always initialize as empty array
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(user);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchUserInfo = async () => {
      try {
        // ✅ Use API service to fetch user profile
        const response = await api.getProfile();
        
        if (response.data.success) {
          console.log('✅ Fetched user info:', response.data);
          // Response structure: { success: true, data: { user: {...} } }
          setUserInfo(response.data.data?.user || response.data.user || response.data.data || response.data);
        } else {
          console.error('❌ Failed to fetch user info');
        }
      } catch (error: any) {
        console.error('❌ Error fetching user info:', error);
        
        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('🔓 Session expired, redirecting to login...');
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    const fetchOrders = async () => {
      try {
        // ✅ Use API service to fetch active orders (exclude completed/delivered)
        const response = await api.getActiveOrders();
        
        if (response.data.success) {
          console.log('✅ Fetched active orders:', response.data);
          
          // ✅ Ensure orders is always an array
          let ordersData = [];
          if (response.data.data?.orders && Array.isArray(response.data.data.orders)) {
            ordersData = response.data.data.orders;
          } else if (response.data.orders && Array.isArray(response.data.orders)) {
            ordersData = response.data.orders;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            ordersData = response.data.data;
          } else if (Array.isArray(response.data)) {
            ordersData = response.data;
          }
          
          setOrders(ordersData);
        } else {
          console.error('❌ Failed to fetch orders:', response.status);
          setOrders([]);
        }
      } catch (error: any) {
        console.error('❌ Error fetching orders:', error);
        
        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('🔓 Session expired, redirecting to login...');
          localStorage.removeItem('token');
          navigate('/login');
        }
        
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    // Fetch data from API
    if (user?.user_id) {
      fetchUserInfo();
      fetchOrders();
    }

    // Refetch data when user comes back to this page
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.user_id) {
        console.log('🔄 Page visible - refetching user info...');
        fetchUserInfo();
        fetchOrders();
      }
    };

    const handleFocus = () => {
      if (user?.user_id) {
        console.log('🔄 Window focused - refetching user info...');
        fetchUserInfo();
        fetchOrders();
      }
    };

    // Listen for custom profileUpdated event
    const handleProfileUpdate = () => {
      console.log('🔄 Profile updated event - refetching user info...');
      if (user?.user_id) {
        fetchUserInfo();
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [isAuthenticated, navigate, user?.user_id]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'confirmed': 'Đã xác nhận',
      'shipping': 'Đang giao hàng',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusClass = (status: string) => {
    const statusClassMap = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'shipping': 'status-shipping',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    return statusClassMap[status as keyof typeof statusClassMap] || '';
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container page_customer_account">
      <section className="signup account-page mr-bottom-20">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-sm-12 col-md-12">
              <div className="row">
                {/* Header */}
                <div className="col-xs-12 col-sm-12 col-lg-12">
                  <div className="page-title">
                    <h1 className="title-head widget-title">Thông tin tài khoản</h1>
                  </div>
                </div>

                {/* Sidebar - Thông tin khách hàng (Left column) */}
                <div className="col-xs-12 col-sm-12 col-md-3 col-lg-3">
                  <div className="block block-account margin-bottom-20">
                    <div className="block-title">
                      <h2 className="widget-title">Thông tin khách hàng</h2>
                    </div>
                    <div className="divider-full-1"></div>
                    <div className="block-content form-signup block-edit-padding">
                      <p>
                        <svg width="15" height="15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 245.86 244.44" fill="#E95221">
                          <path d="M249.31,163.93H225.14a16.46,16.46,0,0,0-13.49,7l-16.9,24.18a16.46,16.46,0,0,1-27.12-.18l-16.17-23.82a16.48,16.48,0,0,0-13.62-7.22H114.11a55.34,55.34,0,0,0-55.33,55.34v24.55A8.23,8.23,0,0,0,67,252.06h229.4a8.24,8.24,0,0,0,8.23-8.24V219.27A55.34,55.34,0,0,0,249.31,163.93Zm-67.57-20.58a67.87,67.87,0,1,0-67.86-67.87A67.86,67.86,0,0,0,181.74,143.35Z" transform="translate(-58.78 -7.61)"></path>
                        </svg>
                        <b>Họ tên: </b> {userInfo?.full_name || userInfo?.username || 'Chưa cập nhật'}
                      </p>
                      
                      <p>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14.7083 11.9274L13.0454 10.8187L11.5672 9.83339C11.2819 9.64357 10.8985 9.7058 10.6878 9.97615L9.77312 11.1521C9.57663 11.4073 9.22316 11.4806 8.94139 11.3246C8.32071 10.9793 7.58674 10.6542 5.96729 9.03271C4.34783 7.41118 4.02068 6.67929 3.67542 6.05861C3.51941 5.77684 3.59274 5.42338 3.84791 5.22691L5.02385 4.31219C5.29417 4.1016 5.35643 3.7182 5.16661 3.43288L4.21154 2.00013L3.07258 0.291677C2.87873 0.000879503 2.49066 -0.0864242 2.19096 0.0933101L0.877418 0.881329C0.522432 1.09048 0.261487 1.42821 0.148637 1.8245C-0.210569 3.13415 -0.28299 6.02317 4.34704 10.6532C8.97707 15.2832 11.8658 15.2106 13.1755 14.8513C13.5718 14.7385 13.9095 14.4776 14.1186 14.1225L14.9067 12.809C15.0864 12.5093 14.9991 12.1213 14.7083 11.9274Z" fill="#E95221"></path>
                          <path d="M8.53399 2.32747C10.961 2.33017 12.9278 4.29697 12.9305 6.72399C12.9305 6.86681 13.0463 6.98262 13.1891 6.98262C13.3319 6.98262 13.4478 6.86684 13.4478 6.72399C13.4448 4.01144 11.2466 1.81323 8.53402 1.81024C8.3912 1.81024 8.27539 1.92602 8.27539 2.06887C8.27536 2.21166 8.39114 2.32747 8.53399 2.32747Z" fill="#E95221"></path>
                          <path d="M8.53402 3.87932C10.1044 3.88117 11.377 5.15375 11.3788 6.72411C11.3788 6.86693 11.4946 6.98274 11.6374 6.98274C11.7803 6.98274 11.8961 6.86696 11.8961 6.72411C11.8939 4.8682 10.39 3.3642 8.53402 3.36206C8.3912 3.36206 8.27539 3.47784 8.27539 3.62069C8.27539 3.76354 8.39117 3.87932 8.53402 3.87932Z" fill="#E95221"></path>
                          <path d="M8.53399 5.43087C9.2478 5.43172 9.82623 6.01015 9.82708 6.72396C9.82708 6.86678 9.94286 6.98259 10.0857 6.98259C10.2285 6.98259 10.3443 6.86681 10.3443 6.72396C10.3432 5.72462 9.53336 4.91478 8.53402 4.91364C8.3912 4.91364 8.27539 5.02941 8.27539 5.17227C8.27536 5.31509 8.39114 5.43087 8.53399 5.43087Z" fill="#E95221"></path>
                        </svg>
                        <b>Số ĐT: </b>{userInfo?.phone || 'Chưa cập nhật'}
                      </p>
                      
                      <p>
                        <svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M6.00033 0.5C2.77533 0.5 0.166992 3.10833 0.166992 6.33333C0.166992 10.7083 6.00033 15.5 6.00033 15.5C6.00033 15.5 11.8337 10.7083 11.8337 6.33333C11.8337 3.10833 9.22533 0.5 6.00033 0.5ZM6.00033 8.83333C7.38104 8.83333 8.50033 7.71405 8.50033 6.33333C8.50033 4.95262 7.38104 3.83333 6.00033 3.83333C4.61961 3.83333 3.50033 4.95262 3.50033 6.33333C3.50033 7.71405 4.61961 8.83333 6.00033 8.83333Z" fill="#E95221"></path>
                        </svg>
                        <b>Địa chỉ: </b>{userInfo?.address || 'Chưa cập nhật'}
                      </p>

                      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Link 
                          to="/profile/edit"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: 'auto',
                            minWidth: '200px',
                            padding: '12px 30px',
                            backgroundColor: '#E95211',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '15px',
                            fontWeight: '500',
                            textDecoration: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(233, 82, 17, 0.2)',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => {
                            const target = e.currentTarget as HTMLAnchorElement;
                            target.style.backgroundColor = '#d14410';
                            target.style.transform = 'translateY(-1px)';
                            target.style.boxShadow = '0 4px 8px rgba(233, 82, 17, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.currentTarget as HTMLAnchorElement;
                            target.style.backgroundColor = '#E95211';
                            target.style.transform = 'translateY(0)';
                            target.style.boxShadow = '0 2px 4px rgba(233, 82, 17, 0.2)';
                          }}
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            style={{ flexShrink: 0 }}
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          <span>Sửa thông tin</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content - Đơn hàng (Right column) */}
                <div className="col-xs-12 col-sm-12 col-md-9 col-lg-9 col-right-ac">
                  <h1 className="title-head margin-top-0">Đơn hàng đang xử lý</h1>
                  <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                    <i className="fa fa-info-circle"></i> Hiển thị các đơn hàng đang chờ xử lý, xác nhận và giao hàng. 
                    <Link to="/orders" style={{ color: '#E95211', marginLeft: '5px' }}>Xem tất cả đơn hàng →</Link>
                  </p>
                  <div className="my-account">
                    <div className="dashboard">
                      <div className="recent-orders">
                        <div className="table-responsive-block tab-all" style={{ overflowX: 'auto' }}>
                          <table className="table table-cart table-order" id="my-orders-table">
                            <thead className="thead-default">
                              <tr>
                                <th>Đơn hàng</th>
                                <th>Ngày</th>
                                <th>Địa chỉ</th>
                                <th>Giá trị</th>
                                <th>Tình trạng</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loading ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center' }}>
                                    <p>Đang tải...</p>
                                  </td>
                                </tr>
                              ) : !Array.isArray(orders) || orders.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center' }}>
                                    <p>Không có đơn hàng đang xử lý.</p>
                                    <Link to="/orders" style={{ color: '#E95211' }}>Xem tất cả đơn hàng</Link>
                                  </td>
                                </tr>
                              ) : (
                                orders.map((order) => (
                                  <tr key={order.order_id}>
                                    <td>
                                      <Link to={`/order/${order.order_id}`} className="order-link">
                                        #{order.order_number || order.order_id}
                                      </Link>
                                    </td>
                                    <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                      {order.shipping_address_line_1}
                                      {order.shipping_city && `, ${order.shipping_city}`}
                                    </td>
                                    <td className="price">{formatPrice(order.total_amount)}</td>
                                    <td>
                                      <span className={`status-badge ${getStatusClass(order.status)}`}>
                                        {getStatusText(order.status)}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
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
};

export default Profile;