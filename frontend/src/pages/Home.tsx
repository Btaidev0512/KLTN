import React from 'react';
import HeroSection from '../components/Home/HeroSection';
import ServiceHighlights from '../components/Home/ServiceHighlights';
import NewProductsSection from '../components/Home/NewProductsSection';
import ProductCategories from '../components/Home/ProductCategories';
import SpecialOffers from '../components/Home/SpecialOffers';
import NewsSection from '../components/Home/NewsSection';
import BrandsSection from '../components/Home/BrandsSection';
import useAdminRedirect from '../hooks/useAdminRedirect';
import '../styles/Home.css';

const Home: React.FC = () => {
  // Show admin banner if logged in as admin
  useAdminRedirect();
  
  return (
    <div className="home-container" style={{backgroundColor: '#f9f9f9'}}>
      <HeroSection />
      <ServiceHighlights />
      <NewProductsSection />
      <ProductCategories />
      <SpecialOffers />
      <NewsSection />
      <BrandsSection />
    </div>
  );
};

export default Home;