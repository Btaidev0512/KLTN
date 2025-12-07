import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/SaleOff.css';

const SpecialOffers: React.FC = () => {
  const saleBanners = [
    {
      id: 1,
      title: 'Vợt Cầu Lông',
      image: 'https://cdn.shopvnb.com/img/406x136/uploads/danh_muc/3_2.webp',
      link: '/products?sale=true&category=vot-cau-long'
    },
    {
      id: 2,
      title: 'Giày Cầu Lông',
      image: 'https://cdn.shopvnb.com/img/406x136/uploads/danh_muc/2.webp',
      link: '/products?sale=true&category=giay-cau-long'
    },
    {
      id: 3,
      title: 'Áo Cầu Lông',
      image: 'https://cdn.shopvnb.com/img/406x136/uploads/danh_muc/1_3.webp',
      link: '/products?sale=true&category=ao-cau-long'
    }
  ];

  return (
    <section className="section-sale-off">
      <div className="container-sale">
        <div className="title-modules">
          <h2>
            <Link to="/products?sale=true" title="Sale Off">
              <span>Sale off</span>
            </Link>
          </h2>
        </div>
        <div className="row-sale">
          {saleBanners.map((banner) => (
            <div key={banner.id} className="col-sale">
              <div className="three-banner">
                <Link to={banner.link} title={banner.title}>
                  <img
                    width="406"
                    height="136"
                    src={banner.image}
                    alt={banner.title}
                    loading="lazy"
                  />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialOffers;