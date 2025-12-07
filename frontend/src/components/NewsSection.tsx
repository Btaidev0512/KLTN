import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/NewsSection.css';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
}

const NewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Mock data - thay bằng API call thực tế
  useEffect(() => {
    const mockNews: NewsItem[] = [
      {
        id: 1,
        title: 'Tổng hợp các lớp học cầu lông Tân Phú uy tín, chất lượng',
        slug: 'lop-hoc-cau-long-tan-phu',
        excerpt: 'Cầu lông hiện đang là một bộ môn thể thao rất phát triển ở khu vực Thành phố Hồ Chí Minh được đông đảo người dân yêu thích...',
        image: 'https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/tong-hop-cac-lop-hoc-cau-long-tan-phu-uy-tin-chat-luong-gia-ca-phai-chang-hoc-cau-long-tot-o-tphcm.webp',
        date: '26-11-2025',
        category: 'Học cầu lông'
      },
      {
        id: 2,
        title: 'Review chi tiết sân cầu lông City Sports chất lượng tại quận 12',
        slug: 'san-cau-long-city-sports',
        excerpt: 'Từ một khu chơi Pickleball quen thuộc, City Sports đã mở rộng mô hình, bổ sung thêm 4 sân cầu lông để phục vụ nhu cầu chơi thể thao...',
        image: 'https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/san-cau-long-city-sports-4_1764097895.webp',
        date: '26-11-2025',
        category: 'Sân cầu lông'
      },
      {
        id: 3,
        title: 'Kỹ thuật đánh cầu lông thấp tay cơ bản',
        slug: 'ky-thuat-danh-cau-long-thap-tay',
        excerpt: 'Kỹ thuật đánh cầu lông thấp tay được sử dụng khá phổ biến trong cầu lông để đỡ lại pha tấn công dồn cầu của đối phương...',
        image: 'https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/ky-thuat-danh-cau-long-thap-tay.webp',
        date: '22-11-2025',
        category: 'Kỹ thuật'
      },
      {
        id: 4,
        title: 'Kỹ thuật di chuyển trong cầu lông cực kì đơn giản',
        slug: 'ky-thuat-di-chuyen-trong-cau-long',
        excerpt: 'Kỹ thuật di chuyển trong cầu lông là rất quan trọng, giúp hạn chế những chấn thương và kết hợp với nhiều kỹ thuật khác...',
        image: 'https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/ky-thuat-di-chuyen-trong-cau-long.webp',
        date: '22-11-2025',
        category: 'Kỹ thuật'
      },
      {
        id: 5,
        title: 'Top những cây vợt cầu lông nào tốt nhất hiện nay',
        slug: 'vot-cau-long-nao-tot-nhat',
        excerpt: 'VNBSports giới thiệu với mọi người vợt cầu lông nào tốt nhất hiện nay của hãng vợt cầu lông Yonex, Victor, Lining...',
        image: 'https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/vot-cau-long-nao-tot-nhat-hien-nay.webp',
        date: '20-11-2025',
        category: 'Dụng cụ'
      },
      {
        id: 6,
        title: 'Cách chọn vợt cầu lông cho người mới chơi',
        slug: 'cach-chon-vot-cau-long',
        excerpt: 'Hiện nay, đa số mọi người khi chọn mua vợt cầu lông thường dựa vào cảm tính mà không biết rằng cây vợt phù hợp sẽ giúp bạn...',
        image: 'https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/cach-chon-vot-cau-long-cho-nguoi-moi-choi.webp',
        date: '20-11-2025',
        category: 'Hướng dẫn'
      }
    ];
    setNews(mockNews);
  }, []);

  const categories = ['all', 'Kỹ thuật', 'Hướng dẫn', 'Dụng cụ', 'Sân cầu lông', 'Học cầu lông'];

  const filteredNews = activeCategory === 'all' 
    ? news 
    : news.filter(item => item.category === activeCategory);

  return (
    <section className="news-section">
      <div className="container">
        {/* Header */}
        <div className="news-header">
          <div className="news-title-wrapper">
            <h2 className="news-main-title">
              <span className="title-icon">📰</span>
              <span>Tin tức & Hướng dẫn</span>
            </h2>
            <p className="news-subtitle">
              Cập nhật kiến thức và kỹ năng cầu lông mới nhất
            </p>
          </div>
          <Link to="/tin-tuc" className="view-all-btn">
            Xem tất cả
            <i className="fas fa-arrow-right"></i>
          </Link>
        </div>

        {/* Category Filter */}
        <div className="news-categories">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="news-grid">
          {/* Featured News - First Item */}
          {filteredNews.length > 0 && (
            <div className="news-featured">
              <Link to={`/tin-tuc/${filteredNews[0].slug}`} className="news-card featured">
                <div className="news-image-wrapper">
                  <img 
                    src={filteredNews[0].image} 
                    alt={filteredNews[0].title}
                    loading="lazy"
                  />
                  <div className="news-badge">{filteredNews[0].category}</div>
                </div>
                <div className="news-content">
                  <div className="news-meta">
                    <span className="news-date">
                      <i className="far fa-calendar-alt"></i>
                      {filteredNews[0].date}
                    </span>
                  </div>
                  <h3 className="news-title">{filteredNews[0].title}</h3>
                  <p className="news-excerpt">{filteredNews[0].excerpt}</p>
                  <div className="news-footer">
                    <span className="read-more">
                      Đọc thêm
                      <i className="fas fa-arrow-right"></i>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Regular News Grid */}
          <div className="news-list">
            {filteredNews.slice(1, 6).map(item => (
              <Link 
                key={item.id} 
                to={`/tin-tuc/${item.slug}`} 
                className="news-card"
              >
                <div className="news-image-wrapper">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    loading="lazy"
                  />
                  <div className="news-badge-small">{item.category}</div>
                </div>
                <div className="news-content">
                  <div className="news-meta">
                    <span className="news-date">
                      <i className="far fa-calendar-alt"></i>
                      {item.date}
                    </span>
                  </div>
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-excerpt">{item.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="news-cta">
          <div className="cta-content">
            <h3>💡 Muốn nhận thông báo bài viết mới?</h3>
            <p>Đăng ký để không bỏ lỡ các bài viết hữu ích về cầu lông</p>
          </div>
          <Link to="/dang-ky" className="cta-btn">
            Đăng ký ngay
            <i className="fas fa-bell"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
