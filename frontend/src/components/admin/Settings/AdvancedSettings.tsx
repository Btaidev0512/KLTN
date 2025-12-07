import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  FormControl,
  InputLabel,
  OutlinedInput,
  Button,
  Box,
  Alert,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import settingsService from '../../../services/settingsService';

interface AdvancedSettingsData {
  maintenance_mode: string;
  google_analytics_id: string;
  facebook_pixel_id: string;
  seo_title: string;
  seo_description: string;
  custom_css: string;
}

export const AdvancedSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<AdvancedSettingsData>({
    maintenance_mode: 'false',
    google_analytics_id: '',
    facebook_pixel_id: '',
    seo_title: 'TTShop - Cửa hàng cầu lông chuyên nghiệp',
    seo_description: 'Chuyên cung cấp vợt cầu lông, giày, phụ kiện từ các thương hiệu Yonex, Victor, Lining, Mizuno',
    custom_css: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettingsByCategory('advanced');
      const data = response.data.data;
      if (data && data.length > 0) {
        const settingsObj: any = {};
        data.forEach((setting: any) => {
          settingsObj[setting.key] = String(setting.value);
        });
        setSettings((prev) => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading advanced settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AdvancedSettingsData, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        category: 'advanced',
      }));

      await settingsService.updateMultipleSettings(settingsArray);
      toast.success('Lưu cài đặt nâng cao thành công!');
      
      if (settings.maintenance_mode === 'true') {
        toast.warning('Chế độ bảo trì đã được bật!');
      }
    } catch (error: any) {
      console.error('Error saving advanced settings:', error);
      toast.error(error.message || 'Lỗi khi lưu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    toast.info('Đã đặt lại giá trị ban đầu');
  };

  return (
    <Card>
      <CardHeader 
        title="Cài đặt nâng cao"
        subheader="Analytics, SEO và các tùy chỉnh nâng cao"
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="warning">
            Cẩn thận khi thay đổi các cài đặt này. Có thể ảnh hưởng đến hoạt động của website.
          </Alert>

          <FormControlLabel
            control={
              <Switch
                checked={settings.maintenance_mode === 'true'}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')}
              />
            }
            label="Chế độ bảo trì (Maintenance Mode)"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
            Bật chế độ này để tạm dừng website cho khách hàng trong khi bảo trì
          </Typography>

          <Divider />
          <Typography variant="subtitle1" fontWeight={600}>
            Analytics & Tracking
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Google Analytics ID</InputLabel>
            <OutlinedInput
              value={settings.google_analytics_id}
              onChange={(e) => handleChange('google_analytics_id', e.target.value)}
              label="Google Analytics ID"
              placeholder="G-XXXXXXXXXX"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Tracking ID từ Google Analytics (VD: G-XXXXXXXXXX)
            </Typography>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Facebook Pixel ID</InputLabel>
            <OutlinedInput
              value={settings.facebook_pixel_id}
              onChange={(e) => handleChange('facebook_pixel_id', e.target.value)}
              label="Facebook Pixel ID"
              placeholder="123456789012345"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Pixel ID từ Facebook Business Manager
            </Typography>
          </FormControl>

          <Divider />
          <Typography variant="subtitle1" fontWeight={600}>
            SEO Settings
          </Typography>

          <FormControl fullWidth>
            <InputLabel>SEO Title</InputLabel>
            <OutlinedInput
              value={settings.seo_title}
              onChange={(e) => handleChange('seo_title', e.target.value)}
              label="SEO Title"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Tiêu đề hiển thị trên Google Search (50-60 ký tự)
            </Typography>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>SEO Description</InputLabel>
            <OutlinedInput
              multiline
              rows={3}
              value={settings.seo_description}
              onChange={(e) => handleChange('seo_description', e.target.value)}
              label="SEO Description"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Mô tả hiển thị trên Google Search (150-160 ký tự)
            </Typography>
          </FormControl>

          <Divider />
          <Typography variant="subtitle1" fontWeight={600}>
            Custom Code
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Custom CSS</InputLabel>
            <OutlinedInput
              multiline
              rows={6}
              value={settings.custom_css}
              onChange={(e) => handleChange('custom_css', e.target.value)}
              label="Custom CSS"
              placeholder=".custom-class { color: red; }"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              CSS tùy chỉnh sẽ được áp dụng cho toàn bộ website
            </Typography>
          </FormControl>
        </Box>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Button variant="outlined" onClick={handleReset} disabled={loading}>
          Đặt lại
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </CardActions>
    </Card>
  );
};
