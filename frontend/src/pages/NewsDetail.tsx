import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/NewsDetail.css';

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
  tags: string[];
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample detailed article data
  const sampleArticle: NewsArticle = {
    id: parseInt(id || '1'),
    title: "Top 5 Vợt Cầu Lông Tốt Nhất Năm 2025",
    excerpt: "Khám phá những chiếc vợt cầu lông được đánh giá cao nhất trong năm với công nghệ tiên tiến và thiết kế tối ưu.",
    content: `
      <h2>Giới thiệu</h2>
      <p>Cầu lông là một trong những môn thể thao phổ biến nhất hiện nay, và việc chọn được một chiếc vợt phù hợp là vô cùng quan trọng để nâng cao hiệu suất thi đấu. Trong bài viết này, chúng tôi sẽ giới thiệu đến bạn top 5 vợt cầu lông tốt nhất năm 2025.</p>
      
      <h3>1. Yonex Arcsaber 11 Pro</h3>
      <p>Vợt cầu lông Yonex Arcsaber 11 Pro được đánh giá cao với công nghệ Sonic Metal và khung vợt siêu nhẹ. Thiết kế aerodynamic giúp tăng tốc độ cú đánh và độ chính xác.</p>
      
      <h3>2. Victor TK-Ryuga II</h3>
      <p>Victor TK-Ryuga II nổi bật với công nghệ Free Core Handle System và thiết kế độc đáo. Vợt này phù hợp cho người chơi thích lối đánh tấn công mạnh mẽ.</p>
      
      <h3>3. Lining Turbo Charging 75</h3>
      <p>Lining Turbo Charging 75 được thiết kế với công nghệ TB Nano và Dynamic-Optimum Frame. Vợt cung cấp sự cân bằng tuyệt vời giữa sức mạnh và kiểm soát.</p>
      
      <h3>4. Mizuno Fortius Tour-F</h3>
      <p>Mizuno Fortius Tour-F sử dụng công nghệ Hot Melt Technology và thiết kế Aero Frame. Vợt này mang lại cảm giác đánh mềm mại nhưng không kém phần mạnh mẽ.</p>
      
      <h3>5. Apacs Feather Weight X</h3>
      <p>Apacs Feather Weight X là lựa chọn tuyệt vời cho người mới bắt đầu với trọng lượng siêu nhẹ và giá thành hợp lý. Vợt được thiết kế để dễ sử dụng và kiểm soát.</p>
      
      <h2>Kết luận</h2>
      <p>Mỗi chiếc vợt đều có những đặc điểm riêng phù hợp với từng phong cách chơi. Hãy đến TT Shop để được tư vấn và trải nghiệm trực tiếp các sản phẩm này!</p>
    `,
    author: "Admin TT Shop",
    date: "2025-09-28",
    category: "Sản phẩm",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop",
    featured: true,
    views: 1250,
    tags: ["Vợt cầu lông", "Yonex", "Victor", "Lining", "Review"]
  };

  const sampleRelatedArticles: NewsArticle[] = [
    {
      id: 2,
      title: "Hướng Dẫn Chọn Giày Cầu Lông Phù Hợp",
      excerpt: "Làm thế nào để chọn được đôi giày cầu lông hoàn hảo cho phong cách chơi và bàn chân của bạn.",
      content: "",
      author: "Chuyên gia TT Shop",
      date: "2025-09-25",
      category: "Hướng dẫn",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop",
      featured: false,
      views: 890,
      tags: []
    },
    {
      id: 3,
      title: "Kỹ Thuật Đan Cước Vợt Cầu Lông Chuyên Nghiệp",
      excerpt: "Tìm hiểu về các kỹ thuật đan cước khác nhau và cách chúng ảnh hưởng đến hiệu suất thi đấu.",
      content: "",
      author: "Thầy Minh",
      date: "2025-09-22",
      category: "Kỹ thuật",
      image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=200&fit=crop",
      featured: true,
      views: 1456,
      tags: []
    }
  ];

  useEffect(() => {
    document.title = `${sampleArticle.title} - TT Shop`;
    
    // Simulate loading
    setTimeout(() => {
      setArticle(sampleArticle);
      setRelatedArticles(sampleRelatedArticles);
      setLoading(false);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  if (loading) {
    return (
      <div className="news-detail-page">
        <div className="container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="news-detail-page">
        <div className="container">
          <div className="not-found">
            <h2>Không tìm thấy bài viết</h2>
            <p>Bài viết bạn đang tìm kiếm không tồn tại.</p>
            <Link to="/news" className="back-to-news">
              <i className="fas fa-arrow-left"></i>
              Quay lại trang tin tức
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Trang chủ</Link> / 
          <Link to="/news">Tin tức</Link> / 
          <span>{article.title}</span>
        </div>

        <div className="news-detail-layout">
          {/* Main Content */}
          <article className="article-main">
            {/* Article Header */}
            <header className="article-header">
              <div className="article-meta-top">
                <div className="category-badge">{article.category}</div>
                {article.featured && (
                  <div className="featured-badge">
                    <i className="fas fa-star"></i>
                    Nổi bật
                  </div>
                )}
              </div>
              
              <h1 className="article-title">{article.title}</h1>
              
              <div className="article-meta">
                <div className="meta-item">
                  <i className="fas fa-user"></i>
                  <span>Tác giả: {article.author}</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-calendar"></i>
                  <span>{formatDate(article.date)}</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-eye"></i>
                  <span>{formatViews(article.views)} lượt xem</span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            <div className="article-image">
              <img src={article.image} alt={article.title} />
            </div>

            {/* Article Content */}
            <div className="article-content">
              <div className="content-excerpt">
                <p>{article.excerpt}</p>
              </div>
              
              <div 
                className="content-body"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="article-tags">
                <h4>Từ khóa:</h4>
                <div className="tags-list">
                  {article.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      <i className="fas fa-tag"></i>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Buttons */}
            <div className="article-share">
              <h4>Chia sẻ bài viết:</h4>
              <div className="share-buttons">
                <button className="share-btn facebook">
                  <i className="fab fa-facebook-f"></i>
                  Facebook
                </button>
                <button className="share-btn twitter">
                  <i className="fab fa-twitter"></i>
                  Twitter
                </button>
                <button className="share-btn linkedin">
                  <i className="fab fa-linkedin-in"></i>
                  LinkedIn
                </button>
                <button className="share-btn copy">
                  <i className="fas fa-link"></i>
                  Copy Link
                </button>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="article-sidebar">
            {/* Related Articles */}
            <div className="sidebar-widget">
              <h3 className="widget-title">
                <i className="fas fa-newspaper"></i>
                Bài viết liên quan
              </h3>
              <div className="related-articles">
                {relatedArticles.map(relatedArticle => (
                  <div key={relatedArticle.id} className="related-item">
                    <Link to={`/news/${relatedArticle.id}`}>
                      <div className="related-image">
                        <img src={relatedArticle.image} alt={relatedArticle.title} />
                      </div>
                      <div className="related-content">
                        <h4>{relatedArticle.title}</h4>
                        <div className="related-meta">
                          <span className="date">{formatDate(relatedArticle.date)}</span>
                          <span className="views">
                            <i className="fas fa-eye"></i>
                            {formatViews(relatedArticle.views)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="sidebar-widget newsletter-widget">
              <h3 className="widget-title">
                <i className="fas fa-envelope"></i>
                Đăng ký nhận tin
              </h3>
              <p>Nhận thông báo về bài viết mới và tin tức cầu lông</p>
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

            {/* Popular Articles */}
            <div className="sidebar-widget">
              <h3 className="widget-title">
                <i className="fas fa-fire"></i>
                Bài viết phổ biến
              </h3>
              <div className="popular-articles">
                {relatedArticles.map((popularArticle, index) => (
                  <div key={popularArticle.id} className="popular-item">
                    <div className="popular-rank">#{index + 1}</div>
                    <div className="popular-content">
                      <Link to={`/news/${popularArticle.id}`}>
                        <h5>{popularArticle.title}</h5>
                        <div className="popular-meta">
                          <span className="views">
                            <i className="fas fa-eye"></i>
                            {formatViews(popularArticle.views)}
                          </span>
                        </div>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Back to News */}
        <div className="back-to-news-section">
          <Link to="/news" className="back-to-news">
            <i className="fas fa-arrow-left"></i>
            Quay lại trang tin tức
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;