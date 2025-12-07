import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface Banner {
  banner_id: number;
  title: string;
  subtitle: string | null;
  tag_text: string | null;
  tag_type: string | null;
  button_text: string;
  button_link: string;
  background_image: string | null;
  background_gradient: string;
  is_active: boolean;
  sort_order: number;
}

interface BannerFormData {
  title: string;
  subtitle: string;
  tag_text: string;
  tag_type: string;
  button_text: string;
  button_link: string;
  background_gradient: string;
  background_image: string;
  background_type: 'gradient' | 'image';
}

const initialFormData: BannerFormData = {
  title: '',
  subtitle: '',
  tag_text: '',
  tag_type: '',
  button_text: 'KHÁM PHÁ NGAY',
  button_link: '/products',
  background_gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
  background_image: '',
  background_type: 'gradient'
};

const BannersManagement: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(initialFormData);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await api.getAllBanners();
      console.log('Banners response:', response.data);
      setBanners(response.data.data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      showSnackbar('Lỗi khi tải danh sách banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        tag_text: banner.tag_text || '',
        tag_type: banner.tag_type || '',
        button_text: banner.button_text,
        button_link: banner.button_link,
        background_gradient: banner.background_gradient,
        background_image: banner.background_image || '',
        background_type: banner.background_image ? 'image' : 'gradient'
      });
    } else {
      setEditingBanner(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBanner(null);
    setFormData(initialFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      // Chỉ kiểm tra có hình ảnh hoặc gradient
      if (formData.background_type === 'image' && !formData.background_image) {
        showSnackbar('Vui lòng tải lên hình ảnh', 'error');
        return;
      }
      if (formData.background_type === 'gradient' && !formData.background_gradient) {
        showSnackbar('Vui lòng chọn màu gradient', 'error');
        return;
      }

      const submitData: any = {
        title: formData.title || '',
        subtitle: formData.subtitle || null,
        tag_text: formData.tag_text || null,
        tag_type: formData.tag_type || null,
        button_text: formData.button_text || '',
        button_link: formData.button_link || '#'
      };

      // Chỉ gửi field thực sự có giá trị
      if (formData.background_type === 'image') {
        if (formData.background_image) {
          submitData.background_image = formData.background_image;
        }
        // Khi chọn image, xóa gradient
        submitData.background_gradient = '';
      } else if (formData.background_type === 'gradient') {
        if (formData.background_gradient) {
          submitData.background_gradient = formData.background_gradient;
        }
        // Khi chọn gradient, xóa image
        submitData.background_image = '';
      }

      console.log('Submitting banner data:', {
        ...submitData,
        background_image: submitData.background_image ? 
          `${submitData.background_image.substring(0, 50)}... (${submitData.background_image.length} chars)` : 
          submitData.background_image
      });
      
      if (editingBanner) {
        await api.updateBanner(editingBanner.banner_id, submitData);
        showSnackbar('Cập nhật banner thành công!');
      } else {
        await api.createBanner(submitData);
        showSnackbar('Tạo banner mới thành công!');
      }
      handleCloseDialog();
      fetchBanners();
    } catch (error: any) {
      console.error('Error saving banner:', error);
      showSnackbar(error.response?.data?.message || 'Lỗi khi lưu banner', 'error');
    }
  };

  const handleToggleStatus = async (bannerId: number) => {
    try {
      await api.toggleBannerStatus(bannerId);
      showSnackbar('Cập nhật trạng thái thành công!');
      fetchBanners();
    } catch (error) {
      console.error('Error toggling banner status:', error);
      showSnackbar('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa banner này?')) return;

    try {
      await api.deleteBanner(bannerId);
      showSnackbar('Xóa banner thành công!');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      showSnackbar('Lỗi khi xóa banner', 'error');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showSnackbar('Vui lòng chọn file ảnh!', 'error');
      return;
    }

    // Giới hạn kích thước file (10MB để giữ chất lượng cao)
    if (file.size > 10 * 1024 * 1024) {
      showSnackbar('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB', 'error');
      return;
    }

    setUploading(true);

    // Tạo Image object để resize nếu cần
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      // Tạo canvas để vẽ ảnh với kích thước tối ưu
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Tăng kích thước tối đa để giữ chất lượng tốt hơn
      const maxWidth = 2560;  // Tăng từ 1920 lên 2560 (2K)
      const maxHeight = 800;  // Tăng từ 600 lên 800
      
      let width = img.width;
      let height = img.height;

      // Chỉ resize nếu ảnh quá lớn (trên 2K)
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Bật imageSmoothingQuality để render mượt hơn
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
      }

      // Tăng quality lên 0.98 (98%) cho ảnh sắc nét hơn
      const base64 = canvas.toDataURL(file.type, 0.98);
      
      setFormData(prev => ({ ...prev, background_image: base64 }));
      setUploading(false);
      showSnackbar(`Upload ảnh thành công! (${Math.round(base64.length / 1024)}KB)`);
    };

    img.onerror = () => {
      setUploading(false);
      showSnackbar('Lỗi khi xử lý ảnh!', 'error');
    };

    reader.onerror = () => {
      setUploading(false);
      showSnackbar('Lỗi khi đọc file!', 'error');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const gradientPresets = [
    { name: 'Orange', value: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)' },
    { name: 'Blue', value: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)' },
    { name: 'Green', value: 'linear-gradient(135deg, #27AE60 0%, #229954 100%)' },
    { name: 'Purple', value: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)' },
    { name: 'Red', value: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)' }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản Lý Banners
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Thêm Banner Mới
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50}>
                <DragIcon />
              </TableCell>
              <TableCell width={150}>Màu nền</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell width={120}>Tags</TableCell>
              <TableCell width={150}>Button</TableCell>
              <TableCell width={100}>Trạng thái</TableCell>
              <TableCell width={100}>Thứ tự</TableCell>
              <TableCell width={150}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Chưa có banner nào
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.banner_id}>
                  <TableCell>
                    <IconButton size="small" sx={{ cursor: 'grab' }}>
                      <DragIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: '100%',
                        height: 50,
                        borderRadius: 1,
                        border: '1px solid #ddd',
                        position: 'relative',
                        overflow: 'hidden',
                        ...(!(banner.background_image && banner.background_image.trim() !== '') && {
                          background: banner.background_gradient || 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
                        })
                      }}
                    >
                      {banner.background_image && banner.background_image.trim() !== '' ? (
                        <>
                          <img
                            src={banner.background_image}
                            alt="Banner"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              console.error('Banner image failed to load');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <Chip 
                            label="IMG" 
                            size="small" 
                            sx={{ 
                              position: 'absolute', 
                              top: 2, 
                              right: 2,
                              height: 16,
                              fontSize: '0.6rem'
                            }} 
                          />
                        </>
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {banner.title}
                    </Typography>
                    {banner.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {banner.subtitle}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {banner.tag_text && (
                      <Box>
                        <Chip label={banner.tag_text} size="small" color="primary" />
                        {banner.tag_type && (
                          <Typography variant="caption" display="block" mt={0.5}>
                            {banner.tag_type}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block">
                      {banner.button_text}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      → {banner.button_link}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={banner.is_active}
                      onChange={() => handleToggleStatus(banner.banner_id)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {banner.sort_order}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(banner)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(banner.banner_id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBanner ? 'Chỉnh Sửa Banner' : 'Thêm Banner Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Tiêu đề"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Phụ đề"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleInputChange}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Tag text (NEW, SALE, HOT...)"
                name="tag_text"
                value={formData.tag_text}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Tag type (ECLIPSION, 50% OFF...)"
                name="tag_type"
                value={formData.tag_type}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Nội dung nút"
                name="button_text"
                value={formData.button_text}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Link nút"
                name="button_link"
                value={formData.button_link}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
            
            {/* Background Type Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Loại nền
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant={formData.background_type === 'gradient' ? 'contained' : 'outlined'}
                  onClick={() => setFormData(prev => ({ ...prev, background_type: 'gradient' }))}
                  fullWidth
                >
                  Màu gradient
                </Button>
                <Button
                  variant={formData.background_type === 'image' ? 'contained' : 'outlined'}
                  onClick={() => setFormData(prev => ({ ...prev, background_type: 'image' }))}
                  fullWidth
                >
                  Hình ảnh
                </Button>
              </Box>
            </Box>

            {/* Gradient Options */}
            {formData.background_type === 'gradient' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Chọn màu gradient
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {gradientPresets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={formData.background_gradient === preset.value ? 'contained' : 'outlined'}
                      onClick={() => setFormData(prev => ({ ...prev, background_gradient: preset.value }))}
                      sx={{
                        background: preset.value,
                        color: 'white',
                        '&:hover': {
                          background: preset.value,
                          opacity: 0.8
                        }
                      }}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </Box>
                <TextField
                  label="Hoặc nhập CSS gradient tùy chỉnh"
                  name="background_gradient"
                  value={formData.background_gradient}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)"
                />
                <Box
                  sx={{
                    mt: 2,
                    height: 100,
                    background: formData.background_gradient,
                    borderRadius: 1,
                    border: '1px solid #ddd'
                  }}
                />
              </Box>
            )}

            {/* Image URL Options */}
            {formData.background_type === 'image' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Hình ảnh Banner
                </Typography>
                
                {/* Upload area */}
                <Box
                  onDrop={handleDrop}
                  onDragOver={handleDrag}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  sx={{
                    mb: 2,
                    p: 3,
                    border: `2px dashed ${dragActive ? '#FF6B35' : '#ddd'}`,
                    borderRadius: 2,
                    textAlign: 'center',
                    bgcolor: dragActive ? 'rgba(255, 107, 53, 0.05)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => document.getElementById('banner-file-input')?.click()}
                >
                  <input
                    id="banner-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />
                  <Typography variant="body2" color={dragActive ? 'primary' : 'text.secondary'}>
                    {uploading ? '⏳ Đang xử lý ảnh...' : '📁 Kéo thả ảnh vào đây hoặc click để chọn file'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Hỗ trợ: JPG, PNG, GIF, WEBP (tối đa 10MB)<br/>
                    💡 <strong>Khuyến nghị:</strong> Ảnh kích thước 2560x800px hoặc cao hơn để đạt chất lượng tốt nhất
                  </Typography>
                </Box>

                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', my: 2 }}>
                  — HOẶC —
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="caption">
                    <strong>Lưu ý:</strong> Cần URL trực tiếp đến file ảnh (kết thúc bằng .jpg, .png, .webp...)<br/>
                    ✅ Đúng: https://i.imgur.com/abc123.jpg<br/>
                    ❌ Sai: https://www.google.com/url?sa=i&url=...<br/>
                    <strong>Gợi ý:</strong> Upload ảnh lên <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer">Imgur.com</a> rồi copy direct link
                  </Typography>
                </Alert>
                <TextField
                  label="Nhập link hình ảnh hoặc Base64"
                  name="background_image"
                  value={formData.background_image}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={formData.background_image?.startsWith('data:') ? 3 : 1}
                  placeholder="https://i.imgur.com/abc123.jpg hoặc data:image/jpeg;base64,..."
                  helperText={formData.background_image?.startsWith('data:') 
                    ? `✅ Base64 đã nhập (${Math.round(formData.background_image.length / 1024)}KB)` 
                    : "Nhập URL trực tiếp hoặc upload file ở trên"}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: formData.background_image?.startsWith('data:') ? 'monospace' : 'inherit',
                      fontSize: formData.background_image?.startsWith('data:') ? '0.75rem' : 'inherit'
                    }
                  }}
                />
                {formData.background_image && (
                  <>
                    <Box
                      sx={{
                        mt: 2,
                        height: 200,
                        borderRadius: 1,
                        border: '1px solid #ddd',
                        overflow: 'hidden',
                        position: 'relative',
                        bgcolor: '#f5f5f5'
                      }}
                    >
                      <img
                        src={formData.background_image}
                        alt="Banner preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('Image failed to load:', formData.background_image?.substring(0, 100));
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1
                        }}
                      >
                        Preview
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setFormData(prev => ({ ...prev, background_image: '' }))}
                      >
                        Xóa ảnh
                      </Button>
                      {formData.background_image.startsWith('data:image') && (
                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                          📎 File đã upload (Base64: {Math.round(formData.background_image.length / 1024)}KB)
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              (formData.background_type === 'image' && !formData.background_image) ||
              (formData.background_type === 'gradient' && !formData.background_gradient)
            }
          >
            {editingBanner ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BannersManagement;
