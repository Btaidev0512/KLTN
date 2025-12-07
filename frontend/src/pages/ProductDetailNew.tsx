import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import { addToRecentlyViewed } from '../utils/recentlyViewed';
import SEO from '../components/SEO';
import LazyImage from '../components/LazyImage';
import RecentlyViewed from '../components/RecentlyViewed';
import RelatedProducts from '../components/RelatedProducts';
import { PLACEHOLDER_IMAGE } from '../utils/constants';
import { toast } from 'react-toastify';
import '../styles/ProductDetailNew.css';

const ProductDetailNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [productAttributes, setProductAttributes] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Size-based variant system (no colors)
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [allProductImages, setAllProductImages] = useState<string[]>([]);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productSlug = id?.replace('.html', '');
        
        if (!productSlug) {
          setLoading(false);
          return;
        }

        const response = await api.getProductBySlug(productSlug);
        
        if (response.data.success) {
          const productData = response.data.data;
          
          const getImageUrl = (imageUrl: string | undefined): string => {
            if (!imageUrl) return PLACEHOLDER_IMAGE;
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
              return imageUrl;
            }
            const cleanPath = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
            return `http://localhost:5000${cleanPath}`;
          };
          
          const imageUrlToUse = productData.image_url || productData.product_image;
          
          // Primary image
          const images = [getImageUrl(imageUrlToUse)];
          
          setProduct({
            id: productData.product_id,
            name: productData.product_name,
            price: productData.final_price || productData.sale_price || productData.base_price,
            originalPrice: productData.base_price,
            discountPercentage: productData.discount_percentage || 0,
            images: images,
            description: productData.description || 'Chưa có mô tả cho sản phẩm này.',
            specifications: [
              { label: 'Thương hiệu', value: productData.brand_name || 'N/A' },
              { label: 'Danh mục', value: productData.category_name || 'N/A' },
              { label: 'SKU', value: productData.sku || 'N/A' },
            ],
            slug: productData.product_slug,
            category_id: productData.category_id,
            category_name: productData.category_name,
            inStock: productData.status === 'active' && (productData.stock_quantity > 0 || productData.continue_selling_when_out_of_stock),
            stockQuantity: productData.stock_quantity || 0,
            soldCount: productData.sold_count || productData.total_sold || 0
          });
          
          // Track recently viewed
          addToRecentlyViewed({
            product_id: productData.product_id,
            product_name: productData.product_name,
            product_slug: productData.product_slug,
            base_price: productData.base_price,
            sale_price: productData.sale_price,
            image_url: getImageUrl(imageUrlToUse)
          });
          
          loadProductAttributes(productData.product_id);
          loadReviews(productData.product_id);
          loadReviewStats(productData.product_id);
          loadVariants(productData.product_id, productData.category_id);
          loadAllImages(productData.product_id);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const loadVariants = async (productId: number, categoryId?: number) => {
    try {
      const response = await api.getProductVariants(productId);
      if (response.data.success) {
        let variantList = response.data.data || [];
        
        console.log('🔍 Loading variants for product:', productId, 'Category:', categoryId);
        console.log('📦 Variants from API:', variantList);
        
        // For shoes (category_id = 2), auto-generate sizes 36-43
        if (categoryId === 2) {
          console.log('👟 This is a SHOE product, generating sizes 36-43...');
          const shoeSizes = ['36', '37', '38', '39', '40', '41', '42', '43'];
          const mergedVariants = shoeSizes.map(size => {
            // Find existing variant for this size
            const existingVariant = variantList.find((v: any) => v.size === size);
            
            if (existingVariant) {
              console.log(`  ✅ Size ${size}: FOUND in DB (stock: ${existingVariant.stock_quantity})`);
              return existingVariant;
            } else {
              console.log(`  ❌ Size ${size}: NOT FOUND, creating placeholder`);
              return {
                variant_id: `placeholder-${size}`,
                size: size,
                stock_quantity: 0,
                sku: `SHOE-${size}`,
                is_active: false
              };
            }
          });
          
          variantList = mergedVariants;
          console.log('👟 Final shoe variants:', variantList);
        } 
        // For clothes (Áo=3, Quần=4, Váy=5), auto-generate sizes M, L, XL, 2XL
        else if (categoryId === 3 || categoryId === 4 || categoryId === 5) {
          const categoryNames: { [key: number]: string } = {
            3: 'ÁO (Áo cầu lông)',
            4: 'QUẦN (Quần cầu lông)',
            5: 'VÁY (Váy cầu lông)'
          };
          const categoryName = categoryNames[categoryId] || 'CLOTHES';
          
          console.log(`👕 This is a ${categoryName} product, generating sizes M, L, XL, 2XL...`);
          const clothesSizes = ['M', 'L', 'XL', '2XL'];
          const mergedVariants = clothesSizes.map(size => {
            // Find existing variant for this size
            const existingVariant = variantList.find((v: any) => v.size === size);
            
            if (existingVariant) {
              console.log(`  ✅ Size ${size}: FOUND in DB (stock: ${existingVariant.stock_quantity})`);
              return existingVariant;
            } else {
              console.log(`  ❌ Size ${size}: NOT FOUND, creating placeholder`);
              return {
                variant_id: `placeholder-${size}`,
                size: size,
                stock_quantity: 0,
                sku: `CLOTHES-${size}`,
                is_active: false
              };
            }
          });
          
          variantList = mergedVariants;
          console.log(`👕 Final ${categoryName} variants:`, variantList);
        } 
        else {
          console.log('🎾 Not a shoe/clothes product, using original variants');
        }
        
        setVariants(variantList);
        
        // Auto-select first variant with stock
        const firstAvailable = variantList.find((v: any) => v.stock_quantity > 0) || variantList[0];
        if (firstAvailable && firstAvailable.stock_quantity > 0) {
          setSelectedSize(firstAvailable.size);
          setSelectedVariant(firstAvailable);
        }
      }
    } catch (error) {
      console.log('No variants for this product');
      setVariants([]);
    }
  };

  const loadAllImages = async (productId: number) => {
    try {
      const response = await api.getProductImages(productId);
      if (response.data.success) {
        const imageList = response.data.data || [];
        const additionalImages = imageList.map((img: any) => {
          const url = img.image_url;
          if (url.startsWith('http')) return url;
          return `http://localhost:5000${url.startsWith('/') ? url : '/' + url}`;
        });
        
        // Merge với ảnh primary từ products.image_url
        setProduct((prev: any) => {
          if (!prev) return prev;
          
          const primaryImage = prev.images && prev.images[0];
          
          // Nếu không có ảnh additional, giữ nguyên primary
          if (additionalImages.length === 0) {
            return prev;
          }
          
          // Merge: primary image + additional images (loại bỏ duplicate)
          const allImages = primaryImage
            ? [primaryImage, ...additionalImages.filter((img: string) => img !== primaryImage)]
            : additionalImages;
          
          setAllProductImages(allImages);
          
          return {
            ...prev,
            images: allImages
          };
        });
      }
    } catch (error) {
      console.log('No additional images for this product');
    }
  };

  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
    const variant = variants.find(v => v.size === size);
    setSelectedVariant(variant);
  };

  // Auto-generate size options based on category
  const generateSizeOptions = (categoryId: number, stockQuantity: number) => {
    let sizeList: string[] = [];
    
    switch(categoryId) {
      case 2: // Giày
        sizeList = ['36', '37', '38', '39', '40', '41', '42', '43'];
        break;
      case 3: // Áo
      case 4: // Quần
      case 5: // Váy
        sizeList = ['M', 'L', 'XL', '2XL'];
        break;
      default:
        return [];
    }
    
    // Create variant objects with stock info
    // Since we don't have size-specific stock, use product's stock_quantity
    return sizeList.map((size, index) => ({
      variant_id: `auto-${index}`,
      size: size,
      stock_quantity: stockQuantity, // All sizes share same stock
      sku: `auto-${size}`,
      is_auto_generated: true
    }));
  };

  const loadProductAttributes = async (productId: number) => {
    try {
      const response = await api.productAttributes.getProductAttributes(productId);
      if (response.data.success) {
        const attrs = response.data.data || [];
        setProductAttributes(attrs);
      }
    } catch (error) {
      console.log('No attributes for this product');
    }
  };

  const loadReviews = async (productId: number) => {
    try {
      const response = await api.getProductReviews(productId);
      console.log('📥 Reviews response:', response.data);
      if (response.data.success) {
        const reviewsData = response.data.data?.reviews || response.data.data || [];
        console.log('✅ Loaded reviews:', reviewsData.length, reviewsData);
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('❌ Error loading reviews:', error);
    }
  };

  const loadReviewStats = async (productId: number) => {
    try {
      const response = await api.getReviewStats(productId);
      console.log('📊 Review stats response:', response.data);
      if (response.data.success) {
        const stats = response.data.data;
        console.log('✅ Review stats loaded:', stats);
        setReviewStats(stats);
      }
    } catch (error) {
      console.error('❌ Error loading review stats:', error);
    }
  };

  const handlePrevImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (product && product.images) {
      setSelectedImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Handle submit review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      toast.error('Vui lòng chọn số sao từ 1 đến 5');
      return;
    }

    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      toast.error('Nội dung đánh giá phải có ít nhất 10 ký tự');
      return;
    }

    try {
      setSubmittingReview(true);

      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Vui lòng đăng nhập để gửi đánh giá');
        setSubmittingReview(false);
        return;
      }

      // Debug: Check product object
      console.log('🔍 Product object:', product);
      console.log('🔍 Product ID:', product?.id, 'Type:', typeof product?.id);

      if (!product || !product.id) {
        toast.error('Không tìm thấy thông tin sản phẩm');
        setSubmittingReview(false);
        return;
      }

      const requestBody = {
        product_id: parseInt(product.id),
        rating: reviewRating, // Đã là number rồi, không cần parseInt
        comment: reviewComment.trim()
      };

      console.log('📤 Sending review request:', requestBody);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('📥 Review response:', { status: response.status, data });
      console.log('📥 Full response data:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        toast.success('Đánh giá của bạn đã được gửi và đang chờ Admin duyệt. Cảm ơn bạn!', {
          autoClose: 5000
        });
        
        // Reset form
        setReviewRating(5);
        setReviewComment('');

        // Chuyển sang tab đánh giá để user thấy danh sách review
        setActiveTab('reviews');
        
        // Tải lại danh sách đánh giá mà không cần reload trang
        // Lưu ý: Đánh giá mới sẽ KHÔNG hiển thị vì is_approved = 0
        if (product?.id) {
          loadReviews(product.id);
          loadReviewStats(product.id);
        }
        
        // Scroll lên phần đánh giá
        const reviewsSection = document.getElementById('reviews-section');
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // Show detailed error
        const errorMsg = data.message || 'Có lỗi xảy ra khi gửi đánh giá';
        const errorDetails = data.errors ? data.errors.map((e: any) => e.msg).join(', ') : '';
        console.error('❌ Review submission failed:', { errorMsg, errorDetails, fullData: data });
        toast.error(errorDetails ? `${errorMsg}: ${errorDetails}` : errorMsg);
      }

    } catch (error: any) {
      console.error('❌ Error submitting review:', error);
      toast.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại!');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddToCart = async () => {
    // Validation cho sản phẩm CÓ VARIANTS (size)
    if (variants.length > 0) {
      // Kiểm tra đã chọn size chưa
      if (!selectedSize) {
        alert('⚠️ Vui lòng chọn kích cỡ trước khi thêm vào giỏ hàng!');
        return;
      }
      
      // Kiểm tra size còn hàng không
      const selectedVariantData = variants.find(v => v.size === selectedSize);
      if (!selectedVariantData || selectedVariantData.stock_quantity === 0) {
        alert('❌ Kích cỡ này hiện đã hết hàng. Vui lòng chọn kích cỡ khác!');
        return;
      }
      
      // Kiểm tra số lượng còn đủ không
      if (quantity > selectedVariantData.stock_quantity) {
        alert(`⚠️ Kích cỡ này chỉ còn ${selectedVariantData.stock_quantity} sản phẩm. Vui lòng giảm số lượng!`);
        return;
      }
    } 
    // Validation cho sản phẩm KHÔNG CÓ VARIANTS (sản phẩm thông thường)
    else {
      // Kiểm tra sản phẩm còn hàng không
      if (!product.inStock || product.stockQuantity === 0) {
        alert('❌ Sản phẩm này hiện đã hết hàng!');
        return;
      }
      
      // Kiểm tra số lượng còn đủ không
      if (quantity > product.stockQuantity) {
        alert(`⚠️ Sản phẩm chỉ còn ${product.stockQuantity} cái. Vui lòng giảm số lượng!`);
        return;
      }
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      const goToLogin = window.confirm('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng. Chuyển đến trang đăng nhập?');
      if (goToLogin) {
        window.location.href = '/login';
      }
      return;
    }

    try {
      const response = await api.addToCart(product.id, quantity);
      
      if (response.data.success) {
        window.dispatchEvent(new Event('cartUpdated'));
        
        const viewCart = window.confirm(`✅ Đã thêm ${quantity} sản phẩm vào giỏ hàng!\n\nBạn có muốn xem giỏ hàng không?`);
        if (viewCart) {
          window.location.href = '/cart';
        }
      }
    } catch (error: any) {
      console.error('Add to cart error:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('❌ Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleBuyNow = async () => {
    // Validation cho sản phẩm CÓ VARIANTS (size)
    if (variants.length > 0) {
      // Kiểm tra đã chọn size chưa
      if (!selectedSize) {
        alert('⚠️ Vui lòng chọn kích cỡ trước khi mua!');
        return;
      }
      
      // Kiểm tra size còn hàng không
      const selectedVariantData = variants.find(v => v.size === selectedSize);
      if (!selectedVariantData || selectedVariantData.stock_quantity === 0) {
        alert('❌ Kích cỡ này hiện đã hết hàng. Vui lòng chọn kích cỡ khác!');
        return;
      }
      
      // Kiểm tra số lượng còn đủ không
      if (quantity > selectedVariantData.stock_quantity) {
        alert(`⚠️ Kích cỡ này chỉ còn ${selectedVariantData.stock_quantity} sản phẩm. Vui lòng giảm số lượng!`);
        return;
      }
    } 
    // Validation cho sản phẩm KHÔNG CÓ VARIANTS (sản phẩm thông thường)
    else {
      // Kiểm tra sản phẩm còn hàng không
      if (!product.inStock || product.stockQuantity === 0) {
        alert('❌ Sản phẩm này hiện đã hết hàng!');
        return;
      }
      
      // Kiểm tra số lượng còn đủ không
      if (quantity > product.stockQuantity) {
        alert(`⚠️ Sản phẩm chỉ còn ${product.stockQuantity} cái. Vui lòng giảm số lượng!`);
        return;
      }
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      const goToLogin = window.confirm('Bạn cần đăng nhập để mua hàng. Chuyển đến trang đăng nhập?');
      if (goToLogin) {
        // Lưu URL hiện tại để redirect về sau khi login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/login';
      }
      return;
    }

    try {
      // Thêm sản phẩm vào giỏ hàng
      const response = await api.addToCart(product.id, quantity);
      
      if (response.data.success) {
        // Cập nhật số lượng giỏ hàng
        window.dispatchEvent(new Event('cartUpdated'));
        
        // Chuyển trực tiếp đến trang giỏ hàng
        window.location.href = '/cart';
      }
    } catch (error: any) {
      console.error('Buy now error:', error);
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        alert('❌ Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="sec-prddt mt-50">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Đang tải thông tin sản phẩm...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="sec-prddt mt-50">
        <div className="container">
          <div className="loading-container">
            <h2>Không tìm thấy sản phẩm</h2>
            <Link to="/" className="btn">Quay lại trang chủ</Link>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = reviewStats?.average_rating || reviewStats?.statistics?.average_rating || 0;
  const totalReviews = reviewStats?.total_reviews || reviewStats?.statistics?.total_reviews || 0;

  return (
    <>
      <SEO 
        title={product.name}
        description={product.description.substring(0, 160)}
        keywords={`${product.name}, ${product.category_name}, cầu lông, VNBSports`}
        image={product.images[0]}
        type="product"
      />

      {/* Breadcrumb */}
      <div className="breadcrumb-container">
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">Trang chủ</Link>
            <span className="separator">›</span>
            <Link to="/products">Sản phẩm</Link>
            <span className="separator">›</span>
            <span>{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="sec-prddt">
        <div className="container">
          <div className="prddt-wrap">
            <form id="frmAddProduct">
              <div className="prddt-flex">
                {/* Product Gallery Left */}
                <div className="prddt-left">
                  <div className="monaGalleryProduct">
                    <div className="prddt-slider">
                      {/* Main Image */}
                      <div className="prddt-slider-main gallery">
                        <div className="prddt-slider-img">
                          <div className="inner gItem" data-src={product.images[selectedImageIndex]}>
                            <LazyImage 
                              src={product.images[selectedImageIndex]} 
                              alt={product.name}
                              effect="blur"
                            />
                          </div>
                        </div>
                        
                        {/* Navigation Buttons */}
                        <div className="btn-ctr cbtn-next" onClick={handleNextImage}>
                          <div className="btn-ctr-inner">
                            <span className="icon">
                              <i className="fa-solid fa-chevron-right"></i>
                            </span>
                          </div>
                        </div>
                        <div className="btn-ctr cbtn-prev" onClick={handlePrevImage}>
                          <div className="btn-ctr-inner">
                            <span className="icon">
                              <i className="fa-solid fa-chevron-left"></i>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Thumbnail Images */}
                      <div className="prddt-slider-thumb">
                        <div className="thumb-wrapper">
                          {product.images.map((image: string, index: number) => (
                            <div 
                              className={`prddt-slider-img ${index === selectedImageIndex ? 'active' : ''}`} 
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="inner">
                                <LazyImage 
                                  src={image} 
                                  alt={`Thumb ${index + 1}`}
                                  effect="blur"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branch Stock Info - Desktop Only */}
                  <div className="prddt-perti desktop-only">
                    <div className="prddt-prd-brand">
                      <div className="prddt-prd-brand-py">
                        <div className="prddt-prd-brand-bl">
                          <div className="prddt-prd-brand-head">
                            <span className="icon">
                              <i className="fa-solid fa-location-dot"></i>
                            </span>
                            <span className="text">Các chi nhánh còn hàng</span>
                          </div>
                          <div className="prddt-prd-brand-gr">
                            <p className="ttext">
                              Xem <span className="fw-7 c-second">11 chi nhánh</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Info Right */}
                <div className="prddt-right">
                  <div className="prddt-prd">
                    {/* Compare & Stock - Mobile */}
                    <div className="compare-right-cus mobile-custom">
                      <div className="prddt-prd-tag">
                        <div className={`prd-card-status ${product.inStock ? 't-have-prd' : 't-out-of-stock'}`}>
                          <i className={`fa-solid ${product.inStock ? 'fa-check' : 'fa-times'}`}></i> 
                          {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                        </div>
                      </div>
                    </div>

                    {/* Product Title */}
                    <div className="prddt-prd-title">
                      <h1 className="t-title">{product.name}</h1>
                    </div>

                    {/* Rating & Reviews */}
                    <div className="prddt-prd-fb">
                      <div className="prddt-prd-fb-star">
                        <i className="fas fa-star" style={{ color: '#ffc107', fontSize: '18px', marginRight: '5px' }}></i>
                        <span className="tnum">{averageRating.toFixed(1)}</span>
                        <div className="star">
                          <div className="star-list">
                            <div className="star-flex star-empty">
                              {[1, 2, 3, 4, 5].map(star => (
                                <img key={star} src="https://static.fbshop.vn/template/assets/images/Star-fill.svg" alt="" className="icon" />
                              ))}
                            </div>
                            <div className="star-flex star-filter" style={{ width: `${(averageRating / 5) * 100}%` }}>
                              {[1, 2, 3, 4, 5].map(star => (
                                <img key={star} src="https://static.fbshop.vn/template/assets/images/Star.svg" alt="" className="icon" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="prddt-prd-fb-tnum">
                        <span className="fw-7">{totalReviews}</span>
                        <span className="t14 c-text">đánh giá</span>
                      </div>
                      <div className="prddt-prd-fb-tnum">
                        <span className="fw-7">{product.soldCount || 0}</span>
                        <span className="t14 c-text">lượt mua</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="prddt-prd-block">
                      <div className="prddt-prd-ctn">
                        <div className="prddt-prd-price">
                          <div className="prddt-prd-price-box">
                            <span className="price-new">
                              <p className="price-new-simple">
                                {formatPrice(product.price)}
                              </p>
                            </span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <span className="price-old" style={{
                                marginLeft: '12px',
                                fontSize: '18px',
                                color: '#999',
                                textDecoration: 'line-through'
                              }}>
                                {formatPrice(product.originalPrice)}
                              </span>
                            )}
                            {product.discountPercentage > 0 && (
                              <span className="discount-badge" style={{
                                marginLeft: '12px',
                                backgroundColor: '#FF6B35',
                                color: '#fff',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '14px',
                                fontWeight: '700'
                              }}>
                                -{product.discountPercentage}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Size Selector (New System) */}
                        {variants.length > 0 && (
                          <div className="prddt-prd-variants" style={{ marginTop: '20px', marginBottom: '20px' }}>
                            {/* Size Selection */}
                            <div className="variant-group" style={{ marginBottom: '15px' }}>
                              <label className="variant-label" style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontWeight: '600',
                                fontSize: '14px',
                                color: '#333'
                              }}>
                                Kích cỡ:
                              </label>
                              <div className="variant-options" style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                flexWrap: 'wrap' 
                              }}>
                                {variants.map((variant: any) => (
                                  <label
                                    key={variant.variant_id}
                                    htmlFor={`size-${variant.size}`}
                                    style={{
                                      display: 'inline-block',
                                      fontWeight: 'normal',
                                      minWidth: '50px',
                                      height: '30px',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: selectedSize === variant.size ? '2px solid #E95211' : '1px solid #ebebeb',
                                      cursor: variant.stock_quantity === 0 ? 'not-allowed' : 'pointer',
                                      whiteSpace: 'nowrap',
                                      position: 'relative',
                                      marginBottom: '0',
                                      textAlign: 'center',
                                      borderRadius: '5px',
                                      lineHeight: '30px',
                                      padding: '0 10px',
                                      backgroundColor: selectedSize === variant.size ? '#FFF5F2' : 'white',
                                      transition: 'all 0.2s',
                                      opacity: variant.stock_quantity === 0 ? 0.6 : 1,
                                      pointerEvents: variant.stock_quantity === 0 ? 'none' : 'auto'
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      id={`size-${variant.size}`}
                                      name="product-size"
                                      value={variant.size}
                                      checked={selectedSize === variant.size}
                                      onChange={() => handleSizeChange(variant.size)}
                                      disabled={variant.stock_quantity === 0}
                                      style={{ display: 'none' }}
                                    />
                                    {selectedSize === variant.size && (
                                      <i className="icon-check" style={{
                                        display: 'inline-block',
                                        marginRight: '4px',
                                        color: '#E95211',
                                        fontStyle: 'normal',
                                        fontSize: '12px'
                                      }}>✓</i>
                                    )}
                                    <span className="ten_size" style={{
                                      fontSize: '14px',
                                      color: selectedSize === variant.size ? '#E95211' : '#333e44',
                                      fontWeight: selectedSize === variant.size ? '600' : 'normal'
                                    }}>
                                      {variant.size}
                                    </span>
                                    {variant.stock_quantity === 0 && (
                                      <img 
                                        className="crossed-out" 
                                        src="https://cdn.shopvnb.com/themes_new/images/soldout.png" 
                                        alt="Sold out"
                                        style={{
                                          position: 'absolute',
                                          top: '0',
                                          left: '0',
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                          pointerEvents: 'none'
                                        }}
                                      />
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Removed: Selected Variant Info section with SKU and stock quantity */}
                          </div>
                        )}

                        {/* Quantity Selector */}
                        <div className="prddt-prd-count">
                          <div className="prddt-prd-count-gr">
                            <span className="ttext">Số lượng:</span>
                            <div className="count">
                              <div 
                                className="count-btn count-minus"
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              >
                                <i className="fas fa-minus icon"></i>
                              </div>
                              <input 
                                type="text" 
                                value={quantity} 
                                className="count-input" 
                                readOnly
                              />
                              <p className="count-number">{quantity.toString().padStart(2, '0')}</p>
                              <div 
                                className="count-btn count-plus"
                                onClick={() => setQuantity(quantity + 1)}
                              >
                                <i className="fas fa-plus icon"></i>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Add to Cart Buttons */}
                        <div className="prddt-prd-control">
                          <div 
                            className={`btn trans ${
                              // Disable nếu có variants nhưng chưa chọn size hoặc size hết hàng
                              (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                              // Disable nếu không có variants nhưng sản phẩm hết hàng
                              (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                ? 'disabled' 
                                : ''
                            }`}
                            onClick={handleAddToCart}
                            style={{
                              opacity: 
                                (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                                (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                  ? 0.5 : 1,
                              cursor: 
                                (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                                (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                  ? 'not-allowed' : 'pointer',
                              pointerEvents: 
                                (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                                (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                  ? 'none' : 'auto'
                            }}
                          >
                            <div className="btn-inner">
                              <span className="text">
                                {/* Hiển thị text dựa vào trạng thái */}
                                {variants.length > 0 && !selectedSize 
                                  ? 'Chọn kích cỡ' 
                                  : (variants.length > 0 && !variants.find(v => v.size === selectedSize && v.stock_quantity > 0)) ||
                                    (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                    ? 'Hết hàng'
                                    : 'Thêm vào giỏ'
                                }
                              </span>
                            </div>
                          </div>
                          <div 
                            className={`btn m-buy-now ${
                              // Disable nếu có variants nhưng chưa chọn size hoặc size hết hàng
                              (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                              // Disable nếu không có variants nhưng sản phẩm hết hàng
                              (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                ? 'disabled' 
                                : ''
                            }`}
                            onClick={handleBuyNow}
                            style={{
                              opacity: 
                                (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                                (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                  ? 0.5 : 1,
                              cursor: 
                                (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                                (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                  ? 'not-allowed' : 'pointer',
                              pointerEvents: 
                                (variants.length > 0 && (!selectedSize || !variants.find(v => v.size === selectedSize && v.stock_quantity > 0))) ||
                                (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                  ? 'none' : 'auto'
                            }}
                          >
                            <div className="btn-inner">
                              <span className="icon">
                                <i className="fa-solid fa-cart-shopping"></i>
                              </span>
                              <span className="text">
                                {/* Hiển thị text dựa vào trạng thái */}
                                {variants.length > 0 && !selectedSize 
                                  ? 'Chọn kích cỡ' 
                                  : (variants.length > 0 && !variants.find(v => v.size === selectedSize && v.stock_quantity > 0)) ||
                                    (variants.length === 0 && (!product.inStock || product.stockQuantity === 0))
                                    ? 'Hết hàng'
                                    : 'Mua ngay'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gift Section */}
                  <div className="prddt-gift">
                    <div className="prddt-gift-box">
                      <div className="prddt-gift-dcor">
                        <img src="https://static.fbshop.vn/template/assets/images/prddt-gift-dcor.png" alt="" />
                      </div>
                      <span className="t-tag">Ưu đãi</span>
                      <div className="prddt-gift-list">
                        <div className="prddt-gift-item">
                          <div className="inner">
                            <span className="icon">
                              <img width="24" height="24" src="https://static.fbshop.vn/wp-content/uploads/2023/08/icon-cate-hot.png" alt="" />
                            </span>
                            <span className="text">Tặng bao nhung/bao đơn bảo vệ vợt cầu lông</span>
                          </div>
                        </div>
                        <div className="prddt-gift-item">
                          <div className="inner">
                            <span className="icon">
                              <img width="24" height="24" src="https://static.fbshop.vn/wp-content/uploads/2023/08/icon-cate-hot.png" alt="" />
                            </span>
                            <span className="text">Tặng quấn cán vợt cầu lông</span>
                          </div>
                        </div>
                        <div className="prddt-gift-item">
                          <div className="inner">
                            <span className="icon">
                              <img width="37" height="36" src="https://static.fbshop.vn/wp-content/uploads/2023/08/step-icon5.png" alt="" />
                            </span>
                            <span className="text">Freeship khi chuyển khoản trước với đơn hàng trên 1 triệu</span>
                          </div>
                        </div>
                        <div className="prddt-gift-item">
                          <div className="inner">
                            <span className="icon">
                              <img width="20" height="20" src="https://static.fbshop.vn/wp-content/uploads/2023/08/ft-pay-icon.png" alt="" />
                            </span>
                            <span className="text">Yên tâm với quy trình nhận hàng kiểm tra trước thanh toán sau</span>
                          </div>
                        </div>
                        <div className="prddt-gift-item">
                          <div className="inner">
                            <span className="icon">
                              <img width="24" height="24" src="https://static.fbshop.vn/wp-content/uploads/2023/08/icon-cate-new.png" alt="" />
                            </span>
                            <span className="text">Bảo hành vợt 90 ngày lỗi 1 đổi 1 lỗi nhà sản xuất</span>
                          </div>
                        </div>
                        <div className="prddt-gift-item">
                          <div className="inner">
                            <span className="icon">
                              <img width="24" height="24" src="https://static.fbshop.vn/wp-content/uploads/2023/08/icon-cate-tag.png" alt="" />
                            </span>
                            <span className="text">Cơ hội nhận voucher cho các đơn hàng tiếp theo</span>
                          </div>
                        </div>
                        <div className="prddt-gift-item">
                          <div className="inner">
                            <span className="icon">
                              <img width="36" height="36" src="https://static.fbshop.vn/wp-content/uploads/2023/08/step-icon2.png" alt="" />
                            </span>
                            <span className="text">Vô vàn dịch vụ hỗ trợ miễn phí khác</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="tabJS pdp-tab mt-100">
          <div className="pdp-tab-main">
            <div className="pdp-tab-list">
              <div 
                className={`tabBtn pdp-tab-list-item t24 fw-7 ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Mô tả sản phẩm
              </div>
              <div 
                className={`tabBtn pdp-tab-list-item t24 fw-7 ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
              >
                Thông số kỹ thuật
              </div>
              <div 
                className={`tabBtn pdp-tab-list-item t24 fw-7 ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Đánh giá<br />
                {totalReviews} <span className="t16 fw-7 rate-number">
                  <span className="icon-star">
                    <i className="fa-solid fa-star"></i>
                  </span>
                </span>
              </div>
            </div>

            <div className="pdp-tab-inner">
              {/* Description Tab */}
              <div className={`pdp-tabPanel tabPanel ${activeTab === 'description' ? 'open' : ''}`}>
                <div className="pdp-tabPanel-content">
                  <div className="left mona-content">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{product.description}</p>
                  </div>
                </div>
              </div>

              {/* Specifications Tab */}
              <div className={`pdp-tabPanel tabPanel ${activeTab === 'specifications' ? 'open' : ''}`}>
                <div className="pdp-tabPanel-content mona-content x2">
                  <div className="left">
                    <div className="text t16 fw-4">
                      <table className="specifications-table">
                        <tbody>
                          {product.specifications.map((spec: any, index: number) => (
                            <tr key={index}>
                              <td><strong>{spec.label}:</strong></td>
                              <td>{spec.value}</td>
                            </tr>
                          ))}
                          {productAttributes.map((attr: any, index: number) => (
                            <tr key={`attr-${index}`}>
                              <td><strong>{attr.attribute_name}:</strong></td>
                              <td>{attr.value_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Tab */}
              <div className={`pdp-tabPanel tabPanel ${activeTab === 'reviews' ? 'open' : ''}`}>
                <div className="pdp-tabPanel-content x3">
                  <div className="rate">
                    <div className="rate-wrap">
                      <div className="cmts-inner rate-inner p-0 mt-24">
                        <div className="cmts-inner rate-inner hasrate p-0">
                          <div className="cmts-block">
                            {/* Reviews List */}
                            <div id="m_comment_list">
                              <ul className="comment_list">
                                {reviews.length > 0 ? (
                                  reviews.map((review) => (
                                    <li key={review.review_id} className="comment-item">
                                      <div className="comment-wrap">
                                        <div className="comment-author">
                                          <strong>{review.reviewer_name || 'Người dùng'}</strong>
                                          <div className="comment-rating">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <i key={star} className={`fas fa-star ${star <= review.rating ? '' : 'far'}`}></i>
                                            ))}
                                          </div>
                                        </div>
                                        {review.title && <h4 className="comment-title">{review.title}</h4>}
                                        <p className="comment-text">{review.comment}</p>
                                        <div className="comment-date">
                                          <i className="far fa-clock"></i>{' '}
                                          {new Date(review.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                        {review.is_verified === 1 && (
                                          <span className="verified-badge" style={{ color: '#28a745', fontSize: '12px', marginTop: '5px', display: 'inline-block' }}>
                                            ✓ Đã mua hàng
                                          </span>
                                        )}
                                      </div>
                                    </li>
                                  ))
                                ) : (
                                  <div className="cmts-top rate-top">
                                    <p className="c-second t24 fw-7">Chưa có đánh giá</p>
                                    <p className="c-text">Hiện chưa có đánh giá nào cho sản phẩm này.</p>
                                    <div className="icon mt-30">
                                      <img src="https://static.fbshop.vn/template/assets/images/icon-quote.png" alt="" />
                                    </div>
                                  </div>
                                )}
                              </ul>
                            </div>

                            {/* Review Form */}
                            <div className="cmts-mid rate-mid mt-50" id="review-form">
                              <div className="cmts-ctn rate-ctn">
                                <p className="t24 c-second fw-7">Đánh giá sản phẩm</p>
                                <p className="mt-10">Hãy chia sẻ những điều bạn nghĩ về sản phẩm này với những người mua khác nhé.</p>
                                <br />
                                <form onSubmit={handleSubmitReview}>
                                  <span className="rate-subtitle fw-7 t16">
                                    <span>Chất lượng sản phẩm</span>
                                    <div className="feedback ml-1">
                                      <div className="rating">
                                        <input 
                                          type="radio" 
                                          name="rating" 
                                          id="star-rating-5" 
                                          value="5"
                                          checked={reviewRating === 5}
                                          onChange={(e) => setReviewRating(Number(e.target.value))}
                                        />
                                        <label htmlFor="star-rating-5"></label>
                                        <input 
                                          type="radio" 
                                          name="rating" 
                                          id="star-rating-4" 
                                          value="4"
                                          checked={reviewRating === 4}
                                          onChange={(e) => setReviewRating(Number(e.target.value))}
                                        />
                                        <label htmlFor="star-rating-4"></label>
                                        <input 
                                          type="radio" 
                                          name="rating" 
                                          id="star-rating-3" 
                                          value="3"
                                          checked={reviewRating === 3}
                                          onChange={(e) => setReviewRating(Number(e.target.value))}
                                        />
                                        <label htmlFor="star-rating-3"></label>
                                        <input 
                                          type="radio" 
                                          name="rating" 
                                          id="star-rating-2" 
                                          value="2"
                                          checked={reviewRating === 2}
                                          onChange={(e) => setReviewRating(Number(e.target.value))}
                                        />
                                        <label htmlFor="star-rating-2"></label>
                                        <input 
                                          type="radio" 
                                          name="rating" 
                                          id="star-rating-1" 
                                          value="1"
                                          checked={reviewRating === 1}
                                          onChange={(e) => setReviewRating(Number(e.target.value))}
                                        />
                                        <label htmlFor="star-rating-1"></label>
                                      </div>
                                    </div>
                                  </span>
                                  <div className="cmts-form rate-form mt-30">
                                    <div className="cmts-form-gr rate-form-gr">
                                      <div className="ip-control">
                                        <label className="t-label">
                                          Đánh giá của bạn <span className="c-third">*</span>
                                        </label>
                                        <textarea 
                                          placeholder="Viết đánh giá (tối thiểu 10 ký tự)" 
                                          name="comment"
                                          value={reviewComment}
                                          onChange={(e) => setReviewComment(e.target.value)}
                                          required
                                          minLength={10}
                                          rows={5}
                                        ></textarea>
                                      </div>
                                    </div>
                                    <div className="cmts-form-bot rate-form-bot mt-30">
                                      <div className="d-flex head">
                                        <div className="cmts-form-toggle">
                                          <div className="toggle-cus">
                                            <input type="checkbox" name="andanh" id="toggle-rate" />
                                            <label htmlFor="toggle-rate"></label>
                                          </div>
                                          <span className="text">Ẩn danh</span>
                                        </div>
                                      </div>
                                      <button className="btn" type="submit" disabled={submittingReview}>
                                        <div className="btn-inner">
                                          <span className="icon">
                                            <i className={submittingReview ? "fas fa-spinner fa-spin" : "fa-regular fa-paper-plane"}></i>
                                          </span>
                                          <span className="text">{submittingReview ? 'Đang gửi...' : 'Gửi ngay'}</span>
                                        </div>
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products - Sản phẩm liên quan */}
        {product && product.category_id && (
          <RelatedProducts 
            categoryId={product.category_id}
            currentProductId={product.id}
            title="Sản phẩm liên quan"
            maxItems={10}
          />
        )}
        
        {/* Recently Viewed Products - Sản phẩm đã xem gần đây */}
        {product && (
          <RecentlyViewed 
            currentProductId={product.id}
            title="Sản phẩm đã xem gần đây"
            maxItems={6}
          />
        )}
      </div>
    </>
  );
};

export default ProductDetailNew;
