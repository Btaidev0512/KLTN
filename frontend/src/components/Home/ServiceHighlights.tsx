import React from 'react';
import '../../styles/ServiceHighlights.css';

interface Service {
  id: number;
  icon: React.ReactElement;
  title: string;
  description: string;
}

const ServiceHighlights: React.FC = () => {
  const services: Service[] = [
    {
      id: 1,
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 16V8C21 7.45 20.55 7 20 7H4C3.45 7 3 7.45 3 8V16C3 16.55 3.45 17 4 17H20C20.55 17 21 16.55 21 16Z" stroke="#E95211" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 10H21" stroke="#E95211" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 14H10" stroke="#E95211" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 4L16 7M6 4L8 7" stroke="#E95211" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="20" r="1.5" fill="#E95211"/>
          <circle cx="18" cy="20" r="1.5" fill="#E95211"/>
        </svg>
      ),
      title: 'Vận chuyển <span>TOÀN QUỐC</span>',
      description: 'Thanh toán khi nhận hàng'
    },
    {
      id: 2,
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" stroke="#E95211" strokeWidth="1.5"/>
          <path d="M8 12L11 15L16 9" stroke="#E95211" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" fill="#E95211" opacity="0.2"/>
        </svg>
      ),
      title: '<span>Bảo đảm chất lượng</span>',
      description: 'Sản phẩm bảo đảm chất lượng.'
    },
    {
      id: 3,
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="#E95211" strokeWidth="1.5"/>
          <path d="M3 10H21" stroke="#E95211" strokeWidth="1.5"/>
          <path d="M7 14H10" stroke="#E95211" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="17" cy="15" r="1" fill="#E95211"/>
        </svg>
      ),
      title: 'Tiến hành <span>THANH TOÁN</span>',
      description: 'Với nhiều <span>PHƯƠNG THỨC</span>'
    },
    {
      id: 4,
      icon: (
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#E95211" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#E95211" opacity="0.1"/>
        </svg>
      ),
      title: '<span>Đổi sản phẩm mới</span>',
      description: 'nếu sản phẩm lỗi'
    }
  ];

  return (
    <section className="service-highlights">
      <div className="container">
        <div className="row promo-box">
          {services.map((service) => (
            <div key={service.id} className="col-lg-3 col-md-3 col-sm-6 col-6">
              <div className="promo-item">
                <div className="icon">
                  {service.icon}
                </div>
                <div className="info">
                  <span dangerouslySetInnerHTML={{ __html: service.title }} />
                  <br />
                  <span dangerouslySetInnerHTML={{ __html: service.description }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceHighlights;
