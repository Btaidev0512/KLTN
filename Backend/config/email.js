const nodemailer = require('nodemailer');

// Cấu hình Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// Template email quên mật khẩu
const sendResetPasswordEmail = async (email, resetToken) => {
  const mailOptions = {
    from: `"TTShop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Đặt lại mật khẩu - TTShop',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #E95211; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .code-box { background: #fff; border: 2px dashed #E95211; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
          .code { background: #4169E1; color: white; padding: 15px 25px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 20px; font-weight: bold; letter-spacing: 3px; display: inline-block; margin: 10px 0; }
          .instructions { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .steps { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .step { margin: 15px 0; padding-left: 30px; position: relative; }
          .step::before { content: "→"; position: absolute; left: 0; color: #E95211; font-weight: bold; font-size: 18px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">🔐 Đặt lại mật khẩu</h2>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Xin chào,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình tại <strong>TTShop</strong>.</p>
            
            <div class="code-box">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #E95211; font-size: 14px;">MÃ XÁC NHẬN CỦA BẠN:</p>
              <div class="code">${resetToken}</div>
              <p style="margin: 15px 0 0 0; font-size: 13px; color: #666;">
                Copy mã này và dán vào trang web để xác nhận
              </p>
            </div>
            
            <div class="instructions">
              <p style="margin: 0; font-weight: bold; color: #856404;">
                ⚠️ Lưu ý: Mã xác nhận này chỉ có hiệu lực trong <strong>1 giờ</strong>.
              </p>
            </div>
            
            <div class="steps">
              <h3 style="margin-top: 0; color: #E95211;">📝 Hướng dẫn đặt lại mật khẩu:</h3>
              <div class="step">Quay lại trang web và click nút <strong>"XÁC NHẬN"</strong></div>
              <div class="step">Nhập email: <strong>${email}</strong></div>
              <div class="step">Nhập mã xác nhận ở trên vào ô "Mã xác nhận"</div>
              <div class="step">Click <strong>"Xác nhận"</strong> để tiếp tục</div>
              <div class="step">Nhập mật khẩu mới của bạn</div>
              <div class="step">Hoàn tất! Bạn có thể đăng nhập với mật khẩu mới</div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding: 15px; background: white; border-radius: 6px;">
              <strong>Lưu ý:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. 
              Mật khẩu của bạn sẽ không bị thay đổi.
            </p>
          </div>
          <div class="footer">
            <p>© 2024 TTShop. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Gửi email xác nhận đặt lại mật khẩu thành công
const sendPasswordChangedEmail = async (email) => {
  const mailOptions = {
    from: `"TTShop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Mật khẩu đã được thay đổi - TTShop',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">✅ Mật khẩu đã được thay đổi thành công</h2>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Xin chào,</p>
          <p>Mật khẩu tài khoản của bạn tại <strong>TTShop</strong> đã được thay đổi thành công.</p>
          <p>Thời gian: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
          <p style="color: #dc3545; margin-top: 20px; padding: 15px; background: #fff; border-left: 4px solid #dc3545; border-radius: 4px;">
            ⚠️ <strong>Quan trọng:</strong> Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
            <p>© 2024 TTShop. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Password changed notification sent to:', email);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
};

// ========================================
// 📦 EMAIL CHO ĐỚN HÀNG
// ========================================

// Email xác nhận đơn hàng mới
const sendOrderConfirmationEmail = async (orderData) => {
  const {
    customer_email,
    order_number,
    shipping_full_name,
    total_amount,
    items = [],
    shipping_address_line_1,
    shipping_city,
    shipping_state,
    payment_method,
    created_at
  } = orderData;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eee;">
        <div style="display: flex; align-items: center;">
          <div>
            <strong>${item.product_name}</strong>
            <div style="color: #666; font-size: 13px;">Số lượng: ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
        <strong>${formatPrice(item.unit_price)}</strong>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eee; text-align: right;">
        <strong style="color: #E95211;">${formatPrice(item.unit_price * item.quantity)}</strong>
      </td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"TTShop" <${process.env.EMAIL_USER}>`,
    to: customer_email,
    subject: `✅ Xác nhận đơn hàng #${order_number} - TTShop`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 650px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #E95211 0%, #ff6b35 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; }
          .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; }
          .info-label { color: #666; font-weight: 500; }
          .info-value { font-weight: bold; color: #333; }
          .items-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
          .total-row { background: #E95211; color: white; font-size: 18px; font-weight: bold; }
          .status-badge { display: inline-block; background: #28a745; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          .address-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .btn { display: inline-block; background: #E95211; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">✅ Đơn hàng đã được xác nhận!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Cảm ơn bạn đã mua hàng tại TTShop
            </p>
          </div>
          
          <div class="content">
            <div class="order-info">
              <h2 style="margin-top: 0; color: #E95211;">📋 Thông tin đơn hàng</h2>
              <div class="info-row">
                <span class="info-label">Mã đơn hàng:</span>
                <span class="info-value">#${order_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ngày đặt:</span>
                <span class="info-value">${new Date(created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Trạng thái:</span>
                <span class="status-badge">Chờ xác nhận</span>
              </div>
              <div class="info-row">
                <span class="info-label">Phương thức thanh toán:</span>
                <span class="info-value">${payment_method === 'cod' ? 'COD (Thanh toán khi nhận hàng)' : payment_method.toUpperCase()}</span>
              </div>
            </div>

            <div class="address-box">
              <h3 style="margin-top: 0; color: #856404;">📍 Thông tin người nhận</h3>
              <p style="margin: 5px 0;"><strong>Họ tên:</strong> ${shipping_full_name}</p>
              <p style="margin: 5px 0;"><strong>Số điện thoại:</strong> ${orderData.customer_phone || 'Chưa cung cấp'}</p>
              <p style="margin: 5px 0;"><strong>Địa chỉ:</strong> ${shipping_address_line_1}</p>
              ${shipping_city ? `<p style="margin: 5px 0;">${shipping_city}${shipping_state ? `, ${shipping_state}` : ''}</p>` : ''}
              ${orderData.notes ? `<p style="margin: 5px 0; color: #666;"><strong>Ghi chú:</strong> ${orderData.notes}</p>` : ''}
            </div>

            <h3 style="color: #E95211;">🛒 Chi tiết sản phẩm</h3>
            <table class="items-table">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #E95211;">Sản phẩm</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #E95211;">Đơn giá</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #E95211;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2" style="padding: 15px; text-align: right;">TỔNG CỘNG:</td>
                  <td style="padding: 15px; text-align: right;">${formatPrice(total_amount)}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; border-radius: 4px; margin: 25px 0;">
              <p style="margin: 0; color: #0c5460;">
                <strong>ℹ️ Lưu ý:</strong> Chúng tôi sẽ liên hệ với bạn để xác nhận đơn hàng trong thời gian sớm nhất. 
                Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình.
              </p>
            </div>

            <div style="text-align: center;">
              <a href="http://localhost:3000/order-history" class="btn" style="color: white;">
                Xem chi tiết đơn hàng
              </a>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #E95211;">📞 Cần hỗ trợ?</h4>
              <p style="margin: 5px 0;">Hotline: 0123-456-789</p>
              <p style="margin: 5px 0;">Email: support@ttshop.com</p>
              <p style="margin: 5px 0;">Thời gian: 8:00 - 22:00 (Thứ 2 - Chủ nhật)</p>
            </div>
          </div>

          <div class="footer">
            <p>© 2024 TTShop. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to: ${customer_email} - Order: ${order_number}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
    throw error;
  }
};

// Email thông báo thay đổi trạng thái đơn hàng
const sendOrderStatusUpdateEmail = async (orderData, oldStatus, newStatus) => {
  const {
    customer_email,
    order_number,
    shipping_full_name,
    total_amount,
    tracking_number
  } = orderData;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'pending': { label: 'Chờ xác nhận', color: '#ffc107', icon: '⏳' },
      'confirmed': { label: 'Đã xác nhận', color: '#17a2b8', icon: '✓' },
      'processing': { label: 'Đang xử lý', color: '#007bff', icon: '📦' },
      'shipped': { label: 'Đang giao hàng', color: '#6f42c1', icon: '🚚' },
      'delivered': { label: 'Đã giao hàng', color: '#28a745', icon: '✅' },
      'cancelled': { label: 'Đã hủy', color: '#dc3545', icon: '❌' },
      'returned': { label: 'Đã trả hàng', color: '#fd7e14', icon: '↩️' },
      'refunded': { label: 'Đã hoàn tiền', color: '#20c997', icon: '💰' }
    };
    return statusMap[status] || { label: status, color: '#6c757d', icon: '📋' };
  };

  const newStatusInfo = getStatusInfo(newStatus);

  let additionalContent = '';
  if (newStatus === 'shipped' && tracking_number) {
    additionalContent = `
      <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #0c5460;">🚚 Thông tin vận chuyển</h3>
        <p style="margin: 8px 0;"><strong>Mã vận đơn:</strong> <span style="font-size: 18px; color: #2196F3; font-family: monospace;">${tracking_number}</span></p>
        <p style="margin: 8px 0; color: #666;">Bạn có thể sử dụng mã này để tra cứu đơn hàng trên website của đơn vị vận chuyển.</p>
      </div>
    `;
  } else if (newStatus === 'delivered') {
    additionalContent = `
      <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #155724;">🎉 Đơn hàng đã được giao thành công!</h3>
        <p style="margin: 8px 0; color: #155724;">
          Cảm ơn bạn đã mua hàng tại TTShop. Nếu có bất kỳ vấn đề gì với sản phẩm, 
          vui lòng liên hệ với chúng tôi trong vòng 7 ngày để được hỗ trợ đổi trả.
        </p>
      </div>
    `;
  } else if (newStatus === 'cancelled') {
    additionalContent = `
      <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <h3 style="margin-top: 0; color: #721c24;">❌ Đơn hàng đã bị hủy</h3>
        <p style="margin: 8px 0; color: #721c24;">
          Nếu bạn không yêu cầu hủy đơn hàng này, vui lòng liên hệ với chúng tôi ngay để được hỗ trợ.
        </p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"TTShop" <${process.env.EMAIL_USER}>`,
    to: customer_email,
    subject: `${newStatusInfo.icon} Cập nhật đơn hàng #${order_number} - ${newStatusInfo.label}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 650px; margin: 0 auto; padding: 20px; }
          .header { background: ${newStatusInfo.color}; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #eee; border-top: none; }
          .status-timeline { display: flex; align-items: center; justify-content: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
          .status-box { padding: 15px 25px; border-radius: 8px; margin: 0 10px; font-weight: bold; }
          .old-status { background: #e9ecef; color: #6c757d; }
          .new-status { background: ${newStatusInfo.color}; color: white; }
          .arrow { font-size: 24px; color: ${newStatusInfo.color}; margin: 0 15px; }
          .order-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
          .btn { display: inline-block; background: ${newStatusInfo.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${newStatusInfo.icon} Đơn hàng của bạn đã được cập nhật</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
              Đơn hàng #${order_number}
            </p>
          </div>
          
          <div class="content">
            <div class="status-timeline">
              <div class="status-box old-status">
                ${getStatusInfo(oldStatus).icon} ${getStatusInfo(oldStatus).label}
              </div>
              <div class="arrow">→</div>
              <div class="status-box new-status">
                ${newStatusInfo.icon} ${newStatusInfo.label}
              </div>
            </div>

            ${additionalContent}

            <div class="order-info">
              <h3 style="margin-top: 0; color: ${newStatusInfo.color};">📋 Thông tin đơn hàng</h3>
              <div class="info-row">
                <span style="color: #666;">Mã đơn hàng:</span>
                <strong>#${order_number}</strong>
              </div>
              <div class="info-row">
                <span style="color: #666;">Người nhận:</span>
                <strong>${shipping_full_name}</strong>
              </div>
              <div class="info-row">
                <span style="color: #666;">Tổng tiền:</span>
                <strong style="color: #E95211;">${formatPrice(total_amount)}</strong>
              </div>
              <div class="info-row">
                <span style="color: #666;">Trạng thái hiện tại:</span>
                <strong style="color: ${newStatusInfo.color};">${newStatusInfo.label}</strong>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="http://localhost:3000/order-history" class="btn" style="color: white;">
                Xem chi tiết đơn hàng
              </a>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <h4 style="margin-top: 0; color: #E95211;">📞 Cần hỗ trợ?</h4>
              <p style="margin: 5px 0;">Hotline: 0123-456-789</p>
              <p style="margin: 5px 0;">Email: support@ttshop.com</p>
            </div>
          </div>

          <div class="footer">
            <p>© 2024 TTShop. All rights reserved.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Status update email sent to: ${customer_email} - Order: ${order_number} - New status: ${newStatus}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
};
