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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  Plus,
  PencilSimple,
  Trash,
  ArrowUp,
  ArrowDown,
  Folder,
} from '@phosphor-icons/react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { api } from '../../services/api';

interface Category {
  category_id: number;
  category_name: string;
  description?: string;
  parent_category_id?: number;
  product_count?: number;
  sort_order?: number;
}

const Categories: React.FC = () => {
  
  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    category_name: '',
    description: '',
    sort_order: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ CATEGORIES ============
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await api.getCategories();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        category_name: category.category_name,
        description: category.description || '',
        sort_order: category.sort_order || 0,
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        category_name: '',
        description: '',
        sort_order: 0,
      });
    }
    setOpenCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setEditingCategory(null);
    setCategoryFormData({
      category_name: '',
      description: '',
      sort_order: 0,
    });
  };

  const handleSubmitCategory = async () => {
    if (!categoryFormData.category_name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingCategory) {
        await api.updateCategory(editingCategory.category_id, categoryFormData);
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await api.createCategory(categoryFormData);
        toast.success('Thêm danh mục thành công!');
      }

      fetchCategories();
      handleCloseCategoryDialog();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa danh mục "${categoryName}"?`)) {
      return;
    }

    try {
      await api.deleteCategory(categoryId);
      toast.success('Xóa danh mục thành công!');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

  // Move category up/down
  const handleMoveCategory = async (categoryId: number, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.category_id === categoryId);
    if (currentIndex === -1) return;
    
    // Check boundaries
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categories.length - 1) return;
    
    // Create new order
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Swap
    [newCategories[currentIndex], newCategories[targetIndex]] = 
    [newCategories[targetIndex], newCategories[currentIndex]];
    
    // Update UI optimistically
    setCategories(newCategories);
    
    // Send to backend
    try {
      const orders = newCategories.map((cat, index) => ({
        id: cat.category_id,
        sort_order: index + 1
      }));
      
      await api.reorderCategories(orders);
      toast.success('Đã cập nhật thứ tự danh mục');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Không thể cập nhật thứ tự');
      // Revert on error
      fetchCategories();
    }
  };



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
      <Typography variant="h4" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Folder size={32} weight="duotone" style={{ color: '#FF6B35' }} />
        Quản lý Danh mục
      </Typography>

      {/* Categories Content */}
      <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Danh sách Danh mục</Typography>
            <Button
              variant="contained"
              startIcon={<Plus size={20} weight="bold" />}
              onClick={() => handleOpenCategoryDialog()}
              sx={{
                bgcolor: '#FF6B35',
                '&:hover': { bgcolor: '#E55A25' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Thêm danh mục
            </Button>
          </Stack>

          <Paper>
            {loadingCategories ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : categories.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">Chưa có danh mục nào</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>Thứ tự</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Tên danh mục</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Mô tả</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Số sản phẩm</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category, index) => (
                      <TableRow key={category.category_id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveCategory(category.category_id, 'up')}
                              disabled={index === 0}
                              sx={{ p: 0.5 }}
                            >
                              <ArrowUp size={16} weight={index === 0 ? 'light' : 'bold'} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleMoveCategory(category.category_id, 'down')}
                              disabled={index === categories.length - 1}
                              sx={{ p: 0.5 }}
                            >
                              <ArrowDown size={16} weight={index === categories.length - 1 ? 'light' : 'bold'} />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>{category.category_id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {category.category_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                            {category.description || 'Chưa có mô tả'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category.product_count || 0}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenCategoryDialog(category)}
                            >
                              <PencilSimple size={18} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCategory(category.category_id, category.category_name)}
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
            )}
          </Paper>
        </Box>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              label="Tên danh mục"
              value={categoryFormData.category_name}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, category_name: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Mô tả"
              multiline
              rows={3}
              value={categoryFormData.description}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Thứ tự hiển thị"
              type="number"
              value={categoryFormData.sort_order}
              onChange={(e) => setCategoryFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              helperText="Số nhỏ hơn sẽ hiển thị trước"
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={handleCloseCategoryDialog} disabled={submitting}>
            Hủy
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCategory}
            disabled={submitting}
            sx={{
              bgcolor: '#FF6B35',
              '&:hover': { bgcolor: '#E55A25' },
            }}
          >
            {submitting ? <CircularProgress size={24} /> : (editingCategory ? 'Cập nhật' : 'Thêm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;
