import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Cart.css';

interface CartItem {
  id: number;
  product_id: number;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
}

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Load giỏ hàng từ API khi component mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      setCartItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.getCart();
      
      console.log('📦 GET CART RESPONSE:', response.data); // FULL DEBUG
      
      if (response.data.success) {
        // Placeholder image
        const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
        
        const rawItems = response.data.data?.items || [];
        console.log('📦 RAW ITEMS from API:', rawItems);
        console.log('📦 Items count:', rawItems.length);
        
        // Map dữ liệu từ API sang format của component
        const items = rawItems.map((item: any) => {
          console.log('🔍 Mapping cart item:', item); // Debug log
          
          const mapped = {
            id: item.cart_id || item.id,  // ✅ FIX: cart_id thay vì id
            product_id: item.product_id,
            name: item.product_name || item.name || 'Sản phẩm',
            variant: item.variant || item.selected_attributes,
            price: parseFloat(item.unit_price || item.current_final_price || item.price || 0),  // ✅ FIX: unit_price
            quantity: item.quantity || 1,
            image: item.product_image || item.image_url || item.image || placeholderImage,  // ✅ Use placeholder
            slug: item.product_slug || item.slug || '#'  // ✅ FIX: product_slug
          };
          
          console.log('✅ Mapped item:', mapped);
          return mapped;
        });
        
        console.log('✅ Final mapped items:', items); // Debug log
        console.log('✅ Setting cart items count:', items.length);
        setCartItems(items);
      } else {
        console.error('❌ API returned success: false');
        setCartItems([]);
      }
    } catch (err: any) {
      console.error('❌ Load cart error:', err);
      console.error('❌ Error response:', err.response?.data);
      setError('Không thể tải giỏ hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + ' ₫';
  };

  const updateQuantity = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const response = await api.updateCartItem(id, newQuantity);
      
      if (response.data.success) {
        setCartItems(items => 
          items.map(item => 
            item.id === id ? { ...item, quantity: newQuantity } : item
          )
        );
        
        // Re-apply coupon to recalculate discount
        if (appliedCoupon) {
          await reapplyCoupon();
        }
      }
    } catch (err: any) {
      console.error('Update quantity error:', err);
      alert('Không thể cập nhật số lượng. Vui lòng thử lại.');
    }
  };

  const removeItem = async (id: number) => {
    try {
      const response = await api.removeFromCart(id);
      
      if (response.data.success) {
        setCartItems(items => items.filter(item => item.id !== id));
        
        // Re-apply coupon to recalculate discount
        if (appliedCoupon) {
          await reapplyCoupon();
        }
      }
    } catch (err: any) {
      console.error('Remove item error:', err);
      alert('Không thể xóa sản phẩm. Vui lòng thử lại.');
    }
  };

  // Apply coupon code
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const response = await api.applyCouponToCart(couponCode.toUpperCase());
      
      console.log('✅ Coupon response:', response.data);
      
      if (response.data.success) {
        const couponData = response.data.data.coupon || response.data.data;
        setAppliedCoupon(couponData);
        
        const discountAmount = couponData.discount_amount || 0;
        alert(`✅ Đã áp dụng mã giảm giá ${couponCode}!\nGiảm: ${formatPrice(discountAmount)}`);
      } else {
        setCouponError(response.data.message || 'Mã giảm giá không hợp lệ');
      }
    } catch (err: any) {
      console.error('Apply coupon error:', err);
      setCouponError(err.response?.data?.message || 'Không thể áp dụng mã giảm giá');
    } finally {
      setCouponLoading(false);
    }
  };

  // Re-apply coupon after cart changes
  const reapplyCoupon = async () => {
    if (!appliedCoupon || !appliedCoupon.code) return;
    
    try {
      const response = await api.applyCouponToCart(appliedCoupon.code);
      
      if (response.data.success) {
        const couponData = response.data.data.coupon || response.data.data;
        setAppliedCoupon(couponData);
        console.log('🔄 Coupon recalculated:', couponData);
      } else {
        // Coupon no longer valid (e.g., cart total below minimum)
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('Mã giảm giá không còn hợp lệ với giỏ hàng hiện tại');
      }
    } catch (err: any) {
      console.error('Reapply coupon error:', err);
      // Remove invalid coupon silently
      setAppliedCoupon(null);
      setCouponCode('');
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discount_amount || 0;
  };

  const getFinalPrice = () => {
    const total = getTotalPrice();
    const discount = getDiscountAmount();
    return Math.max(0, total - discount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="cart-page">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 20px' }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="cart-page">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div style={{ fontSize: '50px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ fontSize: '18px', color: '#e74c3c', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={loadCart} 
            className="btn btn-primary"
            style={{ padding: '10px 30px', fontSize: '16px' }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Debug log
  console.log('Cart render - items count:', cartItems.length);
  console.log('Cart render - items:', cartItems);

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <section className="bread-crumb">
          <div className="container">
            <ul className="breadcrumb">
              <li className="home">
                <Link to="/" title="Trang chủ">
                  <span>Trang chủ</span>
                </Link>
                <span className="mr_lr">&nbsp;›&nbsp;</span>
              </li>
              <li><strong><span>Giỏ hàng</span></strong></li>
            </ul>
          </div>
        </section>

        <div className="container" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>🛒</div>
          <h2 style={{ fontSize: '28px', marginBottom: '15px', color: '#333' }}>
            Giỏ hàng của bạn đang trống
          </h2>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
            Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm!
          </p>
          <Link 
            to="/products" 
            className="btn btn-primary"
            style={{ padding: '12px 40px', fontSize: '16px', textDecoration: 'none', display: 'inline-block' }}
          >
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <section className="bread-crumb" style={{ background: '#f5f5f5', marginBottom: '20px' }}>
        <div className="container">
          <ul className="breadcrumb" itemScope itemType="http://schema.org/BreadcrumbList" style={{ 
            display: 'flex', 
            listStyle: 'none', 
            padding: '15px 0', 
            margin: 0,
            alignItems: 'center',
            fontSize: '14px'
          }}>
            <li className="home" itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">
              <Link to="/" title="Trang chủ" itemProp="item" style={{ color: '#333', textDecoration: 'none' }}>
                <span itemProp="name">Trang chủ</span>
              </Link>
              <meta itemProp="position" content="1" />
              <span className="mr_lr" style={{ margin: '0 8px', color: '#999' }}>
                <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" style={{ width: '10px', height: '10px', fill: 'currentColor' }}>
                  <path d="M285.476 272.971L91.132 467.314c-9.373 9.373-24.569 9.373-33.941 0l-22.667-22.667c-9.357-9.357-9.375-24.522-.04-33.901L188.505 256 34.484 101.255c-9.335-9.379-9.317-24.544.04-33.901l22.667-22.667c9.373-9.373 24.569-9.373 33.941 0L285.475 239.03c9.373 9.372 9.373 24.568.001 33.941z"></path>
                </svg>
              </span>
            </li>
            <li itemProp="itemListElement" itemScope itemType="http://schema.org/ListItem">
              <strong itemProp="name" style={{ color: '#E95211' }}>Giỏ hàng</strong>
              <meta itemProp="position" content="2" />
            </li>
          </ul>
        </div>
      </section>

      {/* Main Cart Section */}
      <section className="main-cart-page main-container col1-layout">
        <div className="main container cartpcstyle">
          <div className="wrap_background_aside margin-bottom-40">
            <div className="header-cart">
              <div className="title-block-page">
                <h1 className="title_cart">
                  <span>Giỏ hàng của bạn</span>
                </h1>
              </div>
            </div>
            
            <div className="row">
              <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 col-12">
                <div className="clearfix"></div>

                {/* Desktop Cart */}
                <div className="cart-page d-xl-block d-none">
                  <div className="drawer__inner">
                    <div className="CartPageContainer">
                      <form action="" method="post" noValidate className="cart ajaxcart cartheader">
                        <div className="ajaxcart__inner ajaxcart__inner--has-fixed-footer cart_body items">
                          {cartItems.map((item) => {
                            console.log('Rendering cart item:', item); // Debug render
                            return (
                            <div key={item.id} className="ajaxcart__row">
                              <div className="ajaxcart__product cart_product" data-line={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
                                <Link 
                                  to={`/${item.slug}.html`} 
                                  className="ajaxcart__product-image cart_image" 
                                  title={item.name}
                                  style={{ flexShrink: 0 }}
                                >
                                  <img 
                                    width="80" 
                                    height="80" 
                                    src={item.image} 
                                    alt={item.name}
                                    onError={(e) => {
                                      // Use inline SVG placeholder on error
                                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                                    }}
                                  />
                                </Link>
                                <div className="grid__item cart_info" style={{ flex: 1, minWidth: 0 }}>
                                  <div className="ajaxcart__product-name-wrapper cart_name">
                                    <Link 
                                      to={`/${item.slug}.html`} 
                                      className="ajaxcart__product-name h4" 
                                      title={item.name}
                                    >
                                      {item.name}
                                    </Link>
                                    {item.variant && (
                                      <span className="ajaxcart__product-meta variant-title">
                                        {item.variant}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div style={{ marginTop: '8px' }}>
                                    <span className="cart-price" style={{ fontSize: '16px', fontWeight: 'bold', color: '#E95211' }}>
                                      {formatPrice(item.price * item.quantity)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Quantity Controls */}
                                <div className="ajaxcart__qty input-group-btn" style={{ flexShrink: 0 }}>
                                  <button 
                                    type="button" 
                                    className="ajaxcart__qty-adjust ajaxcart__qty--minus items-count" 
                                    data-id={item.product_id}
                                    data-qty={item.quantity - 1}
                                    data-line={item.id}
                                    aria-label="-"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
                                    }}
                                  >
                                    -
                                  </button>
                                  <input 
                                    type="text" 
                                    name="updates[]"
                                    className="ajaxcart__qty-num number-sidebar" 
                                    maxLength={3}
                                    value={item.quantity} 
                                    min="0"
                                    data-id={item.product_id}
                                    data-line={item.id}
                                    aria-label="quantity"
                                    pattern="[0-9]*"
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      if (val > 0) updateQuantity(item.id, val);
                                    }}
                                  />
                                  <button 
                                    type="button" 
                                    className="ajaxcart__qty-adjust ajaxcart__qty--plus items-count" 
                                    data-id={item.product_id}
                                    data-line={item.id}
                                    data-qty={item.quantity + 1}
                                    aria-label="+"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      updateQuantity(item.id, item.quantity + 1);
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                                
                                {/* Delete Button */}
                                <button 
                                  title="Xóa sản phẩm" 
                                  className="btn btn-sm"
                                  style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 8px',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    transition: 'background-color 0.2s',
                                    height: 'fit-content',
                                    whiteSpace: 'nowrap',
                                    minWidth: 'auto',
                                    maxWidth: '60px',
                                    flexShrink: 0
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (window.confirm(`Bạn có chắc muốn xóa "${item.name}" khỏi giỏ hàng?`)) {
                                      removeItem(item.id);
                                    }
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                  </svg>
                                  Xóa
                                </button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                        <div className="ajaxcart__footer ajaxcart__footer--fixed cart-footer">
                          {/* Coupon Section */}
                          <div className="cart__coupon" style={{ marginBottom: '15px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>🎫 Mã giảm giá</h4>
                            {!appliedCoupon ? (
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                  type="text"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                  placeholder="Nhập mã giảm giá"
                                  style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                  }}
                                  onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                                />
                                <button
                                  onClick={applyCoupon}
                                  disabled={couponLoading}
                                  style={{
                                    padding: '10px 20px',
                                    background: '#E95211',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: couponLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    minWidth: '80px'
                                  }}
                                >
                                  {couponLoading ? '...' : 'Áp dụng'}
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
                                <div>
                                  <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                    ✅ {appliedCoupon.coupon_code}
                                  </span>
                                  <span style={{ marginLeft: '10px', fontSize: '13px', color: '#666' }}>
                                    -{formatPrice(appliedCoupon.discount_amount)}
                                  </span>
                                </div>
                                <button
                                  onClick={removeCoupon}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#d32f2f',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '0 5px'
                                  }}
                                  title="Xóa mã giảm giá"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            {couponError && (
                              <div style={{ marginTop: '8px', color: '#d32f2f', fontSize: '13px' }}>
                                ⚠️ {couponError}
                              </div>
                            )}
                          </div>

                          {/* Subtotal Section */}
                          <div className="ajaxcart__subtotal">
                            <div className="cart__subtotal">
                              <div className="cart__col-6">Tạm tính:</div>
                              <div className="text-right cart__totle">
                                <span className="total-price">{formatPrice(getTotalPrice())}</span>
                              </div>
                            </div>
                            {appliedCoupon && (
                              <div className="cart__subtotal" style={{ color: '#2e7d32' }}>
                                <div className="cart__col-6">Giảm giá:</div>
                                <div className="text-right cart__totle">
                                  <span className="total-price">-{formatPrice(getDiscountAmount())}</span>
                                </div>
                              </div>
                            )}
                            <div className="cart__subtotal" style={{ borderTop: '2px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                              <div className="cart__col-6" style={{ fontSize: '16px', fontWeight: 'bold' }}>Tổng cộng:</div>
                              <div className="text-right cart__totle">
                                <span className="total-price" style={{ fontSize: '18px', fontWeight: 'bold', color: '#E95211' }}>
                                  {formatPrice(getFinalPrice())}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="cart__btn-proceed-checkout-dt">
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = '/checkout';
                              }}
                              type="button" 
                              className="button btn btn-default cart__btn-proceed-checkout" 
                              id="btn-proceed-checkout"
                              title="Thanh toán"
                            >
                              Đặt hàng
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Mobile Cart */}
                <div className="cart-mobile-page d-block d-xl-none">
                  <div className="CartMobileContainer" style={{ paddingTop: '20px' }}>
                    {/* Mobile cart content - simplified */}
                    {cartItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <p>Giỏ hàng trống</p>
                        <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
                      </div>
                    ) : (
                      <div className="cart ajaxcart">
                        {cartItems.map((item) => (
                          <div key={item.id} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                              <img src={item.image || '/img/placeholder.jpg'} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                              <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '14px', marginBottom: '5px', fontWeight: '600' }}>{item.name}</h4>
                                {item.variant && <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{item.variant}</p>}
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#E95211', marginBottom: '10px' }}>
                                  {formatPrice(item.price * item.quantity)}
                                </div>
                                
                                {/* Mobile Quantity & Delete Row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  {/* Quantity Controls */}
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                      onClick={() => item.quantity > 1 && updateQuantity(item.id, item.quantity - 1)} 
                                      style={{ 
                                        width: '32px', 
                                        height: '32px',
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      -
                                    </button>
                                    <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: '600' }}>{item.quantity}</span>
                                    <button 
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                                      style={{ 
                                        width: '32px', 
                                        height: '32px',
                                        backgroundColor: '#f5f5f5',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                  
                                  {/* Delete Button */}
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Xóa "${item.name}"?`)) {
                                        removeItem(item.id);
                                      }
                                    }}
                                    style={{
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '6px 12px',
                                      cursor: 'pointer',
                                      fontSize: '13px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px'
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Xóa
                                  </button>
                                </div>
                              </div>
                              <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Mobile Coupon Section */}
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
                          <h4 style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>🎫 Mã giảm giá</h4>
                          {!appliedCoupon ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                placeholder="Nhập mã"
                                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                              />
                              <button
                                onClick={applyCoupon}
                                disabled={couponLoading}
                                style={{ padding: '10px 15px', background: '#E95211', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}
                              >
                                {couponLoading ? '...' : 'OK'}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
                              <span style={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '13px' }}>
                                ✅ {appliedCoupon.coupon_code} (-{formatPrice(appliedCoupon.discount_amount)})
                              </span>
                              <button onClick={removeCoupon} style={{ background: 'none', border: 'none', color: '#d32f2f', fontSize: '18px' }}>×</button>
                            </div>
                          )}
                          {couponError && <div style={{ marginTop: '5px', color: '#d32f2f', fontSize: '12px' }}>⚠️ {couponError}</div>}
                        </div>

                        {/* Mobile Summary */}
                        <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                            <span>Tạm tính:</span>
                            <span>{formatPrice(getTotalPrice())}</span>
                          </div>
                          {appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#2e7d32' }}>
                              <span>Giảm giá:</span>
                              <span>-{formatPrice(getDiscountAmount())}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingTop: '10px', borderTop: '2px solid #ddd' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Tổng cộng:</span>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#E95211' }}>{formatPrice(getFinalPrice())}</span>
                          </div>
                          <button 
                            onClick={() => window.location.href = '/gio-hang/thanh-toan'} 
                            style={{ width: '100%', padding: '12px', background: '#E95211', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold' }}
                          >
                            ĐẶT HÀNG
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Cart;