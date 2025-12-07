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
  CircularProgress,
  Alert,
} from '@mui/material';
import { toast } from 'react-toastify';
import settingsService from '../../../services/settingsService';

interface GeneralSettingsData {
  shop_name: string;
  shop_tagline: string;
  contact_email: string;
  contact_phone: string;
  shop_address: string;
  website_url: string;
  currency: string;
}

export const GeneralSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<GeneralSettingsData>({
    shop_name: '',
    shop_tagline: '',
    contact_email: '',
    contact_phone: '',
    shop_address: '',
    website_url: '',
    currency: 'VND',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSettingsByCategory('general');
      
      if (response.data.success) {
        const settingsData = response.data.data;
        const generalSettings: any = {};
        
        settingsData.forEach((item: any) => {
          generalSettings[item.setting_key] = item.setting_value;
        });
        
        setSettings({
          shop_name: generalSettings.shop_name || '',
          shop_tagline: generalSettings.shop_tagline || '',
          contact_email: generalSettings.contact_email || '',
          contact_phone: generalSettings.contact_phone || '',
          shop_address: generalSettings.shop_address || '',
          website_url: generalSettings.website_url || '',
          currency: generalSettings.currency || 'VND',
        });
      }
    } catch (err: any) {
      console.error('Error fetching general settings:', err);
      setError(err.response?.data?.message || 'Không thể tải cài đặt chung');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof GeneralSettingsData) => (
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
      
      // Convert settings object to array format
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));
      
      const response = await settingsService.updateMultipleSettings(settingsArray);
      
      if (response.data.success) {
        toast.success('Cập nhật cài đặt chung thành công!');
      }
    } catch (err: any) {
      console.error('Error updating general settings:', err);
      toast.error(err.response?.data?.message || 'Không thể cập nhật cài đặt');
    } finally {
      setSaving(false);
    }
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
          title="Cài đặt chung" 
          subheader="Thông tin cơ bản về cửa hàng" 
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Tên cửa hàng</InputLabel>
              <OutlinedInput
                label="Tên cửa hàng"
                value={settings.shop_name}
                onChange={handleChange('shop_name')}
              />
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Slogan</InputLabel>
              <OutlinedInput
                label="Slogan"
                value={settings.shop_tagline}
                onChange={handleChange('shop_tagline')}
              />
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Email liên hệ</InputLabel>
              <OutlinedInput
                label="Email liên hệ"
                type="email"
                value={settings.contact_email}
                onChange={handleChange('contact_email')}
              />
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Số điện thoại</InputLabel>
              <OutlinedInput
                label="Số điện thoại"
                value={settings.contact_phone}
                onChange={handleChange('contact_phone')}
              />
            </FormControl>
            
            <FormControl fullWidth sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
              <InputLabel>Địa chỉ cửa hàng</InputLabel>
              <OutlinedInput
                label="Địa chỉ cửa hàng"
                value={settings.shop_address}
                onChange={handleChange('shop_address')}
                multiline
                rows={2}
              />
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Website URL</InputLabel>
              <OutlinedInput
                label="Website URL"
                type="url"
                value={settings.website_url}
                onChange={handleChange('website_url')}
              />
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Đơn vị tiền tệ</InputLabel>
              <OutlinedInput
                label="Đơn vị tiền tệ"
                value={settings.currency}
                onChange={handleChange('currency')}
              />
            </FormControl>
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
