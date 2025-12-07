import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Autocomplete
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import StarIcon from '@mui/icons-material/Star';
import { api } from '../../services/api';

interface Brand {
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  category_id?: number;
  category_name?: string;
  country?: string;
  logo_url?: string;
  is_active: boolean;
  created_at?: string;
  sort_order?: number;
}

interface Category {
  category_id: number;
  category_name: string;
  parent_id?: number;
}

const Brands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    brand_name: '',
    category_id: [] as number[], // Multiple categories
    country: '',
    logo_url: '',
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchBrands();
    fetchCategories();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.getAllBrands();
      if (response.data.success) {
        setBrands(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setError('Không thể tải danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.data.success) {
        // Only get parent categories
        const parentCats = (response.data.data || []).filter(
          (cat: Category) => !cat.parent_id
        );
        setCategories(parentCats);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpenDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      // Get category_ids from API response, fallback to single category_id
      let categoryIds: number[] = [];
      if (Array.isArray((brand as any).category_ids)) {
        categoryIds = (brand as any).category_ids;
      } else if (Array.isArray(brand.category_id)) {
        categoryIds = brand.category_id;
      } else if (brand.category_id) {
        categoryIds = [brand.category_id];
      }
      
      setFormData({
        brand_name: brand.brand_name,
        category_id: categoryIds,
        country: brand.country || '',
        logo_url: brand.logo_url || '',
        is_active: brand.is_active,
        sort_order: brand.sort_order || 0
      });
    } else {
      setEditingBrand(null);
      setFormData({
        brand_name: '',
        category_id: [],
        country: '',
        logo_url: '',
        is_active: true,
        sort_order: 0
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBrand(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Send category_ids array to backend
      const payload = {
        ...formData,
        category_ids: formData.category_id, // Send as array
        category_id: formData.category_id.length > 0 ? formData.category_id[0] : null // Also keep first one for backward compatibility
      };

      if (editingBrand) {
        await api.updateBrand(editingBrand.brand_id, payload);
        setSuccess('Cập nhật thương hiệu thành công!');
      } else {
        await api.createBrand(payload);
        setSuccess('Tạo thương hiệu mới thành công!');
      }
      
      fetchBrands();
      handleCloseDialog();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (brandId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa thương hiệu này?')) {
      return;
    }

    try {
      await api.deleteBrand(brandId);
      setSuccess('Xóa thương hiệu thành công!');
      fetchBrands();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Không thể xóa thương hiệu');
    }
  };

  const getCategoryName = (categoryId?: number) => {
    const cat = categories.find(c => c.category_id === categoryId);
    return cat?.category_name || 'Tất cả danh mục';
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newBrands = [...brands];
    const draggedBrand = newBrands[draggedIndex];
    newBrands.splice(draggedIndex, 1);
    newBrands.splice(dropIndex, 0, draggedBrand);

    // Update sort_order based on new positions
    const updatedBrands = newBrands.map((brand, idx) => ({
      ...brand,
      sort_order: idx
    }));

    setBrands(updatedBrands);
    setDraggedIndex(null);

    // Save to backend
    try {
      const orders = updatedBrands.map(brand => ({
        id: brand.brand_id,
        sort_order: brand.sort_order || 0
      }));

      await api.updateBrandOrders(orders);
      setSuccess('Đã cập nhật thứ tự thương hiệu!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Không thể cập nhật thứ tự: ' + error.message);
      fetchBrands(); // Reload to revert changes
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}>Đang tải...</Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon sx={{ fontSize: 32, color: '#FFD700' }} />
          Quản lý Thương hiệu
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E5531A' } }}
        >
          Thêm thương hiệu
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="50px"></TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Tên thương hiệu</TableCell>
              <TableCell>Danh mục</TableCell>
              <TableCell>Quốc gia</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {brands.map((brand, index) => {
              // Get categories from API response
              const categoriesText = (brand as any).categories || getCategoryName(brand.category_id);
              const categoryNames = typeof categoriesText === 'string' ? categoriesText.split(',') : [categoriesText];
              
              return (
                <TableRow 
                  key={brand.brand_id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  sx={{
                    cursor: 'move',
                    '&:hover': { bgcolor: '#f5f5f5' },
                    opacity: draggedIndex === index ? 0.5 : 1
                  }}
                >
                  <TableCell>
                    <DragIndicatorIcon sx={{ color: '#999', cursor: 'grab' }} />
                  </TableCell>
                  <TableCell>{brand.brand_id}</TableCell>
                  <TableCell>{brand.brand_name}</TableCell>
                  <TableCell>
                    {categoryNames.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {categoryNames.map((catName, idx) => (
                          <Chip 
                            key={idx}
                            label={catName.trim()} 
                            size="small"
                            color="primary"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Chip 
                        label="Tất cả danh mục" 
                        size="small"
                        color="default"
                      />
                    )}
                  </TableCell>
                  <TableCell>{brand.country || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={brand.is_active ? 'Hoạt động' : 'Tắt'}
                      color={brand.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(brand)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(brand.brand_id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog thêm/sửa */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Tên thương hiệu"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                required
                fullWidth
              />

              <Autocomplete
                multiple
                options={categories}
                getOptionLabel={(option) => option.category_name}
                value={categories.filter(cat => formData.category_id.includes(cat.category_id))}
                onChange={(event, newValue) => {
                  setFormData({ 
                    ...formData, 
                    category_id: newValue.map(cat => cat.category_id) 
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Danh mục"
                    placeholder="Chọn một hoặc nhiều danh mục"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.category_name}
                        {...tagProps}
                        color="primary"
                        size="small"
                      />
                    );
                  })
                }
              />

              <TextField
                label="Quốc gia"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                fullWidth
                placeholder="VD: Nhật Bản, Trung Quốc, Đài Loan..."
              />

              <TextField
                label="Logo URL"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                fullWidth
                placeholder="https://example.com/logo.png"
              />

              <TextField
                label="Thứ tự hiển thị"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                fullWidth
                helperText="Số nhỏ hơn sẽ hiển thị trước"
                inputProps={{ min: 0 }}
              />

              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  label="Trạng thái"
                >
                  <MenuItem value="true">Hoạt động</MenuItem>
                  <MenuItem value="false">Tắt</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ bgcolor: '#FF6B35', '&:hover': { bgcolor: '#E5531A' } }}
            >
              {editingBrand ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Brands;
