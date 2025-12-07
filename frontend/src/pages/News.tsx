import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/News.css';

interface NewsArticle {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  featured: boolean;
  views: number;
}

const News: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    document.title = 'Tin tức - TT Shop';
  }, []);

  // Sample news data
  const newsArticles: NewsArticle[] = [
    {
      id: 1,
      title: "Top 5 Vợt Cầu Lông Tốt Nhất Năm 2025",
      excerpt: "Khám phá những chiếc vợt cầu lông được đánh giá cao nhất trong năm với công nghệ tiên tiến và thiết kế tối ưu.",
      content: "Nội dung chi tiết bài viết...",
      author: "Admin TT Shop",
      date: "2025-09-28",
      category: "Sản phẩm",
      image: "https://picsum.photos/seed/racket1/400/250",
      featured: true,
      views: 1250
    },
    {
      id: 2,
      title: "Hướng Dẫn Chọn Giày Cầu Lông Phù Hợp",
      excerpt: "Làm thế nào để chọn được đôi giày cầu lông hoàn hảo cho phong cách chơi và bàn chân của bạn.",
      content: "Nội dung chi tiết bài viết...",
      author: "Chuyên gia TT Shop",
      date: "2025-09-25",
      category: "Hướng dẫn",
      image: "https://picsum.photos/seed/shoes2/400/250",
      featured: false,
      views: 890
    },
    {
      id: 3,
      title: "Kỹ Thuật Đan Cước Vợt Cầu Lông Chuyên Nghiệp",
      excerpt: "Tìm hiểu về các kỹ thuật đan cước khác nhau và cách chúng ảnh hưởng đến hiệu suất thi đấu.",
      content: "Nội dung chi tiết bài viết...",
      author: "Thầy Minh",
      date: "2025-09-22",
      category: "Kỹ thuật",
      image: "https://picsum.photos/seed/string3/400/250",
      featured: true,
      views: 1456
    },
    {
      id: 4,
      title: "Tin Tức Giải Cầu Lông Việt Nam Open 2025",
      excerpt: "Cập nhật mới nhất về giải đấu cầu lông lớn nhất Việt Nam với sự tham gia của các tay vợt hàng đầu.",
      content: "Nội dung chi tiết bài viết...",
      author: "Ban biên tập",
      date: "2025-09-20",
      category: "Tin tức",
      image: "https://picsum.photos/seed/tournament4/400/250",
      featured: false,
      views: 2100
    },
    {
      id: 5,
      title: "Chăm Sóc và Bảo Quản Vợt Cầu Lông Đúng Cách",
      excerpt: "Những mẹo hay giúp bạn kéo dài tuổi thọ của vợt cầu lông và duy trì hiệu suất tối ưu.",
      content: "Nội dung chi tiết bài viết...",
      author: "Chuyên gia TT Shop",
      date: "2025-09-18",
      category: "Hướng dẫn",
      image: "https://picsum.photos/seed/care5/400/250",
      featured: false,
      views: 756
    },
    {
      id: 6,
      title: "Xu Hướng Thời Trang Cầu Lông 2025",
      excerpt: "Khám phá những xu hướng thời trang cầu lông mới nhất từ các thương hiệu hàng đầu thế giới.",
      content: "Nội dung chi tiết bài viết...",
      author: "Fashion Team",
      date: "2025-09-15",
      category: "Thời trang",
      image: "https://picsum.photos/seed/fashion6/400/250",
      featured: false,
      views: 623
    }
  ];

  const categories = ['all', 'Sản phẩm', 'Hướng dẫn', 'Kỹ thuật', 'Tin tức', 'Thời trang'];

  // Filter articles based on category and search
  const filteredArticles = newsArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = newsArticles.filter(article => article.featured);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="news-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Trang chủ</Link> / <span>Tin tức</span>
        </div>

        {/* Page Header */}
        <div className="news-header">
          <h1 className="page-title">Tin Tức & Blog</h1>
          <p className="page-subtitle">
            Cập nhật những thông tin mới nhất về cầu lông, sản phẩm và kỹ thuật chơi
          </p>
        </div>

        {/* Search & Filter */}
        <div className="news-controls">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                className={`filter-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Tất cả' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Articles */}
        {selectedCategory === 'all' && searchTerm === '' && (
          <div className="featured-section">
            <h2 className="section-title">
              <i className="fas fa-star"></i>
              Bài viết nổi bật
            </h2>
            <div className="featured-articles">
              {featuredArticles.map(article => (
                <div key={article.id} className="featured-card">
                  <div className="featured-image">
                    <img src={article.image} alt={article.title} />
                    <div className="featured-badge">
                      <i className="fas fa-crown"></i>
                      Nổi bật
                    </div>
                  </div>
                  <div className="featured-content">
                    <div className="article-meta">
                      <span className="category">{article.category}</span>
                      <span className="date">{formatDate(article.date)}</span>
                    </div>
                    <h3 className="featured-title">
                      <Link to={`/news/${article.id}`}>{article.title}</Link>
                    </h3>
                    <p className="featured-excerpt">{article.excerpt}</p>
                    <div className="featured-footer">
                      <div className="author-info">
                        <i className="fas fa-user"></i>
                        <span>{article.author}</span>
                      </div>
                      <div className="views">
                        <i className="fas fa-eye"></i>
                        <span>{formatViews(article.views)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="articles-section">
          <div className="section-header">
            <h2 className="section-title">
              {selectedCategory === 'all' ? 'Tất cả bài viết' : selectedCategory}
            </h2>
            <div className="results-count">
              {filteredArticles.length} bài viết
            </div>
          </div>
          
          <div className="articles-grid">
            {filteredArticles.map(article => (
              <article key={article.id} className="article-card">
                <div className="article-image">
                  <img src={article.image} alt={article.title} />
                  <div className="article-category">{article.category}</div>
                  {article.featured && (
                    <div className="featured-indicator">
                      <i className="fas fa-star"></i>
                    </div>
                  )}
                </div>
                <div className="article-content">
                  <div className="article-meta">
                    <span className="date">
                      <i className="fas fa-calendar"></i>
                      {formatDate(article.date)}
                    </span>
                    <span className="views">
                      <i className="fas fa-eye"></i>
                      {formatViews(article.views)}
                    </span>
                  </div>
                  <h3 className="article-title">
                    <Link to={`/news/${article.id}`}>{article.title}</Link>
                  </h3>
                  <p className="article-excerpt">{article.excerpt}</p>
                  <div className="article-footer">
                    <div className="author">
                      <i className="fas fa-user"></i>
                      <span>{article.author}</span>
                    </div>
                    <Link to={`/news/${article.id}`} className="read-more">
                      Đọc tiếp
                      <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>Không tìm thấy bài viết</h3>
              <p>Không có bài viết nào phù hợp với từ khóa "{searchTerm}" trong danh mục "{selectedCategory === 'all' ? 'Tất cả' : selectedCategory}"</p>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <div className="newsletter-section">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h3>Đăng ký nhận tin</h3>
              <p>Nhận thông báo về bài viết mới và các tin tức cầu lông mới nhất</p>
            </div>
            <form className="newsletter-form">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                required
              />
              <button type="submit">
                <i className="fas fa-paper-plane"></i>
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;