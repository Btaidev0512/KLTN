import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/About.css';

const About: React.FC = () => {
  useEffect(() => {
    document.title = 'Về chúng tôi - TT Shop';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page-wrapper">
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Trang chủ</Link>
              </li>
              <li className="breadcrumb-item active">Về chúng tôi</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Hero Section - Cửa Hàng Cầu Lông Số 1 */}
      <section className="hero-about-section">
        <div className="container">
          <div className="row align-items-center">
            <motion.div 
              className="col-lg-6 order-lg-1 order-2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h1 className="hero-title">Cửa Hàng Cầu Lông Số 1 Việt Nam</h1>
              <p className="hero-description">
                Chuyên cung cấp vợt cầu lông, giày, trang phục và phụ kiện chính hãng từ các thương hiệu hàng đầu thế giới như Yonex, Victor, Lining với chất lượng cao nhất và giá tốt nhất.
              </p>
              <div className="hero-stats-grid">
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05 }}
                >
                  <h3>15+</h3>
                  <p>Năm kinh nghiệm</p>
                </motion.div>
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05 }}
                >
                  <h3>1000+</h3>
                  <p>Sản phẩm</p>
                </motion.div>
                <motion.div 
                  className="stat-item"
                  whileHover={{ scale: 1.05 }}
                >
                  <h3>50K+</h3>
                  <p>Khách hàng</p>
                </motion.div>
              </div>
            </motion.div>
            <motion.div 
              className="col-lg-6 order-lg-2 order-1"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="hero-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"
                  alt="Cửa hàng cầu lông" 
                  className="img-fluid rounded"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      

      {/* Features Section - Cửa Hàng Uy Tín */}
      <section className="features-about-section">
        <div className="container">
          <div className="row align-items-center">
            <motion.div 
              className="col-lg-6 order-lg-1 order-2"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="features-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"
                  alt="Cửa hàng cầu lông" 
                  className="img-fluid rounded"
                />
              </div>
            </motion.div>
            <motion.div 
              className="col-lg-6 order-lg-2 order-1"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="features-content">
                <h2 className="section-title">Cửa Hàng Cầu Lông Uy Tín Hàng Đầu</h2>
                <p className="section-description">
                  Chúng tôi tự hào là đối tác đáng tin cậy trong việc cung cấp các sản phẩm cầu lông chất lượng cao, giúp bạn phát triển kỹ năng và đam mê với môn thể thao tuyệt vời này.
                </p>
                <div className="features-grid">
                  <motion.div 
                    className="feature-box"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="feature-icon">
                      <i className="fas fa-trophy"></i>
                    </div>
                    <div className="feature-text">
                      <h6>Sản Phẩm Chính Hãng 100%</h6>
                      <p>Yonex, Victor, Lining authentic</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="feature-box"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="feature-icon">
                      <i className="fas fa-headphones"></i>
                    </div>
                    <div className="feature-text">
                      <h6>Tư Vấn Chuyên Nghiệp 24/7</h6>
                      <p>Đội ngũ chuyên gia cầu lông</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="feature-box"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="feature-icon">
                      <i className="fas fa-shipping-fast"></i>
                    </div>
                    <div className="feature-text">
                      <h6>Giao Hàng Miễn Phí</h6>
                      <p>Toàn quốc với đơn từ 500k</p>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="feature-box"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="feature-icon">
                      <i className="fas fa-medal"></i>
                    </div>
                    <div className="feature-text">
                      <h6>Bảo Hành Chính Hãng</h6>
                      <p>Cam kết chất lượng tốt nhất</p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Delivery Section */}
      <section className="delivery-about-section">
        <div className="container">
          <div className="row align-items-center">
            <motion.div 
              className="col-lg-6 order-lg-1 order-1"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="delivery-content">
                <h2 className="section-title">Chúng Tôi Giao Hàng, Bạn Tận Hưởng Cầu Lông.</h2>
                <p className="section-description">
                  Dịch vụ giao hàng nhanh chóng và đáng tin cậy giúp bạn nhận được những sản phẩm cầu lông chất lượng cao ngay tại nhà.
                </p>
                <div className="delivery-features-list">
                  <motion.div 
                    className="delivery-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    viewport={{ once: true }}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Giao hàng nhanh chóng trong ngày tại TP.HCM</span>
                  </motion.div>
                  <motion.div 
                    className="delivery-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    viewport={{ once: true }}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Đóng gói cẩn thận, bảo vệ vợt cầu lông</span>
                  </motion.div>
                  <motion.div 
                    className="delivery-item"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    viewport={{ once: true }}
                  >
                    <i className="fas fa-check-circle"></i>
                    <span>Miễn phí giao hàng với đơn từ 500.000đ</span>
                  </motion.div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/products/all" className="btn-buy-now">
                    <i className="fas fa-shopping-cart"></i> Mua Ngay
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            <motion.div 
              className="col-lg-6 order-lg-2 order-2"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="delivery-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&q=80"
                  alt="Giao hàng cầu lông" 
                  className="img-fluid"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-about-section">
        <div className="container">
          <motion.div 
            className="section-header text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title-center">Đội Ngũ Chuyên Gia Cầu Lông</h2>
            <p className="section-subtitle">Gặp gỡ những chuyên gia cầu lông tài năng đứng sau sự thành công của chúng tôi</p>
          </motion.div>
          <div className="row">
            {[
              { 
                name: 'HLV Nguyễn Tiến Minh', 
                position: 'Giám Đốc & HLV Trưởng', 
                img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&q=80' 
              },
              { 
                name: 'Nguyễn Thùy Linh', 
                position: 'Vận động viên', 
                img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80' 
              },
              { 
                name: 'Rexy Mainaky', 
                position: 'Chuyên Gia Cầu Lông', 
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80' 
              },
              { 
                name: 'Phạm Thị Mai', 
                position: 'Trưởng Phòng Chăm Sóc KH', 
                img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80' 
              }
            ].map((member, index) => (
              <motion.div 
                key={index}
                className="col-lg-3 col-md-6 col-sm-6 mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="team-member-card"
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="member-image-wrapper">
                    <img 
                      src={member.img}
                      alt={member.name} 
                      className="img-fluid"
                    />
                  </div>
                  <h5 className="member-name">{member.name}</h5>
                  <p className="member-position">{member.position}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-about-section">
        <div className="container">
          <motion.div 
            className="section-header text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title-center">Khách Hàng Nói Gì Về Chúng Tôi</h2>
          </motion.div>
          <div className="row">
            {[
              {
                name: 'Nguyễn Văn An',
                role: 'VĐV Cầu lông',
                img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
                review: 'Vợt Yonex mua ở đây chất lượng tuyệt vời, chính hãng 100%. Tôi đã cải thiện được kỹ thuật đáng kể nhờ có vợt phù hợp. Dịch vụ tư vấn rất chuyên nghiệp.'
              },
              {
                name: 'Trần Thị Linh',
                role: 'Khách hàng VIP',
                img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
                review: 'Giao hàng nhanh, đóng gói cẩn thận. Giày Victor mua ở đây vừa vặn và bền. Giá cả hợp lý so với chất lượng. Sẽ tiếp tục ủng hộ cửa hàng.'
              },
              {
                name: 'Lê Minh Đức',
                role: 'HLV Cầu lông',
                img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
                review: 'Cửa hàng có đầy đủ từ vợt cho người mới chơi đến vợt chuyên nghiệp. Nhân viên tư vấn nhiệt tình, hiểu biết sâu về cầu lông. Rất recommend!'
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                className="col-lg-4 col-md-6 mb-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="testimonial-card"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="stars-rating">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className="fas fa-star"></i>
                    ))}
                  </div>
                  <p className="testimonial-text">"{testimonial.review}"</p>
                  <div className="customer-info-wrapper">
                    <img 
                      src={testimonial.img}
                      alt={testimonial.name} 
                      className="customer-avatar"
                    />
                    <div className="customer-details">
                      <h6 className="customer-name">{testimonial.name}</h6>
                      <p className="customer-role">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;