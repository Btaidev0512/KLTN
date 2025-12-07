import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/Checkout.css';

interface CartItem {
  cart_id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  quantity: number;
  unit_price: number;
  current_final_price: number;
  product_image: string;
  brand_name: string;
}

interface CheckoutForm {
  ho_ten: string;
  so_dt: string;
  dia_chi: string;
  email: string;
  ghi_chu: string;
  thanh_toan: '1' | '2'; // 1: COD, 2: Bank transfer
  payment_sub_method?: 'momo' | 'bank_transfer' | 'vnpay'; // Sub-method for bank transfer
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  
  const [formData, setFormData] = useState<CheckoutForm>({
    ho_ten: '',
    so_dt: '',
    dia_chi: '',
    email: '',
    ghi_chu: '',
    thanh_toan: '1',
    payment_sub_method: 'momo'
  });

  const [errors, setErrors] = useState<Partial<CheckoutForm>>({});

  useEffect(() => {
    fetchCartItems();
    loadUserInfo();
  }, []);

  useEffect(() => {
    console.log('💵 Discount state changed:', discount);
  }, [discount]);

  const fetchCartItems = async () => {
    try {
      const response = await api.getCart();
      console.log('🛒 Cart API response:', response.data);
      
      if (response.data.success) {
        // API returns: { success: true, data: { items: [...], summary: {...} } }
        const items = response.data.data?.items || response.data.items || [];
        console.log('📦 Cart items:', items);
        
        // Ensure items is an array
        if (Array.isArray(items)) {
          setCartItems(items);
        } else {
          console.error('Cart items is not an array:', items);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = () => {
    // Load user info from localStorage or API
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
      setFormData(prev => ({
        ...prev,
        ho_ten: user.full_name || '',
        so_dt: user.phone || '',
        // ✅ KHÔNG tự động điền email - để user tự nhập
        // email: user.email || '',
        dia_chi: user.address || ''
      }));
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  };

  const calculateFinalTotal = () => {
    return calculateTotal() - discount;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof CheckoutForm]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.parentElement?.classList.add('js-is-filled');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!e.target.value) {
      e.target.parentElement?.classList.remove('js-is-filled');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CheckoutForm> = {};

    if (!formData.ho_ten.trim()) {
      newErrors.ho_ten = 'Vui lòng nhập họ tên';
    }

    if (!formData.so_dt.trim()) {
      newErrors.so_dt = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9+\-().]{8,20}$/.test(formData.so_dt)) {
      newErrors.so_dt = 'Số điện thoại không hợp lệ';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.dia_chi.trim()) {
      newErrors.dia_chi = 'Vui lòng nhập địa chỉ giao hàng';
    } else if (formData.dia_chi.trim().length < 10) {
      newErrors.dia_chi = 'Địa chỉ phải có ít nhất 10 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    setSubmitting(true);

    try {
      // Determine payment method
      const paymentMethod = formData.thanh_toan === '1' ? 'cod' : formData.payment_sub_method || 'bank_transfer';
      
      // Map form data to match backend validation requirements
      const orderData: any = {
        customer_name: formData.ho_ten,
        customer_phone: formData.so_dt,
        customer_email: formData.email,
        shipping_name: formData.ho_ten,
        shipping_phone: formData.so_dt,
        shipping_address: formData.dia_chi || 'Chưa cung cấp địa chỉ',
        shipping_city: 'TP.HCM', // Default city
        payment_method: paymentMethod,
        notes: formData.ghi_chu,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      // Add coupon if applied
      if (appliedCoupon) {
        orderData.coupon_code = appliedCoupon.coupon_code;
        orderData.discount_amount = discount;
      }

      console.log('📦 Sending order data:', orderData);
      console.log('💳 Payment method:', paymentMethod);

      // Create order first
      const response = await api.createOrder(orderData);

      if (response.data.success) {
        const orderId = response.data.data?.order_id || response.data.orderId;
        const orderAmount = calculateFinalTotal();

        console.log('✅ Order created:', orderId);

        // Handle different payment methods
        switch (paymentMethod) {
          case 'cod':
            // COD - Direct success
            alert('Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.');
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated')); // Notify header to update
            navigate('/order-success', { state: { orderId } });
            break;

          case 'bank_transfer':
            // Bank Transfer - Show instructions
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated')); // Notify header to update
            navigate('/bank-transfer', { 
              state: { 
                orderInfo: {
                  order_id: orderId,
                  total_amount: calculateTotal(),
                  final_amount: orderAmount,
                  customer_name: formData.ho_ten,
                  customer_phone: formData.so_dt
                }
              } 
            });
            break;

          case 'vnpay':
            // VNPay - Redirect to payment gateway
            console.log('🔄 Creating VNPay payment...');
            try {
              const vnpayResponse = await api.createVNPayPayment({
                order_id: orderId,
                amount: orderAmount,
                order_info: `Thanh toan don hang ${orderId}`,
                bank_code: ''
              });

              if (vnpayResponse.data.success && vnpayResponse.data.data?.payment_url) {
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cartUpdated')); // Notify header to update
                // Redirect to VNPay
                window.location.href = vnpayResponse.data.data.payment_url;
              } else {
                throw new Error('Không thể tạo link thanh toán VNPay');
              }
            } catch (vnpayError: any) {
              console.error('❌ VNPay error:', vnpayError);
              alert('Lỗi khi tạo thanh toán VNPay: ' + (vnpayError.response?.data?.message || vnpayError.message));
              setSubmitting(false);
            }
            break;

          case 'momo':
            // MoMo - Create payment
            console.log('🔄 Creating MoMo payment...');
            try {
              const momoResponse = await api.createMoMoPayment({
                order_id: orderId,
                amount: orderAmount,
                order_info: `Thanh toan don hang ${orderId}`
              });

              if (momoResponse.data.success && momoResponse.data.data?.payment_url) {
                localStorage.removeItem('cart');
                window.dispatchEvent(new Event('cartUpdated')); // Notify header to update
                // Redirect to MoMo
                window.location.href = momoResponse.data.data.payment_url;
              } else {
                throw new Error('Không thể tạo link thanh toán MoMo');
              }
            } catch (momoError: any) {
              console.error('❌ MoMo error:', momoError);
              alert('Lỗi khi tạo thanh toán MoMo: ' + (momoError.response?.data?.message || momoError.message));
              setSubmitting(false);
            }
            break;

          default:
            // Fallback to success page
            localStorage.removeItem('cart');
            window.dispatchEvent(new Event('cartUpdated')); // Notify header to update
            navigate('/order-success', { state: { orderId } });
        }
      }
    } catch (error: any) {
      console.error('❌ Error creating order:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.errors 
        ? JSON.stringify(error.response.data.errors, null, 2)
        : error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng!';
      
      alert(errorMsg);
      setSubmitting(false);
    }
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      const orderAmount = calculateTotal();
      const response = await api.validateCoupon(discountCode.trim(), orderAmount);

      console.log('🎟️ Coupon validation response:', response.data);

      if (response.data.success) {
        const { coupon, calculation } = response.data.data;
        const discountAmount = calculation?.discount_amount || calculation?.discountAmount || 0;
        
        console.log('💰 Coupon data:', coupon);
        console.log('🧮 Calculation:', calculation);
        console.log('💵 Discount amount:', discountAmount);
        
        setAppliedCoupon({
          coupon_code: coupon.code,
          coupon_name: coupon.name,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value
        });
        setDiscount(discountAmount);
        setCouponError('');
        
        console.log('✅ Discount state set to:', discountAmount);
        
        alert(`✅ Áp dụng mã giảm giá thành công! Giảm ${formatPrice(discountAmount)}`);
      } else {
        setCouponError(response.data.message || 'Mã giảm giá không hợp lệ');
        setAppliedCoupon(null);
        setDiscount(0);
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      const errorMsg = error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn';
      setCouponError(errorMsg);
      setAppliedCoupon(null);
      setDiscount(0);
      alert('❌ ' + errorMsg);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <form onSubmit={handleSubmit} className="content stateful-form formCheckout">
        <div className="wrap">
          {/* Sidebar - Order Summary */}
          <div className="sidebar">
            <div className="sidebar_header">
              <h2>
                <label className="control-label">Đơn hàng</label>
                <label className="control-label">({cartItems.length} sản phẩm)</label>
              </h2>
              <hr className="full_width" />
            </div>
            
            <div className="sidebar__content">
              <div className="order-summary order-summary--product-list">
                <div className="summary-body summary-section summary-product">
                  <div className="summary-product-list">
                    <table className="product-table">
                      <tbody>
                        {cartItems.map((item) => (
                          <tr key={item.cart_id} className="product product-has-image clearfix">
                            <td>
                              <div className="product-thumbnail">
                                <div className="product-thumbnail__wrapper">
                                  <img
                                    src={item.product_image || '/images/no-image.png'}
                                    alt={item.product_name}
                                    className="product-thumbnail__image"
                                  />
                                </div>
                                <span className="product-thumbnail__quantity">{item.quantity}</span>
                              </div>
                            </td>
                            <td className="product-info">
                              <span className="product-info-name">{item.product_name}</span>
                              {item.brand_name && (
                                <span className="product-brand">{item.brand_name}</span>
                              )}
                            </td>
                            <td className="product-price text-right">
                              {formatPrice(item.unit_price * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {cartItems.length > 3 && (
                      <div className="order-summary__scroll-indicator">
                        Cuộn chuột để xem thêm
                        <i className="fa fa-long-arrow-down" aria-hidden="true"></i>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discount Code Section */}
              <div className="order-summary-section order-summary-section-discount">
                <div className="form-group">
                  <label className="field__label-static">Mã giảm giá</label>
                  <div className="field__input-wrapper">
                    <input
                      type="text"
                      className="field__input form-control"
                      placeholder="Nhập mã giảm giá"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      disabled={appliedCoupon !== null}
                    />
                    <button
                      type="button"
                      className={`field-input-btn btn ${appliedCoupon ? 'btn-success' : 'btn-info'}`}
                      onClick={applyDiscountCode}
                      disabled={appliedCoupon !== null}
                    >
                      <span className="btn-content">
                        {appliedCoupon ? '✓ Đã áp dụng' : 'Sử dụng'}
                      </span>
                    </button>
                  </div>
                  {couponError && (
                    <div className="text-danger" style={{ fontSize: '12px', marginTop: '5px' }}>
                      {couponError}
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="text-success" style={{ fontSize: '12px', marginTop: '5px' }}>
                      ✓ Mã "{appliedCoupon.coupon_code}" đã được áp dụng
                    </div>
                  )}
                </div>
              </div>

              {/* Order Total */}
              <div className="order-summary order-summary--total-lines">
                <div className="summary-section border-top-none--mobile">
                  <div className="total-line total-line-total clearfix">
                    <span className="total-line-name pull-left">Tạm tính</span>
                    <span className="total-line-price pull-right">{formatPrice(calculateTotal())}</span>
                  </div>
                  
                  {/* Discount section */}
                  {appliedCoupon && (
                    <div className="total-line total-line-total clearfix div_giam_gia">
                      <span className="total-line-name pull-left">Giảm giá ({discount})</span>
                      <span className="total-line-price pull-right text-danger">
                        -{formatPrice(discount)}
                      </span>
                    </div>
                  )}
                  
                  {/* Final Total */}
                  <div className="total-line total-line-total clearfix" style={{ borderTop: '2px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                    <span className="total-line-name pull-left" style={{ fontWeight: '700', fontSize: '18px' }}>Tổng cộng</span>
                    <span className="total-line-price pull-right" style={{ fontWeight: '700', fontSize: '18px', color: '#FF6B35' }}>
                      {formatPrice(calculateFinalTotal())}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-group clearfix hidden-sm hidden-xs">
                <div className="field__input-btn-wrapper mt10">
                  <a className="btn btn-success" href="/cart">
                    <i className="fa fa-pencil" aria-hidden="true"></i>
                    <span>Sửa giỏ hàng</span>
                  </a>
                  <button
                    className="btn btn-primary btn-checkout"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
                  </button>
                </div>
              </div>

              <div className="total-line total-line-shipping clearfix">
                <p>
                  <i>
                    - Thời gian xử lý đơn hàng: Từ 8h00- 17h thứ 2 đến thứ 7. Các đơn hàng sau thời
                    gian này sẽ được xử lý vào ngày làm việc tiếp theo.
                  </i>
                </p>
              </div>
            </div>
          </div>

          {/* Main Content - Customer Info */}
          <div className="main" role="main">
            <div className="main_header">
              <div className="shop logo logo--left">
                <h1 className="shop__name">
                  <a href="/">VNBSports</a>
                </h1>
              </div>
            </div>

            <div className="main_content">
              <div className="row">
                <div className="col-md-6 col-lg-6">
                  <div className="section">
                    <div className="section__header">
                      <h2 className="section__title">
                        <i className="fa fa-id-card-o fa-lg section__title--icon hidden-md hidden-lg"></i>
                        <label className="control-label">Thông tin nhận hàng</label>
                      </h2>
                    </div>
                    
                    <div className="section__content">
                      <div className="billing">
                        <div className="form-group">
                          <div className={`field__input-wrapper ${formData.ho_ten ? 'js-is-filled' : ''}`}>
                            <span className="field__label">Họ và tên người nhận hàng</span>
                            <input
                              name="ho_ten"
                              type="text"
                              className="field__input form-control"
                              value={formData.ho_ten}
                              onChange={handleInputChange}
                              onFocus={handleFocus}
                              onBlur={handleBlur}
                              required
                            />
                          </div>
                          {errors.ho_ten && (
                            <div className="help-block with-errors">{errors.ho_ten}</div>
                          )}
                        </div>

                        <div className="form-group">
                          <div className={`field__input-wrapper ${formData.so_dt ? 'js-is-filled' : ''}`}>
                            <span className="field__label">Số điện thoại</span>
                            <input
                              name="so_dt"
                              type="tel"
                              className="field__input form-control"
                              value={formData.so_dt}
                              onChange={handleInputChange}
                              onFocus={handleFocus}
                              onBlur={handleBlur}
                              required
                            />
                          </div>
                          {errors.so_dt && (
                            <div className="help-block with-errors">{errors.so_dt}</div>
                          )}
                        </div>

                        <div className="form-group">
                          <div className={`field__input-wrapper ${formData.dia_chi ? 'js-is-filled' : ''}`}>
                            <span className="field__label">Địa chỉ</span>
                            <input
                              name="dia_chi"
                              type="text"
                              className="field__input form-control"
                              value={formData.dia_chi}
                              onChange={handleInputChange}
                              onFocus={handleFocus}
                              onBlur={handleBlur}
                            />
                          </div>
                          {errors.dia_chi && (
                            <div className="error-message text-danger">
                              {errors.dia_chi}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <div className={`field__input-wrapper ${formData.email ? 'js-is-filled' : ''}`}>
                            <span className="field__label">Email</span>
                            <input
                              name="email"
                              type="email"
                              className="field__input form-control"
                              value={formData.email}
                              onChange={handleInputChange}
                              onFocus={handleFocus}
                              onBlur={handleBlur}
                              required
                            />
                          </div>
                          {errors.email && (
                            <div className="help-block with-errors">{errors.email}</div>
                          )}
                        </div>

                        <div className="form-group">
                          <div className={`field__input-wrapper ${formData.ghi_chu ? 'js-is-filled' : ''}`}>
                            <span className="field__label">Ghi chú đơn hàng (tùy chọn)</span>
                            <input
                              name="ghi_chu"
                              type="text"
                              className="field__input form-control"
                              value={formData.ghi_chu}
                              onChange={handleInputChange}
                              onFocus={handleFocus}
                              onBlur={handleBlur}
                            />
                          </div>
                        </div>


                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-6">
                  <div className="section payment-methods">
                    <div className="section__header">
                      <h2 className="section__title">
                        <i className="fa fa-credit-card fa-lg section__title--icon hidden-md hidden-lg"></i>
                        <label className="control-label">Thanh toán</label>
                      </h2>
                    </div>
                    
                    <div className="section__content">
                      <div className="content-box">
                        <div className="content-box__row">
                          <div className="radio-wrapper">
                            <div className="radio__input">
                              <input
                                className="input-radio"
                                type="radio"
                                value="1"
                                name="thanh_toan"
                                id="thanh_toan_cod"
                                checked={formData.thanh_toan === '1'}
                                onChange={handleInputChange}
                              />
                            </div>
                            <label className="radio__label" htmlFor="thanh_toan_cod">
                              <span className="radio__label__primary">
                                Thanh toán khi nhận hàng (COD)
                              </span>
                              <span className="radio__label__accessory">
                                <ul>
                                  <li className="payment-icon-v2 payment-icon--4">
                                    <i className="fa fa-money payment-icon-fa" aria-hidden="true"></i>
                                  </li>
                                </ul>
                              </span>
                            </label>
                          </div>

                          <div className="radio-wrapper">
                            <div className="radio__input">
                              <input
                                className="input-radio"
                                type="radio"
                                value="2"
                                name="thanh_toan"
                                id="thanh_toan_bank"
                                checked={formData.thanh_toan === '2'}
                                onChange={handleInputChange}
                              />
                            </div>
                            <label className="radio__label" htmlFor="thanh_toan_bank">
                              <span className="radio__label__primary">
                                Thanh toán qua ngân hàng
                              </span>
                              <span className="radio__label__accessory">
                                <ul>
                                  <li className="payment-icon-v2 payment-icon--4">
                                    <i className="fa fa-university payment-icon-fa"></i>
                                  </li>
                                </ul>
                              </span>
                            </label>
                          </div>

                          {/* Bank Transfer Sub-methods */}
                          {formData.thanh_toan === '2' && (
                            <div className="payment-sub-methods">
                              <div className="sub-method-option">
                                <input
                                  type="radio"
                                  id="payment_momo"
                                  name="payment_sub_method"
                                  value="momo"
                                  checked={formData.payment_sub_method === 'momo'}
                                  onChange={handleInputChange}
                                />
                                <label htmlFor="payment_momo" className="sub-method-label">
                                  <div className="sub-method-icon momo-icon">
                                    <i className="fa fa-mobile" style={{ fontSize: '24px' }}></i>
                                  </div>
                                  <div className="sub-method-info">
                                    <span className="sub-method-name">Ví MoMo</span>
                                    <span className="sub-method-desc">Thanh toán qua ví điện tử MoMo (quét mã QR)</span>
                                  </div>
                                </label>
                              </div>

                              {/* ✅ Hướng dẫn thanh toán MoMo */}
                              {formData.payment_sub_method === 'momo' && (
                                <div style={{ 
                                  padding: '15px', 
                                  backgroundColor: '#f8f9fa', 
                                  borderRadius: '8px',
                                  marginTop: '10px',
                                  border: '1px solid #dee2e6'
                                }}>
                                  <h6 style={{ marginBottom: '10px', color: '#a50064' }}>
                                    <i className="fa fa-qrcode"></i> Hướng dẫn thanh toán MoMo
                                  </h6>
                                  <ol style={{ fontSize: '14px', marginBottom: '0', paddingLeft: '20px' }}>
                                    <li>Click "Đặt hàng" để tạo đơn hàng</li>
                                    <li>Bạn sẽ được chuyển sang trang MoMo để quét mã QR</li>
                                    <li>Mở ứng dụng MoMo trên điện thoại</li>
                                    <li>Quét mã QR để thanh toán</li>
                                    <li>Xác nhận thanh toán và hoàn tất</li>
                                  </ol>
                                  <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '10px', marginBottom: '0' }}>
                                    💡 Mã QR sẽ hiển thị sau khi bạn click "Đặt hàng"
                                  </p>
                                </div>
                              )}

                              <div className="sub-method-option">
                                <input
                                  type="radio"
                                  id="payment_bank"
                                  name="payment_sub_method"
                                  value="bank_transfer"
                                  checked={formData.payment_sub_method === 'bank_transfer'}
                                  onChange={handleInputChange}
                                />
                                <label htmlFor="payment_bank" className="sub-method-label">
                                  <div className="sub-method-icon bank-icon">
                                    <i className="fa fa-university" style={{ fontSize: '20px' }}></i>
                                  </div>
                                  <div className="sub-method-info">
                                    <span className="sub-method-name">Chuyển khoản ngân hàng</span>
                                    <span className="sub-method-desc">Chuyển khoản qua ATM/Internet Banking</span>
                                  </div>
                                </label>
                              </div>

                              <div className="sub-method-option">
                                <input
                                  type="radio"
                                  id="payment_vnpay"
                                  name="payment_sub_method"
                                  value="vnpay"
                                  checked={formData.payment_sub_method === 'vnpay'}
                                  onChange={handleInputChange}
                                />
                                <label htmlFor="payment_vnpay" className="sub-method-label">
                                  <div className="sub-method-icon vnpay-icon">
                                    <i className="fa fa-credit-card" style={{ fontSize: '20px' }}></i>
                                  </div>
                                  <div className="sub-method-info">
                                    <span className="sub-method-name">VNPay</span>
                                    <span className="sub-method-desc">Thanh toán qua cổng VNPay</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section hidden-md hidden-lg">
                    <div className="form-group clearfix m0">
                      <button
                        className="btn btn-primary btn-checkout"
                        type="submit"
                        disabled={submitting}
                      >
                        {submitting ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG'}
                      </button>
                    </div>
                    <div className="text-center mt20">
                      <a className="previous-link" href="/cart">
                        <i className="fa fa-angle-left fa-lg" aria-hidden="true"></i>
                        <span>Quay về giỏ hàng</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
