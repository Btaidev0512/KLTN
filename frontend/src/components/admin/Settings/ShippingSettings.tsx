import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  OutlinedInput,
  Button,
  Box,
  CircularProgress,
  Alert,
  Typography,
  InputAdornment,
} from '@mui/material';
import { toast } from 'react-toastify';
import settingsService from '../../../services/settingsService';

interface ShippingSettingsData {
  shipping_enabled: boolean;
  shipping_fee_inner_city: string;
  shipping_fee_suburban: string;
  shipping_fee_province: string;
  free_shipping_enabled: boolean;
  free_shipping_threshold: string;
}

export const ShippingSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ShippingSettingsData>({
    shipping_enabled: true,
    shipping_fee_inner_city: '30000',
    shipping_fee_suburban: '50000',
    shipping_fee_province: '70000',
    free_shipping_enabled: true,
    free_shipping_threshold: '500000',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSettingsByCategory('shipping');
      
      if (response.data.success) {
        const settingsData = response.data.data;
        const shippingSettings: any = {};
        
        settingsData.forEach((item: any) => {
          const value = item.setting_type === 'boolean' 
            ? (item.setting_value === 'true' || item.setting_value === '1' || item.setting_value === 1)
            : item.setting_value;
          shippingSettings[item.setting_key] = value;
        });
        
        setSettings({
          shipping_enabled: shippingSettings.shipping_enabled ?? true,
          shipping_fee_inner_city: shippingSettings.shipping_fee_inner_city || '30000',
          shipping_fee_suburban: shippingSettings.shipping_fee_suburban || '50000',
          shipping_fee_province: shippingSettings.shipping_fee_province || '70000',
          free_shipping_enabled: shippingSettings.free_shipping_enabled ?? true,
          free_shipping_threshold: shippingSettings.free_shipping_threshold || '500000',
        });
      }
    } catch (err: any) {
      console.error('Error fetching shipping settings:', err);
      setError(err.response?.data?.message || 'Không thể tải cài đặt vận chuyển');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: keyof ShippingSettingsData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      [field]: event.target.checked,
    });
  };

  const handleChange = (field: keyof ShippingSettingsData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      [field]: event.target.value,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setSaving(true);
      
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === 'boolean' ? (value ? 'true' : 'false') : value,
      }));
      
      const response = await settingsService.updateMultipleSettings(settingsArray);
      
      if (response.data.success) {
        toast.success('Cập nhật cài đặt vận chuyển thành công!');
      }
    } catch (err: any) {
      console.error('Error updating shipping settings:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật cài đặt');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('vi-VN').format(Number(value));
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader 
          title="Cài đặt vận chuyển" 
          subheader="Quản lý phí vận chuyển và chính sách giao hàng" 
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Enable Shipping */}
            <Box>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={settings.shipping_enabled}
                    onChange={handleCheckboxChange('shipping_enabled')}
                  />
                }
                label="Kích hoạt tính năng vận chuyển"
              />
            </Box>

            {/* Shipping Fees */}
            {settings.shipping_enabled && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Phí vận chuyển</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Phí ship nội thành</InputLabel>
                    <OutlinedInput
                      label="Phí ship nội thành"
                      type="number"
                      value={settings.shipping_fee_inner_city}
                      onChange={handleChange('shipping_fee_inner_city')}
                      endAdornment={<InputAdornment position="end">VNĐ</InputAdornment>}
                    />
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Phí ship ngoại thành</InputLabel>
                    <OutlinedInput
                      label="Phí ship ngoại thành"
                      type="number"
                      value={settings.shipping_fee_suburban}
                      onChange={handleChange('shipping_fee_suburban')}
                      endAdornment={<InputAdornment position="end">VNĐ</InputAdornment>}
                    />
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Phí ship tỉnh khác</InputLabel>
                    <OutlinedInput
                      label="Phí ship tỉnh khác"
                      type="number"
                      value={settings.shipping_fee_province}
                      onChange={handleChange('shipping_fee_province')}
                      endAdornment={<InputAdornment position="end">VNĐ</InputAdornment>}
                    />
                  </FormControl>
                </Box>
              </Box>
            )}

            {/* Free Shipping */}
            {settings.shipping_enabled && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Miễn phí vận chuyển</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={settings.free_shipping_enabled}
                        onChange={handleCheckboxChange('free_shipping_enabled')}
                      />
                    }
                    label="Kích hoạt miễn phí ship khi đủ điều kiện"
                  />
                  
                  {settings.free_shipping_enabled && (
                    <FormControl fullWidth sx={{ maxWidth: '400px' }}>
                      <InputLabel>Ngưỡng miễn phí ship</InputLabel>
                      <OutlinedInput
                        label="Ngưỡng miễn phí ship"
                        type="number"
                        value={settings.free_shipping_threshold}
                        onChange={handleChange('free_shipping_threshold')}
                        endAdornment={<InputAdornment position="end">VNĐ</InputAdornment>}
                      />
                    </FormControl>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            type="submit"
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </CardActions>
      </Card>
    </form>
  );
};
