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
  Select,
  MenuItem,
  Button,
  Box,
} from '@mui/material';
import { toast } from 'react-toastify';
import settingsService from '../../../services/settingsService';

interface TaxSettingsData {
  tax_enabled: string;
  tax_rate: string;
  tax_label: string;
  tax_included: string;
  invoice_prefix: string;
  invoice_note: string;
}

export const TaxSettings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<TaxSettingsData>({
    tax_enabled: 'true',
    tax_rate: '10',
    tax_label: 'VAT',
    tax_included: 'false',
    invoice_prefix: 'INV',
    invoice_note: 'Cảm ơn quý khách đã mua hàng!',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettingsByCategory('tax');
      const data = response.data.data;
      if (data && data.length > 0) {
        const settingsObj: any = {};
        data.forEach((setting: any) => {
          settingsObj[setting.key] = String(setting.value);
        });
        setSettings((prev) => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error('Error loading tax settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof TaxSettingsData, value: string) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        category: 'tax',
      }));

      await settingsService.updateMultipleSettings(settingsArray);
      toast.success('Lưu cài đặt thuế thành công!');
    } catch (error: any) {
      console.error('Error saving tax settings:', error);
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
        title="Cài đặt Thuế & Hóa đơn"
        subheader="Cấu hình thuế VAT và thông tin hóa đơn"
      />
      <Divider />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Áp dụng thuế</InputLabel>
            <Select
              value={settings.tax_enabled}
              onChange={(e) => handleChange('tax_enabled', e.target.value)}
              label="Áp dụng thuế"
            >
              <MenuItem value="true">Bật</MenuItem>
              <MenuItem value="false">Tắt</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Thuế suất (%)</InputLabel>
            <OutlinedInput
              type="number"
              value={settings.tax_rate}
              onChange={(e) => handleChange('tax_rate', e.target.value)}
              label="Thuế suất (%)"
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Nhãn thuế</InputLabel>
            <OutlinedInput
              value={settings.tax_label}
              onChange={(e) => handleChange('tax_label', e.target.value)}
              label="Nhãn thuế"
              placeholder="VAT, GST, Tax..."
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Giá đã bao gồm thuế</InputLabel>
            <Select
              value={settings.tax_included}
              onChange={(e) => handleChange('tax_included', e.target.value)}
              label="Giá đã bao gồm thuế"
            >
              <MenuItem value="true">Đã bao gồm thuế</MenuItem>
              <MenuItem value="false">Chưa bao gồm thuế</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          <FormControl fullWidth>
            <InputLabel>Tiền tố số hóa đơn</InputLabel>
            <OutlinedInput
              value={settings.invoice_prefix}
              onChange={(e) => handleChange('invoice_prefix', e.target.value)}
              label="Tiền tố số hóa đơn"
              placeholder="INV"
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Ghi chú hóa đơn</InputLabel>
            <OutlinedInput
              multiline
              rows={3}
              value={settings.invoice_note}
              onChange={(e) => handleChange('invoice_note', e.target.value)}
              label="Ghi chú hóa đơn"
            />
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
