import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import axios from 'axios';

interface Variant {
  variant_id?: number;
  size: string;
  stock_quantity: number;
  sku?: string;
}

export interface VariantManagerProps {
  productId: number;
  categoryId?: number;
}

const VariantManager: React.FC<VariantManagerProps> = ({ productId, categoryId }) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tính tổng stock từ variants
  const totalStock = variants.reduce((sum, v) => sum + (parseInt(String(v.stock_quantity)) || 0), 0);
  
  // Auto-generate sizes based on category
  const autoGenerateSizes = () => {
    let defaultSizes: Variant[] = [];
    
    if (categoryId === 6) {
      // Giày: 36-43
      defaultSizes = ['36', '37', '38', '39', '40', '41', '42', '43'].map(size => ({
        size,
        stock_quantity: 0,
        sku: `SHOE-${size}`
      }));
      setMessage({ type: 'success', text: '✅ Đã tạo 8 sizes giày (36-43)' });
    } else if (categoryId === 7 || categoryId === 9 || categoryId === 10) {
      // Áo/Váy/Quần: M, L, XL, 2XL
      const categoryNames: { [key: number]: string } = {
        7: 'áo',
        9: 'váy', 
        10: 'quần'
      };
      const catName = categoryNames[categoryId] || 'quần áo';
      
      defaultSizes = ['M', 'L', 'XL', '2XL'].map(size => ({
        size,
        stock_quantity: 0,
        sku: `CLOTHES-${size}`
      }));
      setMessage({ type: 'success', text: `✅ Đã tạo 4 sizes ${catName} (M-2XL)` });
    }
    
    if (defaultSizes.length > 0) {
      setVariants(defaultSizes);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const loadVariants = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/products/${productId}/variants`);
      if (response.data.success) {
        setVariants(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
    }
  };

  // Load variants khi component mount
  useEffect(() => {
    if (productId) {
      loadVariants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const addVariant = () => {
    setVariants([...variants, { size: '', stock_quantity: 0 }]);
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = {
      ...newVariants[index],
      [field]: field === 'stock_quantity' ? parseInt(String(value)) || 0 : value
    };
    setVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const saveVariants = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Validate
      for (const variant of variants) {
        if (!variant.size || variant.size.trim() === '') {
          setMessage({ type: 'error', text: 'Tất cả variants phải có size' });
          setLoading(false);
          return;
        }
      }

      // Chuẩn bị data: chuyển stock_quantity sang số
      const preparedVariants = variants.map(v => ({
        size: v.size.trim(),
        stock_quantity: parseInt(String(v.stock_quantity)) || 0,
        sku: v.sku?.trim() || null
      }));

      // Gọi API bulk update
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/products/${productId}/variants/bulk`,
        { variants: preparedVariants },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: '✅ Cập nhật thành công!' });
        setVariants(response.data.data.variants);
        
        // Dispatch event để parent component reload product data
        window.dispatchEvent(new CustomEvent('variantsUpdated', { 
          detail: { 
            productId, 
            totalStock: response.data.data.total_stock 
          } 
        }));
        
        // Auto-hide success message after 2s
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error: any) {
      console.error('Error saving variants:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Có lỗi xảy ra khi lưu'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          📦 Quản lý Size & Tồn kho
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip 
            label={`Tổng kho: ${totalStock}`} 
            color="primary" 
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          {/* Nút tạo sizes mẫu cho Giày, Áo, Váy, Quần */}
          {(categoryId === 6 || categoryId === 7 || categoryId === 9 || categoryId === 10) && variants.length === 0 && (
            <Button
              variant="outlined"
              onClick={autoGenerateSizes}
              size="small"
              sx={{ 
                borderColor: '#4CAF50',
                color: '#4CAF50',
                '&:hover': {
                  borderColor: '#45a049',
                  bgcolor: '#f1f8f4'
                }
              }}
            >
              {categoryId === 6 ? '👟 Tạo 8 sizes giày' : 
               categoryId === 7 ? '👕 Tạo 4 sizes áo' :
               categoryId === 9 ? '👗 Tạo 4 sizes váy' :
               categoryId === 10 ? '👖 Tạo 4 sizes quần' : '+ Tạo sizes mẫu'}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addVariant}
            size="small"
          >
            Thêm Size
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveVariants}
            disabled={loading || variants.length === 0}
            sx={{
              bgcolor: '#FF6B35',
              '&:hover': { bgcolor: '#E55A25' }
            }}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {variants.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
          <Typography variant="body2">
            Chưa có size nào. Nhấn "Thêm Size" để bắt đầu.
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Số lượng</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>SKU (Tùy chọn)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Xóa</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variants.map((variant, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="VD: 41, M, 3U"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      fullWidth
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="0"
                      value={variant.stock_quantity}
                      onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                      InputProps={{ inputProps: { min: 0 } }}
                      fullWidth
                      required
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="VD: SHOE-41-BLK"
                      value={variant.sku || ''}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => removeVariant(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Hướng dẫn:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          • Nhập <strong>Size</strong> (VD: 39, 41, S, M, L, 3U, 4U)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Nhập <strong>Số lượng</strong> từng size
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • <strong>Tổng kho</strong> sẽ tự động cập nhật vào bảng products
        </Typography>
      </Box>
    </Paper>
  );
};

export default VariantManager;
