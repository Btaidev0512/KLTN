import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import '../../styles/Footer.css';

const Footer: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter subscription:', email);
    alert('Cảm ơn bạn đã đăng ký nhận tin!');
    setEmail('');
  };

  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-widgets">
            {/* Widget 1: Thông tin công ty */}
            <div className="footer-widget about-widget">
              <h3 className="widget-title">VỀ CHÚNG TÔI</h3>
              <p className="footer-about-text">
                TTSports - Cửa hàng chuyên cung cấp các sản phẩm cầu lông chính hãng từ các thương hiệu nổi tiếng như Yonex, Victor, Lining, Mizuno và nhiều hãng khác.
              </p>
              <div className="footer-social">
                <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-youtube"></i>
                </a>
                <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://tiktok.com/" target="_blank" rel="noopener noreferrer" className="social-link">
                  <i className="fab fa-tiktok"></i>
                </a>
              </div>
            </div>

            {/* Widget 2: Thông tin liên hệ */}
            <div className="footer-widget contact-widget">
              <h3 className="widget-title">THÔNG TIN LIÊN HỆ</h3>
              <ul className="contact-info">
                <li>
                  <i className="fas fa-map-marker-alt"></i>
                  <span>268 Lý Thường Kiệt, Phường 14, Quận 10, TP.HCM</span>
                </li>
                <li>
                  <i className="fas fa-phone-alt"></i>
                  <a href="tel:0368238582">0368.238.582</a>
                </li>
                <li>
                  <i className="fas fa-phone-alt"></i>
                  <a href="tel:0377486864">0377.486.864</a>
                </li>
                <li>
                  <i className="fas fa-envelope"></i>
                  <a href="mailto:VNBSports@gmail.com">VNBSports@gmail.com</a>
                </li>
                <li>
                  <i className="far fa-clock"></i>
                  <span>Thời gian làm việc: 8:00 - 21:00 (Tất cả các ngày)</span>
                </li>
              </ul>
            </div>

            {/* Widget 3: Menu hữu ích */}
            <div className="footer-widget links-widget">
              <h3 className="widget-title">LIÊN KẾT HỮU ÍCH</h3>
              <ul className="footer-links">
                <li><Link to="/">Trang chủ</Link></li>
                <li><Link to="/about">Giới thiệu</Link></li>
                <li><Link to="/products">Sản phẩm</Link></li>
                <li><Link to="/news">Tin tức</Link></li>
                <li><Link to="/contact">Liên hệ</Link></li>
                <li><Link to="/chinh-sach-bao-hanh">Chính sách bảo hành</Link></li>
                <li><Link to="/chinh-sach-van-chuyen">Chính sách vận chuyển</Link></li>
                <li><Link to="/chinh-sach-doi-tra">Chính sách đổi trả</Link></li>
              </ul>
            </div>

            {/* Widget 4: Đăng ký nhận tin */}
            <div className="footer-widget newsletter-widget">
              <h3 className="widget-title">ĐĂNG KÝ NHẬN TIN</h3>
              <p>Đăng ký nhận tin để được cập nhật những sản phẩm mới nhất và khuyến mãi đặc biệt.</p>
              <form className="footer-newsletter" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  placeholder="Email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn">Đăng ký</button>
              </form>
              <div className="payment-methods">
                <i className="fab fa-cc-visa payment-icon"></i>
                <i className="fab fa-cc-mastercard payment-icon"></i>
                <i className="fab fa-cc-paypal payment-icon"></i>
                <i className="fab fa-cc-apple-pay payment-icon"></i>
                <i className="fas fa-money-bill-wave payment-icon"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="copyright">
            <p>&copy; {currentYear} VNBSports. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      {showBackToTop && (
        <div className="back-to-top" onClick={scrollToTop}>
          <i className="fas fa-chevron-up"></i>
        </div>
      )}
    </footer>
  );
};

export default Footer;
