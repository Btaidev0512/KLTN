import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import '../../styles/HeroSection.css';

interface BannerSlide {
  banner_id: number;
  tag_text: string | null;
  tag_type: string | null;
  title: string;
  subtitle: string | null;
  button_text: string;
  button_link: string;
  background_gradient: string;
  background_image: string | null;
}

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);

  // Load banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await api.getActiveBanners();
        console.log('HeroSection banners:', response.data);
        if (response.data.data && response.data.data.length > 0) {
          setSlides(response.data.data);
        }
      } catch (error) {
        console.error('Error loading banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 5000); // Auto slide every 5 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, slides.length]);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  if (loading) {
    return (
      <section className="hero-banner-section" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="hero-banner-section" id="bannerCarousel">
      <div className="carousel-inner">
        {slides.map((slide, index) => {
          const hasImage = slide.background_image && slide.background_image.trim() !== '';

          return (
            <div
              key={slide.banner_id}
              className={`carousel-item ${index === currentSlide ? 'active' : ''}`}
              style={{
                background: !hasImage ? slide.background_gradient : undefined,
                display: index === currentSlide ? 'block' : 'none',
                position: 'relative'
              }}
            >
            {hasImage && (
              <img
                src={slide.background_image!}
                alt={slide.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0
                }}
                onError={(e) => {
                  console.error('Banner image failed to load:', slide.banner_id);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="carousel-overlay" style={{ position: 'relative', zIndex: 1 }}>
              <div className="container">
                <div className="row h-100 align-items-center">
                  <div className="col-lg-6">
                    <div className="banner-content">
                      {slide.tag_text && slide.tag_type && (
                        <div className="hero-sale-tag">
                          <span className="sale-text">{slide.tag_text}</span>
                          <span className="sale-percent">{slide.tag_type}</span>
                        </div>
                      )}
                      <h1 className="banner-title">
                        {slide.title.split(' ').map((word, i) => (
                          <React.Fragment key={i}>
                            {word}{' '}
                            {(i + 1) % 4 === 0 && <br />}
                          </React.Fragment>
                        ))}
                      </h1>
                      {slide.subtitle && (
                        <p className="banner-subtitle">{slide.subtitle}</p>
                      )}
                      <Link to={slide.button_link} className="banner-btn">
                        {slide.button_text}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button 
        className="carousel-control-prev" 
        onClick={handlePrev}
        aria-label="Previous slide"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true">‹</span>
      </button>
      <button 
        className="carousel-control-next" 
        onClick={handleNext}
        aria-label="Next slide"
      >
        <span className="carousel-control-next-icon" aria-hidden="true">›</span>
      </button>

      {/* Indicators */}
      <div className="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={index === currentSlide ? 'active' : ''}
            onClick={() => handleDotClick(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;