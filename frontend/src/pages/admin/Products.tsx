import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  MagnifyingGlass,
  PencilSimple,
  Trash,
  Plus,
} from '@phosphor-icons/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from '../../services/api';
import VariantManager from '../../components/admin/VariantManager';
import { PLACEHOLDER_IMAGE, getFullImageUrl } from '../../utils/constants';

interface Product {
  product_id: number;
  product_name: string;
  category_id: number;
  category_name: string;
  brand_id: number;
  brand_name: string;
  price: number;
  base_price?: number;
  sale_price?: number;
  stock_quantity: number;
  status: 'active' | 'inactive';
  image_url?: string;
  description?: string;
  is_featured?: boolean;
}

interface Category {
  category_id: number;
  category_name: string;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  // Product Attributes state
  const [attributeDefinitions, setAttributeDefinitions] = useState<any[]>([]);
  const [productAttributes, setProductAttributes] = useState<any[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  
  // Multiple images state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<any>({
    product_name: '',
    category_id: '',
    brand_id: '',
    price: '',
    sale_price: '',
    stock_quantity: '',
    description: '',
    status: 'active',
    image_url: '',
    is_featured: false,
    tempVariants: [],
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
    
    // Listen for variants update event
    const handleVariantsUpdate = (event: any) => {
      const { productId, totalStock } = event.detail;
      
      // Update formData if editing the same product
      if (editingProduct && editingProduct.product_id === productId) {
        setFormData((prev: any) => ({ ...prev, stock_quantity: totalStock.toString() }));
      }
      
      // Reload products list
      fetchProducts();
    };
    
    window.addEventListener('variantsUpdated', handleVariantsUpdate);
    
    return () => {
      window.removeEventListener('variantsUpdated', handleVariantsUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct]);

  // Helper function to get full image URL (using centralized utility)
  const getImageUrl = getFullImageUrl;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getAllProducts();
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.response?.data?.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục');
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.getAllBrands();
      if (response.data.success) {
        setBrands(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Không thể tải thương hiệu');
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      
      console.log('🔍 Opening edit dialog for product:', product);
      console.log('💰 Price info:', {
        base_price: product.base_price,
        price: product.price,
        sale_price: product.sale_price
      });
      
      // Tính % discount từ base_price và sale_price
      const basePrice = product.base_price || product.price || 0;
      const salePrice = product.sale_price || 0;
      const discountPercent = salePrice > 0 && basePrice > 0 
        ? Math.round((1 - salePrice / basePrice) * 100)
        : '';
      
      console.log('💵 Calculated:', {
        basePrice,
        salePrice,
        discountPercent
      });
      
      setFormData({
        product_name: product.product_name,
        category_id: String(product.category_id),
        brand_id: String(product.brand_id),
        price: String(basePrice),
        sale_price: String(discountPercent),
        stock_quantity: String(product.stock_quantity),
        description: product.description || '',
        status: product.status,
        image_url: product.image_url || '',
        is_featured: product.is_featured || false,
      });
      setImagePreview(getImageUrl(product.image_url));
      setImageFile(null);
      
      // Load all images for all products
      if (product.category_id) {
        loadProductImages(product.product_id, product.image_url);
      }
      
      // Load attributes if product has attribute system
      if ([1, 2, 5, 6, 7, 8].includes(product.category_id)) {
        loadProductAttributes(product.product_id);
      }
    } else {
      setEditingProduct(null);
      setFormData({
        product_name: '',
        category_id: '',
        brand_id: '',
        price: '',
        sale_price: '',
        stock_quantity: '',
        description: '',
        status: 'active',
        image_url: '',
        is_featured: false,
      });
      setImagePreview('');
      setImageFile(null);
      setProductAttributes([]);
      setImageFiles([]);
      setImagePreviews([]);
    }
    setOpenDialog(true);
  };

  // Load attributes when category changes
  const handleCategoryChange = async (categoryId: string) => {
    console.log('🔍 Category changed:', categoryId, typeof categoryId);
    setFormData((prev: any) => ({ ...prev, category_id: categoryId }));
    setProductAttributes([]);
    
    // Reset multi-image when category changes
    setImageFiles([]);
    setImagePreviews([]);
    
    const catId = parseInt(categoryId);
    
    // Load attributes cho các category có hệ thống lọc: Vợt(1), Giày(2), Váy(5), Túi(6), Balo(7), Phụ kiện(8)
    if ([1, 2, 5, 6, 7, 8].includes(catId)) {
      const categoryNames: {[key: number]: string} = {
        1: '🏸 Vợt cầu lông',
        2: '👟 Giày cầu lông',
        5: '👗 Váy cầu lông', 
        6: '🎒 Túi cầu lông',
        7: '🎒 Balo cầu lông',
        8: '⚡ Phụ kiện cầu lông'
      };
      
      console.log(`📦 Loading attributes for ${categoryNames[catId]}...`);
      try {
        setLoadingAttributes(true);
        // For Vợt category (1), pass brandId if available to filter racket series
        const brandId = catId === 1 && formData.brand_id ? parseInt(formData.brand_id) : undefined;
        console.log('🏷️ Using brandId for filter:', brandId);
        const response = await api.productAttributes.getAttributesByCategory(catId, brandId);
        console.log('📦 API Response:', response.data);
        if (response.data.success) {
          setAttributeDefinitions(response.data.data);
          console.log('✅ Loaded attributes:', response.data.data);
        }
      } catch (error) {
        console.error('❌ Error loading attributes:', error);
        toast.error('Không thể tải thuộc tính sản phẩm');
      } finally {
        setLoadingAttributes(false);
      }
    } else {
      console.log('❌ Category không có attributes, clearing...');
      setAttributeDefinitions([]);
    }
  };

  // Load attributes when brand changes (for categories with brand-specific attributes)
  const handleBrandChange = async (brandId: string) => {
    console.log('🏷️ Brand changed:', brandId, typeof brandId);
    setFormData((prev: any) => ({ ...prev, brand_id: brandId }));
    
    const catId = parseInt(formData.category_id);
    
    // Only reload attributes for Vợt (1) since it has brand-specific racket series
    if (catId === 1 && formData.category_id && brandId) {
      console.log(`🔄 Reloading attributes for category ${catId} with brand ${brandId}...`);
      
      // Clear racket_series attribute selection when brand changes
      const racketSeriesAttr = attributeDefinitions.find((attr: any) => attr.attribute_key === 'racket_series');
      if (racketSeriesAttr) {
        const newAttrs = productAttributes.filter(
          (pa: any) => pa.attribute_id !== racketSeriesAttr.attribute_id
        );
        setProductAttributes(newAttrs);
        console.log('🧹 Cleared racket series selection');
      }
      
      try {
        setLoadingAttributes(true);
        const response = await api.productAttributes.getAttributesByCategory(catId, parseInt(brandId));
        console.log('📦 API Response with brand filter:', response.data);
        if (response.data.success) {
          setAttributeDefinitions(response.data.data);
          console.log('✅ Loaded brand-filtered attributes:', response.data.data);
        }
      } catch (error) {
        console.error('❌ Error loading brand-filtered attributes:', error);
        toast.error('Không thể tải thuộc tính theo thương hiệu');
      } finally {
        setLoadingAttributes(false);
      }
    }
  };

  // Load product's existing images
  const loadProductImages = async (productId: number, primaryImageUrl?: string) => {
    try {
      const response = await api.getProductImages(productId);
      if (response.data.success) {
        const images = response.data.data || [];
        const imageUrls = images.map((img: any) => img.image_url);
        
        // Add primary image first if exists
        if (primaryImageUrl) {
          setImagePreviews([primaryImageUrl, ...imageUrls.filter((url: string) => url !== primaryImageUrl)]);
        } else if (imageUrls.length > 0) {
          setImagePreviews(imageUrls);
        }
        console.log('✅ Loaded', imageUrls.length, 'images for product', productId);
      }
    } catch (error) {
      console.error('Error loading product images:', error);
    }
  };

  // Load product's existing attributes
  const loadProductAttributes = async (productId: number) => {
    try {
      setLoadingAttributes(true);
      
      // Get product category first
      const product = products.find(p => p.product_id === productId);
      if (!product) return;
      
      const categoryId = product.category_id;
      
      // Only load if category has attributes
      if ([1, 2, 5, 6, 7, 8].includes(categoryId)) {
        // Load attribute definitions (with brand filter for Vợt category)
        const brandId = categoryId === 1 && product.brand_id ? product.brand_id : undefined;
        console.log('🏷️ Loading attributes with brandId:', brandId);
        const defsResponse = await api.productAttributes.getAttributesByCategory(categoryId, brandId);
        if (defsResponse.data.success) {
          setAttributeDefinitions(defsResponse.data.data);
        }
        
        // Load product's attribute values
        const attrsResponse = await api.productAttributes.getProductAttributes(productId);
        if (attrsResponse.data.success) {
          const attrs = attrsResponse.data.data.map((attr: any) => ({
            attribute_id: attr.attribute_id,
            value_id: attr.value_id
          }));
          setProductAttributes(attrs);
        }
      }
    } catch (error) {
      console.error('Error loading product attributes:', error);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview('');
    setAttributeDefinitions([]);
    setProductAttributes([]);
    setImageFiles([]);
    setImagePreviews([]);
    setFormData({
      product_name: '',
      category_id: '',
      brand_id: '',
      price: '',
      sale_price: '',
      stock_quantity: '',
      description: '',
      status: 'active',
      image_url: '',
      is_featured: false,
      tempVariants: [],
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler for multiple images
  const handleMultipleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải hình ảnh`);
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} vượt quá 5MB`);
        return;
      }

      // Add to files array
      setImageFiles(prev => [...prev, file]);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image from multiple images
  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url || null;

    try {
      setUploading(true);
      const response = await api.uploadProductImage(imageFile);
      
      if (response.data.success) {
        toast.success('Upload hình ảnh thành công!');
        return response.data.data.url;
      }
      return null;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi upload hình ảnh');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.product_name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!formData.category_id) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }
    if (!formData.brand_id) {
      toast.error('Vui lòng chọn thương hiệu');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Vui lòng nhập giá hợp lệ');
      return;
    }
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      toast.error('Vui lòng nhập số lượng hợp lệ');
      return;
    }

    try {
      setSubmitting(true);
      
      console.log('🔍 Form data before processing:', formData);
      console.log('🔍 Image file:', imageFile);
      console.log('🔍 Image preview:', imagePreview);
      console.log('🔍 Image previews array:', imagePreviews);
      
      // Upload image first if there's a new image
      let imageUrl: string | null = formData.image_url;
      
      // For all categories, use first image from imagePreviews as primary if available
      const catId = parseInt(formData.category_id);
      if (catId && imagePreviews.length > 0) {
        imageUrl = imagePreviews[0];
        console.log('✅ Using first preview as primary:', imageUrl);
      } else if (imageFile) {
        const uploadedUrl = await handleUploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } else if (editingProduct) {
        // ✅ FIX: Nếu đang edit và không có ảnh mới, GIỮ NGUYÊN ảnh cũ
        imageUrl = editingProduct.image_url || null;
        console.log('✅ Keeping existing image:', imageUrl);
      }
      
      console.log('🔍 Final image URL:', imageUrl);
      
      // Validate URL format if image URL is provided
      if (imageUrl && imageUrl.trim() !== '') {
        // Validate URL format (must start with http:// or https:// or /)
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('/')) {
          toast.error('URL hình ảnh không hợp lệ. Phải bắt đầu bằng http://, https:// hoặc /');
          setSubmitting(false);
          return;
        }
      } else {
        imageUrl = null;
      }
      
      // Tính giá: base_price = giá bán, sale_price = giá khuyến mãi (nếu có)
      const basePrice = Math.round(parseFloat(formData.price) || 0);
      let salePrice = null;
      
      // Nếu có % giảm giá và is_featured = true, tính sale_price
      if (formData.is_featured && formData.sale_price) {
        const discountPercent = parseFloat(formData.sale_price);
        salePrice = Math.round(basePrice * (1 - discountPercent / 100));
      }
      
      console.log('💰 Price calculation:', {
        inputPrice: formData.price,
        inputDiscount: formData.sale_price,
        basePrice,
        salePrice,
        is_featured: formData.is_featured
      });
      
      const productData: any = {
        product_name: formData.product_name.trim(),
        category_id: parseInt(formData.category_id),
        brand_id: parseInt(formData.brand_id),
        base_price: basePrice,
        stock_quantity: parseInt(formData.stock_quantity),
        description: formData.description.trim() || '',
        status: formData.status,
        image_url: imageUrl,
        is_featured: formData.is_featured,
      };
      
      // Thêm sale_price nếu có giảm giá
      if (salePrice !== null && salePrice > 0) {
        productData.sale_price = salePrice;
      }

      console.log('📦 Product data to send:', productData);

      if (editingProduct) {
        // Update product
        console.log('✏️ Updating product:', editingProduct.product_id);
        const updateResponse = await api.updateProduct(editingProduct.product_id, productData);
        console.log('✅ Update response:', updateResponse.data);
        
        // ✅ ĐỒNG BỘ ẢNH: Xóa ảnh cũ không còn trong imagePreviews, thêm ảnh mới
        if (catId && imagePreviews.length > 0) {
          console.log('🔄 Syncing images...');
          try {
            // Get existing images from database
            const existingImagesResponse = await api.getProductImages(editingProduct.product_id);
            const existingImages = existingImagesResponse.data.success ? existingImagesResponse.data.data : [];
            const existingUrls = existingImages.map((img: any) => img.image_url);
            
            console.log('📸 Current images in DB:', existingUrls);
            console.log('📸 New images preview:', imagePreviews);
            
            // Find images to delete (in DB but not in preview)
            const imagesToDelete = existingImages.filter(
              (img: any) => !imagePreviews.includes(img.image_url)
            );
            
            // Find images to add (in preview but not in DB) - Add ALL new images including first one
            const imagesToAdd = imagePreviews.filter(
              (url: string, index: number) => {
                // Skip if already in database
                if (existingUrls.includes(url)) {
                  console.log(`⏭️ Skipping existing image: ${url}`);
                  return false;
                }
                console.log(`✅ Will add new image [${index}]: ${url}`);
                return true;
              }
            );
            
            console.log(`📊 Summary: ${imagesToDelete.length} to delete, ${imagesToAdd.length} to add`);
            
            console.log(`🗑️ Deleting ${imagesToDelete.length} old images`);
            for (const img of imagesToDelete) {
              try {
                await api.deleteProductImage(img.image_id);
                console.log(`✅ Deleted image ${img.image_id}`);
              } catch (delError) {
                console.error(`❌ Error deleting image ${img.image_id}:`, delError);
              }
            }
            
            console.log(`➕ Adding ${imagesToAdd.length} new images`);
            const addedImages = [];
            
            // Step 1: Add all images with is_primary=false first
            for (let i = 0; i < imagesToAdd.length; i++) {
              const url = imagesToAdd[i];
              const originalIndex = imagePreviews.indexOf(url);
              
              try {
                const response = await api.createProductImage(editingProduct.product_id, {
                  image_url: url,
                  sort_order: originalIndex,
                  is_primary: false // Always false first
                });
                addedImages.push({ ...response.data.data, originalIndex });
                console.log(`✅ Added image ${i + 1}/${imagesToAdd.length} (position ${originalIndex})`);
              } catch (imgError: any) {
                console.error(`❌ Error adding image ${i}:`, imgError);
                console.error(`Full error:`, imgError.response?.data || imgError.message);
              }
            }
            
            // Step 2: If first image is new, set it as primary
            const needNewPrimary = imagePreviews.length > 0 && !existingUrls.includes(imagePreviews[0]);
            if (needNewPrimary && addedImages.length > 0) {
              // Find the image with originalIndex === 0
              const firstImage = addedImages.find(img => img.originalIndex === 0);
              if (firstImage && firstImage.image_id) {
                try {
                  await api.updateProductImage(firstImage.image_id, { is_primary: true });
                  console.log(`✅ Set image ${firstImage.image_id} as primary`);
                } catch (updateError: any) {
                  console.error(`❌ Error setting primary:`, updateError);
                }
              }
            }
            
            // ✅ RELOAD images từ database sau khi sync để đảm bảo đồng bộ
            console.log('🔄 Reloading images from database...');
            await loadProductImages(editingProduct.product_id, imageUrl || undefined);
            console.log('✅ Images reloaded successfully');
          } catch (error) {
            console.error('❌ Error syncing images:', error);
          }
        }
        
        // Save attributes if category has attribute system (1,2,5,6,7,8) and has attributes
        if ([1, 2, 5, 6, 7, 8].includes(catId) && productAttributes.length > 0) {
          console.log('💾 Updating attributes for product:', editingProduct.product_id);
          // Filter out attributes with null or undefined value_id (not selected)
          const validAttributes = productAttributes.filter(attr => 
            attr.value_id != null || attr.custom_value != null
          );
          if (validAttributes.length > 0) {
            await api.productAttributes.setProductAttributes(
              editingProduct.product_id,
              validAttributes
            );
            console.log('✅ Attributes updated');
          } else {
            console.log('⚠️ No valid attributes to save');
          }
        }
        
        toast.success('Cập nhật sản phẩm thành công! ✅');
        fetchProducts();
        
        // ✅ Tự động đóng dialog sau 1.5 giây để user thấy thông báo
        setTimeout(() => {
          handleCloseDialog();
        }, 1500);
        return;
      } else {
        // Create product
        const response = await api.createProduct(productData);
        console.log('✅ Product created, response:', response.data);
        const newProductId = response.data.data?.product_id || response.data.data?.id;
        console.log('🆔 New product ID:', newProductId);
        
        // Save all images to product_images table (for all categories with multiple images)
        const catId = parseInt(formData.category_id);
        if (catId && imagePreviews.length > 0 && newProductId) {
          console.log('💾 Saving ALL images to product_images...');
          // Save ALL images including first one (primary)
          for (let i = 0; i < imagePreviews.length; i++) {
            try {
              await api.createProductImage(newProductId, {
                image_url: imagePreviews[i],
                sort_order: i,
                is_primary: i === 0 // First image is primary
              });
              console.log(`✅ Saved image ${i + 1}/${imagePreviews.length}`);
            } catch (imgError: any) {
              console.error(`❌ Error saving image ${i}:`, imgError);
            }
          }
        }
        
        // Save attributes if category has attribute system (1,2,5,6,7,8) and has attributes
        if ([1, 2, 5, 6, 7, 8].includes(catId) && productAttributes.length > 0) {
          if (!newProductId) {
            console.error('❌ Product created but no ID returned!');
            toast.error('Sản phẩm được tạo nhưng không thể lưu thuộc tính');
            fetchProducts();
            handleCloseDialog();
            return;
          }
          
          console.log('💾 Saving attributes for product:', newProductId, productAttributes);
          // Filter out attributes with null or undefined value_id
          const validAttributes = productAttributes.filter(attr => 
            attr.value_id != null || attr.custom_value != null
          );
          try {
            if (validAttributes.length > 0) {
              await api.productAttributes.setProductAttributes(
                newProductId,
                validAttributes
              );
              console.log('✅ Attributes saved successfully');
            } else {
              console.log('⚠️ No valid attributes to save');
            }
          } catch (attrError: any) {
            console.error('❌ Error saving attributes:', attrError);
            console.error('Attribute payload:', validAttributes);
            toast.error('Sản phẩm đã tạo nhưng lỗi khi lưu thuộc tính: ' + (attrError.response?.data?.message || attrError.message));
          }
        }
        
        toast.success('Thêm sản phẩm thành công!');
        
        // Set editing product để có thể thêm màu/ảnh ngay
        if (newProductId && response.data.data) {
          const newProduct = {
            ...response.data.data,
            product_id: newProductId
          };
          setEditingProduct(newProduct);
          toast.info('Bạn có thể thêm màu sắc và hình ảnh bên dưới', { autoClose: 3000 });
          // Không đóng dialog, để user có thể thêm màu/ảnh
          fetchProducts(); // Refresh danh sách
          return; // Không đóng dialog
        }
      }

      // ✅ Chỉ refresh và đóng dialog khi TẠO MỚI product
      // Update thì giữ dialog mở (đã return ở trên)
      fetchProducts();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving product:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Validation errors:', error.response?.data?.errors);
      console.error('Request payload:', error.config?.data);
      
      // Log chi tiết từng validation error
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        console.error('📋 Chi tiết validation errors:');
        error.response.data.errors.forEach((err: any, index: number) => {
          console.error(`  ${index + 1}. Field: ${err.path || err.param}, Message: ${err.msg}`);
        });
      }
      
      // Hiển thị chi tiết lỗi validation nếu có
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map((err: any) => err.msg).join(', ');
        toast.error(`Lỗi validation: ${errorMessages}`);
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: number, productName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${productName}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting product:', productId, productName);
      const response = await api.deleteProduct(productId);
      console.log('✅ Delete response:', response.data);
      toast.success('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch (error: any) {
      console.error('❌ Error deleting product:', error);
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        toast.error('Bạn không có quyền xóa sản phẩm này.');
      } else {
        toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm: ' + error.message);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' ₫';
  };

  // Filter products based on search
  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate filtered products
  const paginatedProducts = filteredProducts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Quản lý Sản phẩm
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} weight="bold" />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#FF6B35',
            '&:hover': { bgcolor: '#E55A25' },
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Thêm sản phẩm
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Tìm kiếm sản phẩm theo tên, danh mục, thương hiệu..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MagnifyingGlass size={20} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Products Table */}
      <Paper>
        {filteredProducts.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchTerm ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Hình ảnh</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tên sản phẩm</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Danh mục</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Thương hiệu</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Giá</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Kho</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Sale Off</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.product_id} hover>
                      <TableCell>
                        <Avatar
                          src={getImageUrl(product.image_url)}
                          variant="rounded"
                          sx={{ width: 50, height: 50 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {product.product_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.category_name}</TableCell>
                      <TableCell>{product.brand_name}</TableCell>
                      <TableCell>
                        <Box>
                          {product.sale_price && product.sale_price > 0 ? (
                            <>
                              <Typography variant="body2" fontWeight={600} color="error">
                                {formatCurrency(product.sale_price)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                  {formatCurrency(product.base_price || product.price || 0)}
                                </Typography>
                                <Chip
                                  label={`-${Math.round((1 - product.sale_price / (product.base_price || product.price || 1)) * 100)}%`}
                                  size="small"
                                  color="error"
                                  sx={{ height: '18px', fontSize: '0.7rem' }}
                                />
                              </Box>
                            </>
                          ) : (
                            <Typography variant="body2" fontWeight={600} color="primary">
                              {formatCurrency(product.base_price || product.price || 0)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            product.stock_quantity === 0 
                              ? 'Hết hàng' 
                              : product.stock_quantity < 10 
                                ? `Sắp hết (${product.stock_quantity})` 
                                : product.stock_quantity
                          }
                          size="small"
                          color={
                            product.stock_quantity === 0 
                              ? 'error' 
                              : product.stock_quantity < 10 
                                ? 'warning' 
                                : 'success'
                          }
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.is_featured ? 'Có' : 'Không'}
                          size="small"
                          color={product.is_featured ? 'warning' : 'default'}
                          icon={product.is_featured ? <span style={{ fontSize: '14px' }}>🔥</span> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status === 'active' ? 'Hoạt động' : 'Ngừng bán'}
                          size="small"
                          color={product.status === 'active' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(product)}
                          >
                            <PencilSimple size={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(product.product_id, product.product_name)}
                          >
                            <Trash size={18} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredProducts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Số dòng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
            />
          </>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            
            {/* 1. Tên sản phẩm */}
            <TextField
              fullWidth
              label="Tên sản phẩm"
              value={formData.product_name}
              onChange={(e) => handleInputChange('product_name', e.target.value)}
              required
              placeholder="VD: Giày cầu lông Victor A170 II-AG"
            />

            {/* 2. Danh mục */}
            <FormControl fullWidth required>
              <InputLabel>Danh mục sản phẩm</InputLabel>
              <Select
                value={formData.category_id}
                onChange={(e) => handleCategoryChange(e.target.value)}
                label="Danh mục sản phẩm"
              >
                {categories.map((category) => (
                  <MenuItem key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 3. Thương hiệu */}
            <FormControl fullWidth required>
              <InputLabel>Thương hiệu</InputLabel>
              <Select
                value={formData.brand_id}
                onChange={(e) => handleBrandChange(e.target.value)}
                label="Thương hiệu"
              >
                {brands.map((brand) => (
                  <MenuItem key={brand.brand_id} value={brand.brand_id}>
                    {brand.brand_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 3.5. Đối tượng - Chỉ cho Áo (7), Váy (9), Quần (10) */}
            {[7, 9, 10].includes(parseInt(formData.category_id)) && attributeDefinitions.length > 0 && (() => {
              const genderAttr = attributeDefinitions.find((attr: any) => attr.attribute_id === 10);
              if (!genderAttr) return null;
              
              const selectedValues = productAttributes
                .filter((pa: any) => pa.attribute_id === 10)
                .map((pa: any) => pa.value_id);
              
              const categoryLabels: { [key: number]: string } = {
                7: 'Áo',
                9: 'Váy',
                10: 'Quần'
              };
              const label = categoryLabels[parseInt(formData.category_id)] || 'Sản phẩm';
              
              return (
                <FormControl fullWidth required>
                  <InputLabel>Đối tượng ({label}) *</InputLabel>
                  <Select
                    value={selectedValues[0] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const newAttrs = productAttributes.filter(
                        (pa: any) => pa.attribute_id !== 10
                      );
                      
                      if (value) {
                        newAttrs.push({
                          attribute_id: 10,
                          value_id: parseInt(value as string)
                        });
                      }
                      
                      setProductAttributes(newAttrs);
                    }}
                    label="Đối tượng *"
                  >
                    <MenuItem value="">
                      <em>-- Chọn đối tượng --</em>
                    </MenuItem>
                    {genderAttr.values?.map((val: any) => (
                      <MenuItem key={val.value_id} value={val.value_id}>
                        {val.value_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            })()}

            {/* 4. Giá bán */}
            <TextField
              fullWidth
              label="Giá bán (VNĐ)"
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              required
              InputProps={{
                inputProps: { min: 0, max: 999999999, step: 10000 }
              }}
              helperText="Nhập giá từ 0 đến 999.999.999 ₫ (VD: 1000000 = 1.000.000 ₫)"
            />

            {/* 5. Hiển thị ở trang Sale Off */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_featured}
                  onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                  color="primary"
                />
              }
              label="Hiển thị trong trang Sale Off"
            />

            {/* 6. % Giảm giá (chỉ hiển thị khi chọn Sale Off) */}
            {formData.is_featured && (
              <TextField
                fullWidth
                label="% Giảm giá"
                type="number"
                value={formData.sale_price}
                onChange={(e) => handleInputChange('sale_price', e.target.value)}
                required
                InputProps={{
                  inputProps: { min: 0, max: 100, step: 1 }
                }}
                helperText={
                  formData.sale_price && formData.price
                    ? `Giá sau giảm: ${new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(parseFloat(formData.price) * (1 - parseFloat(formData.sale_price) / 100))} ₫`
                    : 'Bắt buộc nhập % giảm giá cho sản phẩm Sale Off'
                }
              />
            )}

            {/* 7. Mô tả */}
            <TextField
              fullWidth
              label="Mô tả sản phẩm"
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Mô tả chi tiết về sản phẩm..."
            />

            {/* 8. Upload hình ảnh */}
            <Box sx={{ 
              border: '2px dashed #e0e0e0', 
              borderRadius: 2, 
              p: 3, 
              bgcolor: '#fafafa'
            }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                📷 Hình ảnh sản phẩm
              </Typography>
              
              {/* Multi-image upload for ALL categories */}
              {formData.category_id ? (
                <Box>
                  {/* Preview Grid */}
                  {imagePreviews.length > 0 && (
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: 2, 
                      mb: 2 
                    }}>
                      {imagePreviews.map((preview, index) => (
                        <Box key={index} sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                          <img 
                            src={preview} 
                            alt={`Preview ${index + 1}`} 
                            style={{ 
                              width: '100%', 
                              height: '150px', 
                              objectFit: 'cover'
                            }} 
                          />
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              minWidth: 'auto',
                              p: 0.5
                            }}
                          >
                            ✕
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  {/* URL Input */}
                  <TextField
                    fullWidth
                    label="Hoặc nhập URL hình ảnh"
                    placeholder="https://example.com/image.jpg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        const url = input.value.trim();
                        if (url) {
                          if (url.startsWith('http://') || url.startsWith('https://')) {
                            setImagePreviews(prev => [...prev, url]);
                            input.value = '';
                            toast.success('Đã thêm ảnh từ URL');
                          } else {
                            toast.error('URL phải bắt đầu bằng http:// hoặc https://');
                          }
                        }
                      }
                    }}
                    sx={{ mb: 1 }}
                    helperText="Nhấn Enter để thêm ảnh từ URL"
                  />
                  
                  <Typography variant="body2" color="text.secondary" mb={1} textAlign="center">
                    hoặc
                  </Typography>
                  
                  {/* Upload Button */}
                  <Button
                    variant="outlined"
                    component="label"
                    disabled={uploading}
                    fullWidth
                  >
                    {uploading ? 'Đang upload...' : `📁 Tải lên từ máy (${imagePreviews.length})`}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImagesChange}
                    />
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Vui lòng chọn danh mục trước
                </Typography>
              )}
            </Box>

            {/* ========== PHẦN THUỘC TÍNH RIÊNG THEO DANH MỤC ========== */}
            {/* Product Attributes - Hiển thị cho Vợt(5), Giày(6), Túi(8) - BỎ Áo(7), Váy(9), Quần(10) */}
            {[1, 2, 5, 6, 7, 8].includes(parseInt(formData.category_id as any)) && attributeDefinitions.length > 0 && (
              <Box sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 2, 
                p: 2, 
                bgcolor: '#fafafa',
                mt: 1
              }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#FF6B35' }}>
                  {parseInt(formData.category_id) === 1 && '🏸 Thuộc tính vợt cầu lông'}
                  {parseInt(formData.category_id) === 2 && '👟 Thuộc tính giày cầu lông'}
                  {parseInt(formData.category_id) === 5 && '👗 Thuộc tính váy cầu lông'}
                  {parseInt(formData.category_id) === 6 && '🎒 Thuộc tính túi cầu lông'}
                  {parseInt(formData.category_id) === 7 && '🎒 Thuộc tính balo cầu lông'}
                  {parseInt(formData.category_id) === 8 && '⚡ Thuộc tính phụ kiện'}
                </Typography>
                
                {loadingAttributes ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {attributeDefinitions.map((attr: any) => {
                      // Ẩn attribute "Size giày" (attribute_id = 5) và "Trọng lượng" (attribute_id = 1) vì đã có VariantManager
                      if (attr.attribute_id === 5 || attr.attribute_id === 1) {
                        return null;
                      }
                      
                      // Debug: Log attribute để kiểm tra
                      if (attr.attribute_name.includes('Dòng vợt') || attr.attribute_name.includes('Form giày')) {
                        console.log('🔍 Attribute:', attr.attribute_name, 'is_required:', attr.is_required, 'type:', typeof attr.is_required);
                      }
                      
                      // Convert is_required to boolean if it's a number
                      const isRequired = Boolean(attr.is_required);
                      
                      const isMultiSelect = attr.attribute_type === 'multiselect';
                      const selectedValues = productAttributes
                        .filter((pa: any) => pa.attribute_id === attr.attribute_id)
                        .map((pa: any) => pa.value_id);
                      
                      return (
                        <FormControl key={attr.attribute_id} fullWidth required={isRequired}>
                          <InputLabel>{attr.attribute_name}</InputLabel>
                          <Select
                            multiple={isMultiSelect}
                            value={isMultiSelect ? selectedValues : (selectedValues[0] || '')}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              if (isMultiSelect) {
                                // Handle multiselect
                                const newAttrs = productAttributes.filter(
                                  (pa: any) => pa.attribute_id !== attr.attribute_id
                                );
                                
                                (value as number[]).forEach(valueId => {
                                  newAttrs.push({
                                    attribute_id: attr.attribute_id,
                                    value_id: valueId
                                  });
                                });
                                
                                setProductAttributes(newAttrs);
                              } else {
                                // Handle single select
                                const newAttrs = productAttributes.filter(
                                  (pa: any) => pa.attribute_id !== attr.attribute_id
                                );
                                
                                if (value) {
                                  newAttrs.push({
                                    attribute_id: attr.attribute_id,
                                    value_id: parseInt(value as string)
                                  });
                                }
                                
                                setProductAttributes(newAttrs);
                              }
                            }}
                            label={attr.attribute_name}
                            renderValue={isMultiSelect ? (selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(selected as number[]).map((valueId) => {
                                  const val = attr.values?.find((v: any) => v.value_id === valueId);
                                  return val ? (
                                    <Chip key={valueId} label={val.value_name} size="small" />
                                  ) : null;
                                })}
                              </Box>
                            ) : undefined}
                          >
                            {!isMultiSelect && (
                              <MenuItem value="">
                                <em>-- Chọn {attr.attribute_name.toLowerCase()} --</em>
                              </MenuItem>
                            )}
                            {attr.values?.map((val: any) => (
                              <MenuItem key={val.value_id} value={val.value_id}>
                                {isMultiSelect && (
                                  <Checkbox checked={selectedValues.includes(val.value_id)} />
                                )}
                                {val.value_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}



            {/* Variant Manager - Quản lý size và số lượng */}
            {formData.category_id && (
              <Box sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 2, 
                p: 2.5, 
                bgcolor: '#fafafa',
                mb: 2,
                '&:hover': {
                  borderColor: '#FF6B35',
                  bgcolor: '#FFF5F2'
                }
              }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📦 Quản lý Size và Số lượng trong kho
                </Typography>
                {editingProduct && editingProduct.product_id ? (
                  <VariantManager 
                    productId={editingProduct.product_id} 
                    categoryId={editingProduct.category_id}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                    <Typography variant="body2">
                      💡 Vui lòng lưu sản phẩm trước để quản lý size và số lượng
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Số lượng tạm thời khi tạo mới */}
            {!editingProduct && (
              <TextField
                fullWidth
                label="Số lượng trong kho (tạm thời)"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                required
                InputProps={{
                  inputProps: { min: 0 }
                }}
                helperText="💡 Sau khi lưu, hãy quản lý size để cập nhật số lượng chính xác"
              />
            )}

            {/* Trạng thái */}
            <FormControl fullWidth>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                label="Trạng thái"
              >
                <MenuItem value="active">Hoạt động</MenuItem>
                <MenuItem value="inactive">Ngừng bán</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              bgcolor: '#FF6B35',
              '&:hover': { bgcolor: '#E55A25' },
            }}
          >
            {submitting ? <CircularProgress size={24} /> : (editingProduct ? 'Cập nhật' : 'Thêm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsManagement;
