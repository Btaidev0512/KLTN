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
} from '@mui/material';
import { toast } from 'react-toastify';
import settingsService from '../../../services/settingsService';

interface PaymentSettingsData {
  payment_cod_enabled: boolean;
  payment_vnpay_enabled: boolean;
  payment_vnpay_merchant_id: string;
  payment_momo_enabled: boolean;
  payment_bank_transfer_enabled: boolean;
  payment_bank_name: string;
  payment_bank_account_number: string;
  payment_bank_account_name: string;
  payment_bank_branch: string;
}

export const PaymentSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PaymentSettingsData>({
    payment_cod_enabled: true,
    payment_vnpay_enabled: false,
    payment_vnpay_merchant_id: '',
    payment_momo_enabled: false,
    payment_bank_transfer_enabled: true,
    payment_bank_name: '',
    payment_bank_account_number: '',
    payment_bank_account_name: '',
    payment_bank_branch: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settingsService.getSettingsByCategory('payment');
      
      if (response.data.success) {
        const settingsData = response.data.data;
        const paymentSettings: any = {};
        
        settingsData.forEach((item: any) => {
          const value = item.setting_type === 'boolean' 
            ? (item.setting_value === 'true' || item.setting_value === '1' || item.setting_value === 1)
            : item.setting_value;
          paymentSettings[item.setting_key] = value;
        });
        
        setSettings({
          payment_cod_enabled: paymentSettings.payment_cod_enabled ?? true,
          payment_vnpay_enabled: paymentSettings.payment_vnpay_enabled ?? false,
          payment_vnpay_merchant_id: paymentSettings.payment_vnpay_merchant_id || '',
          payment_momo_enabled: paymentSettings.payment_momo_enabled ?? false,
          payment_bank_transfer_enabled: paymentSettings.payment_bank_transfer_enabled ?? true,
          payment_bank_name: paymentSettings.payment_bank_name || '',
          payment_bank_account_number: paymentSettings.payment_bank_account_number || '',
          payment_bank_account_name: paymentSettings.payment_bank_account_name || '',
          payment_bank_branch: paymentSettings.payment_bank_branch || '',
        });
      }
    } catch (err: any) {
      console.error('Error fetching payment settings:', err);
      setError(err.response?.data?.message || 'Không thể tải cài đặt thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (field: keyof PaymentSettingsData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings({
      ...settings,
      [field]: event.target.checked,
    });
  };

  const handleChange = (field: keyof PaymentSettingsData) => (
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
        toast.success('Cập nhật cài đặt thanh toán thành công!');
      }
    } catch (err: any) {
      console.error('Error updating payment settings:', err);
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
          title="Cài đặt thanh toán" 
          subheader="Quản lý các phương thức thanh toán" 
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Payment Methods */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Phương thức thanh toán</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={settings.payment_cod_enabled}
                      onChange={handleCheckboxChange('payment_cod_enabled')}
                    />
                  }
                  label="COD (Thanh toán khi nhận hàng)"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={settings.payment_vnpay_enabled}
                      onChange={handleCheckboxChange('payment_vnpay_enabled')}
                    />
                  }
                  label="VNPay"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={settings.payment_momo_enabled}
                      onChange={handleCheckboxChange('payment_momo_enabled')}
                    />
                  }
                  label="MoMo"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={settings.payment_bank_transfer_enabled}
                      onChange={handleCheckboxChange('payment_bank_transfer_enabled')}
                    />
                  }
                  label="Chuyển khoản ngân hàng"
                />
              </Box>
            </Box>

            {/* VNPay Settings */}
            {settings.payment_vnpay_enabled && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Cấu hình VNPay</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>VNPay Merchant ID</InputLabel>
                    <OutlinedInput
                      label="VNPay Merchant ID"
                      value={settings.payment_vnpay_merchant_id}
                      onChange={handleChange('payment_vnpay_merchant_id')}
                    />
                  </FormControl>
                </Box>
              </Box>
            )}

            {/* Bank Transfer Settings */}
            {settings.payment_bank_transfer_enabled && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Thông tin chuyển khoản</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tên ngân hàng</InputLabel>
                    <OutlinedInput
                      label="Tên ngân hàng"
                      value={settings.payment_bank_name}
                      onChange={handleChange('payment_bank_name')}
                    />
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Số tài khoản</InputLabel>
                    <OutlinedInput
                      label="Số tài khoản"
                      value={settings.payment_bank_account_number}
                      onChange={handleChange('payment_bank_account_number')}
                    />
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Tên chủ tài khoản</InputLabel>
                    <OutlinedInput
                      label="Tên chủ tài khoản"
                      value={settings.payment_bank_account_name}
                      onChange={handleChange('payment_bank_account_name')}
                    />
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Chi nhánh</InputLabel>
                    <OutlinedInput
                      label="Chi nhánh"
                      value={settings.payment_bank_branch}
                      onChange={handleChange('payment_bank_branch')}
                    />
                  </FormControl>
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
