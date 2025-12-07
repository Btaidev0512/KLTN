import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  placeholder?: string;
  effect?: 'blur' | 'opacity' | 'black-and-white';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  effect = 'blur',
  onClick,
  style
}) => {
  const defaultPlaceholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect width="400" height="400" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="20" fill="%23999"%3ELoading...%3C/text%3E%3C/svg%3E';

  // Debug log
  React.useEffect(() => {
    console.log('🖼️ LazyImage mounted:', { src, alt });
  }, [src, alt]);

  return (
    <LazyLoadImage
      src={src || defaultPlaceholder}
      alt={alt}
      className={className}
      width={width}
      height={height}
      placeholderSrc={placeholder || defaultPlaceholder}
      effect={effect}
      onClick={onClick}
      style={style}
      onError={(e: any) => {
        console.error('❌ Image load error:', src);
        e.target.src = defaultPlaceholder;
      }}
    />
  );
};

export default LazyImage;
