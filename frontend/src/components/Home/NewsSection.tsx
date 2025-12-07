import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../../styles/NewsSection.css';

const NewsComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  const newsItems = [
    {
      id: 1,
      title: "Tổng hợp các lớp học cầu lông Tân Phú uy tín, chất lượng, giá cả phải chăng - Học cầu lông tốt ở TPHCM",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/tong-hop-cac-lop-hoc-cau-long-tan-phu-uy-tin-chat-luong-gia-ca-phai-chang-hoc-cau-long-tot-o-tphcm.webp",
      date: "26-11-2025 16:34",
      description: "Cầu lông hiện đang là một bộ môn thể thao rất phát triển ở khu vực Thành phố Hồ Chí Minh được đông đảo mọi người yêu thích..."
    },
    {
      id: 2,
      title: "Danh sách các lớp học cầu lông Quận 7 chất lượng, uy tín, đảm bảo tiến bộ - Cập nhật mới nhất 2025",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/1_84.webp",
      date: "26-11-2025 16:04",
      description: "Bạn là một người đam mê cầu lông và hiện đang sinh sống và làm việc ở khu vực quận 7 vào các buổi tối..."
    },
    {
      id: 3,
      title: "Các lớp học cầu lông quận 10 uy tín, chất lượng, chắc chắn tiến bộ - Cập nhật mới nhất 2025",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/50.webp",
      date: "26-11-2025 14:38",
      description: "Bạn cực kì đam mê cầu lông nhưng chơi mãi mà không tiến bộ đang có nhu cầu cải thiện bản thân..."
    },
    {
      id: 4,
      title: "Các lớp học cầu lông tại Đà Nẵng chất lượng mà bạn không nên bỏ qua",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/hoc-cau-long.webp",
      date: "26-11-2025 14:07",
      description: "Nếu bạn đang tìm kiếm nơi học cầu lông tại Đà Nẵng để rèn luyện sức khỏe, cải thiện kỹ năng..."
    },
    {
      id: 5,
      title: "Review chi tiết sân cầu lông City Sports chất lượng tại quận 12",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/san-cau-long-city-sports-4_1764097895.webp",
      date: "26-11-2025 09:12",
      description: "Từ một khu chơi Pickleball quen thuộc, City Sports đã mở rộng mô hình, bổ sung thêm 4 sân cầu lông..."
    },
    {
      id: 6,
      title: "Khám phá sân cầu lông Ecosport Gò Dầu chất lượng và uy tín tại Tân Phú",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/san-cau-long-ecosport-go-dau-3_1762911045.webp",
      date: "26-11-2025 08:54",
      description: "Sau thành công tại Gò Vấp, Ecosport tiếp tục mang đến trải nghiệm cầu lông chất lượng tại Tân Phú..."
    },
    {
      id: 7,
      title: "Hướng dẫn sử dụng ứng dụng ShopVNB mới ra mắt trên iOS & Android",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/ung-dung-shopvnb_1763780391.webp",
      date: "24-11-2025 09:39",
      description: "Để đáp ứng nhu cầu mua sắm ngày càng đa dạng của những người yêu thể thao, VNB Sports đã chính thức..."
    },
    {
      id: 8,
      title: "Kỹ thuật đánh cầu lông thấp tay cơ bản",
      image: "https://cdn.shopvnb.com/img/400x240/uploads/tin_tuc/ky-thuat-danh-cau-long-thap-tay.webp",
      date: "22-11-2025 11:48",
      description: "Kỹ thuật đánh cầu lông thấp tay được sử dụng khá phổ biến trong cầu lông để đỡ lại pha tấn công..."
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else if (window.innerWidth < 1280) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, newsItems.length - itemsPerView);

  const handlePrev = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const visibleItems = newsItems.slice(currentIndex, currentIndex + itemsPerView);

  return (
    <section className="news-section">
      <div className="news-container">
        {/* Header */}
        <div className="news-header">
          <h2 className="news-title">
            Tin tức mới
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="news-carousel">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="news-nav-btn prev"
            aria-label="Previous"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === maxIndex}
            className="news-nav-btn next"
            aria-label="Next"
          >
            <ChevronRight size={24} />
          </button>

          {/* Items Grid */}
          <div className="news-grid" style={{ gridTemplateColumns: `repeat(${itemsPerView}, 1fr)` }}>
            {visibleItems.map(item => (
              <div
                key={item.id}
                className="news-item"
              >
                {/* Image */}
                <div className="news-item-image">
                  <img
                    src={item.image}
                    alt={item.title}
                  />
                </div>

                {/* Content */}
                <div className="news-item-content">
                  {/* Title */}
                  <h3 className="news-item-title">
                    {item.title}
                  </h3>

                  {/* Date */}
                  <div className="news-item-date-wrapper">
                    <span className="news-item-date">
                      {item.date}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="news-item-description">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="news-indicators">
          {Array.from({ length: Math.ceil(newsItems.length / itemsPerView) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx * itemsPerView)}
              className={`news-indicator ${idx * itemsPerView === currentIndex ? 'active' : ''}`}
              aria-label={`Go to page ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsComponent;