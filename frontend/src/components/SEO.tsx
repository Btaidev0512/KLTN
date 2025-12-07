import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description = 'VNBSports - Cửa hàng cầu lông uy tín, chuyên cung cấp vợt cầu lông, giày cầu lông, phụ kiện chính hãng',
  keywords = 'cầu lông, vợt cầu lông, giày cầu lông, phụ kiện cầu lông, VNBSports',
  image = '/logo.png',
  url = window.location.href,
  type = 'website'
}) => {
  const siteTitle = 'VNBSports - Cửa Hàng Cầu Lông Chuyên Nghiệp';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Vietnamese" />
      <meta name="author" content="VNBSports" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default SEO;
