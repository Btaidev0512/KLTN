import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../UI/Logo';
import SearchBar from '../SearchBar';
import MegaMenu from './MegaMenu';
import '../../styles/Header.css';


const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
    setShowAccountDropdown(false);
  };

  // Get cart count and items from API
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const response = await api.getCart();
        if (response.data.success) {
          const items = response.data.data.items || [];
          const total = response.data.data.total_amount || 0;
          
          // Calculate total quantity
          const count = items.reduce((total: number, item: any) => total + (item.quantity || 0), 0);
          
          setCartCount(count);
          setCartItems(items.slice(0, 3)); // Only show first 3 items in dropdown
          setCartTotal(total);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartCount(0);
        setCartItems([]);
        setCartTotal(0);
      }
    };

    const updateWishlistCount = () => {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlistCount(wishlist.length);
    };

    updateCartCount();
    updateWishlistCount();

    // Listen for updates
    const handleCartUpdate = () => {
      updateCartCount();
    };

    const handleWishlistUpdate = () => {
      updateWishlistCount();
    };

    const handleAuthChange = () => {
      // Re-fetch cart and wishlist when auth state changes
      updateCartCount();
      updateWishlistCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    window.addEventListener('authChanged', handleAuthChange);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      window.removeEventListener('authChanged', handleAuthChange);
    };
  }, []);

  return (
    <header className="header-container">
      {/* Top Bar */}
      <div className="header-top-bar">
        <div className="container">
          <div className="top-bar-content">
            {/* Mobile Menu Button */}
            <div className="mobile-left-section d-lg-none">

            </div>

            {/* Logo */}
            <div className="logo-section">
              <Link to="/" className="logo-link">
                <Logo 
                  size="normal"
                  showTagline={true}
                  showShopText={true}
                />
              </Link>
            </div>
            
            {/* Hotline */}
            <div className="hotline-section">
              <div className="hotline-item">
                <i className="hotline-icon">📞</i>
                <span>Hotline:</span>
                <a href="tel:0368238582" className="hotline-number">
                  0368238582 | 0377486864
                </a>
              </div>
            </div>

            {/* Search Bar */}
            <div className="search-section">
              <SearchBar 
                placeholder="Tìm sản phẩm..."
                showSuggestions={true}
              />
            </div>

            {/* Actions: Yêu thích, Tài khoản, Giỏ hàng */}
            <div className="header-actions">
              <div className="action-item wishlist-item">
                <Link to="/wishlist" className="action-link">
                  <span className="action-icon">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#E95221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill={wishlistCount > 0 ? "#E95221" : "none"}/>
                    </svg>
                  </span>
                  {wishlistCount > 0 && <span className="wishlist-count">{wishlistCount}</span>}
                  <span className="action-text">Yêu thích</span>
                </Link>
              </div>

              <div 
                className="action-item account-dropdown"
                onMouseEnter={() => setShowAccountDropdown(true)}
                onMouseLeave={() => setShowAccountDropdown(false)}
              >
                <div className="action-link account-trigger">
                  <span className="action-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#E95221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </span>
                  <span className="action-text">Tài khoản</span>
                </div>
                
                {/* Account Dropdown */}
                {showAccountDropdown && (
                  <div className="account-dropdown-menu">
                    {isAuthenticated ? (
                      // Menu khi đã đăng nhập
                      <>
                        <div className="dropdown-user-info">
                          <span className="user-name">
                            Xin chào, <strong>{user?.full_name || user?.username}</strong>
                          </span>
                          {user?.role === 'admin' && (
                            <span className="admin-badge" style={{ 
                              display: 'inline-block', 
                              marginLeft: '8px',
                              padding: '2px 8px',
                              backgroundColor: '#ff6b35',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        {user?.role === 'admin' && (
                          <Link to="/admin" className="dropdown-link" onClick={() => setShowAccountDropdown(false)} style={{ 
                            backgroundColor: '#fff3f0',
                            color: '#ff6b35',
                            fontWeight: 600
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7"></rect>
                              <rect x="14" y="3" width="7" height="7"></rect>
                              <rect x="14" y="14" width="7" height="7"></rect>
                              <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Trang Quản Trị
                          </Link>
                        )}
                        <Link to="/profile" className="dropdown-link" onClick={() => setShowAccountDropdown(false)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          Thông tin cá nhân
                        </Link>
                        <Link to="/orders" className="dropdown-link" onClick={() => setShowAccountDropdown(false)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                          </svg>
                          Đơn hàng của tôi
                        </Link>
                        <div className="dropdown-divider"></div>
                        <button onClick={handleLogout} className="dropdown-link logout-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16,17 21,12 16,7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                          </svg>
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      // Menu khi chưa đăng nhập
                      <>
                        <Link to="/login" className="dropdown-link">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10,17 15,12 10,7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                          </svg>
                          Đăng nhập
                        </Link>
                        <Link to="/register" className="dropdown-link">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                          Đăng ký
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div 
                className="action-item cart-item"
                onMouseEnter={() => setShowCartDropdown(true)}
                onMouseLeave={() => setShowCartDropdown(false)}
              >
                <Link to="/cart" className="action-link">
                  <span className="action-icon cart-icon-wrapper">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#E95221" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                    {cartCount > 0 && (
                      <span className="cart-badge">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </span>
                  <span className="action-text">Giỏ hàng</span>
                </Link>
                
                {/* Cart Dropdown/Tooltip */}
                {showCartDropdown && (
                  <div className="cart-dropdown">
                    {cartCount === 0 ? (
                      <div className="cart-empty">
                        <div className="empty-cart-icon">
                          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ddd" strokeWidth="1.5">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        </div>
                        <p>Chưa có sản phẩm</p>
                        <span>Hãy thêm sản phẩm vào giỏ hàng</span>
                        <Link to="/products" className="btn-shop-now-mini">
                          Mua sắm ngay
                        </Link>
                      </div>
                    ) : (
                      <div className="cart-items">
                        <div className="cart-header">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E95221" strokeWidth="2">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                          <span><strong>{cartCount}</strong> sản phẩm trong giỏ</span>
                        </div>

                        {/* Cart Items Preview */}
                        {cartItems.length > 0 && (
                          <div className="cart-items-list">
                            {cartItems.map((item: any, index: number) => (
                              <div key={index} className="cart-item-preview">
                                <div className="cart-item-image">
                                  <img 
                                    src={item.product_image || '/placeholder.png'} 
                                    alt={item.product_name}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.png';
                                    }}
                                  />
                                </div>
                                <div className="cart-item-info">
                                  <h5>{item.product_name}</h5>
                                  <p className="cart-item-quantity">SL: {item.quantity}</p>
                                </div>
                                <div className="cart-item-price">
                                  {(item.unit_price * item.quantity).toLocaleString('vi-VN')}₫
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Cart Summary */}
                        <div className="cart-summary">
                          <div className="cart-total">
                            <span>Tổng cộng:</span>
                            <strong>{cartTotal.toLocaleString('vi-VN')}₫</strong>
                          </div>
                          <Link to="/cart" className="view-cart-btn">
                            Xem giỏ hàng
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12,5 19,12 12,19"></polyline>
                            </svg>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Bar */}
      <div className="header-nav-bar">
        <div className="container">
          <nav className="main-navigation">
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Trang chủ</Link>
              </li>

              {/* Mega Menu for Products */}
              <MegaMenu />

              <li className="nav-item">
                <Link to="/sale" className="nav-link sale-link">Sale off</Link>
              </li>

              <li className="nav-item">
                <Link to="/news" className="nav-link">Tin tức</Link>
              </li> 

            
              <li className="nav-item">
                <Link to="/about" className="nav-link">Giới thiệu</Link>
              </li>

              <li className="nav-item">
                <Link to="/contact" className="nav-link">Liên hệ</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Search */}
      {isSearchVisible && (
        <div className="mobile-search d-lg-none">
          <div className="mobile-search-form" style={{ padding: '10px' }}>
            <SearchBar 
              placeholder="TÌM SẢN PHẨM..."
              showSuggestions={true}
              autoFocus={true}
            />
            <button 
              type="button" 
              className="mobile-search-close"
              onClick={() => setIsSearchVisible(false)}
              style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;