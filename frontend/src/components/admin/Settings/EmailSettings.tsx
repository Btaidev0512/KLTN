import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { EnvelopeSimple, FloppyDisk, PaperPlaneRight } from '@phosphor-icons/react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface EmailSettingsData {
  email_from_name: string;
  email_from_address: string;
  smtp_host: string;
  smtp_port: string;
  smtp_encryption: string;
  smtp_username: string;
  smtp_password: string;
  email_enabled: string;
}

export const EmailSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [settings, setSettings] = useState<EmailSettingsData>({
    email_from_name: '',
    email_from_address: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_encryption: 'tls',
    smtp_username: '',
    smtp_password: '',
    email_enabled: 'true',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/settings/category/email`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        const settingsObj: any = {};
        data.forEach((setting: any) => {
          settingsObj[setting.key] = setting.value;
        });
        setSettings((prev) => ({ ...prev, ...settingsObj }));
      }
    } catch (error: any) {
      console.error('Error loading email settings:', error);
      toast.error('Không thể tải cài đặt email');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EmailSettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        category: 'email',
      }));

      const response = await axios.put(
        `${API_URL}/admin/settings`,
        { settings: settingsArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Lưu cài đặt email thành công!');
      }
    } catch (error: any) {
      console.error('Error saving email settings:', error);
      toast.error('Lỗi khi lưu cài đặt email');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.warning('Vui lòng nhập email để test');
      return;
    }

    try {
      setTesting(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/test-email`,
        {
          to: testEmail,
          subject: 'Test Email từ TTShop',
          text: 'Đây là email test. Nếu nhận được email này, cấu hình SMTP đã hoạt động!',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Gửi email test thành công! Kiểm tra hộp thư.');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error('Lỗi khi gửi email test');
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    loadSettings();
    toast.info('Đã khôi phục cài đặt');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <EnvelopeSimple size={24} weight="duotone" />
          <Typography variant="h6" fontWeight={600}>
            Cài đặt Email & SMTP
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Cấu hình SMTP để gửi email tự động (đơn hàng, đặt lại mật khẩu, thông báo...)
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Email Enabled */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.email_enabled === 'true'}
                onChange={(e) => handleChange('email_enabled', e.target.checked ? 'true' : 'false')}
              />
            }
            label="Bật gửi email tự động"
          />

          {/* From Name */}
          <TextField
            fullWidth
            label="Tên người gửi"
            value={settings.email_from_name}
            onChange={(e) => handleChange('email_from_name', e.target.value)}
            placeholder="TTShop"
            helperText="Tên hiển thị khi gửi email"
          />

          {/* From Email */}
          <TextField
            fullWidth
            label="Email người gửi"
            type="email"
            value={settings.email_from_address}
            onChange={(e) => handleChange('email_from_address', e.target.value)}
            placeholder="noreply@ttshop.com"
            helperText="Địa chỉ email gửi đi"
          />

          <Divider sx={{ my: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Cấu hình SMTP Server
            </Typography>
          </Divider>

          {/* SMTP Host */}
          <TextField
            fullWidth
            label="SMTP Host"
            value={settings.smtp_host}
            onChange={(e) => handleChange('smtp_host', e.target.value)}
            placeholder="smtp.gmail.com"
            helperText="Gmail: smtp.gmail.com | Outlook: smtp.office365.com"
          />

          {/* SMTP Port */}
          <TextField
            fullWidth
            label="SMTP Port"
            type="number"
            value={settings.smtp_port}
            onChange={(e) => handleChange('smtp_port', e.target.value)}
            helperText="TLS: 587 | SSL: 465"
          />

          {/* SMTP Encryption */}
          <FormControl fullWidth>
            <InputLabel>Mã hóa</InputLabel>
            <Select
              value={settings.smtp_encryption}
              onChange={(e) => handleChange('smtp_encryption', e.target.value)}
              label="Mã hóa"
            >
              <MenuItem value="tls">TLS (Port 587)</MenuItem>
              <MenuItem value="ssl">SSL (Port 465)</MenuItem>
              <MenuItem value="none">Không mã hóa</MenuItem>
            </Select>
          </FormControl>

          {/* SMTP Username */}
          <TextField
            fullWidth
            label="SMTP Username"
            value={settings.smtp_username}
            onChange={(e) => handleChange('smtp_username', e.target.value)}
            placeholder="your-email@gmail.com"
            helperText="Thường là email của bạn"
          />

          {/* SMTP Password */}
          <TextField
            fullWidth
            label="SMTP Password"
            type="password"
            value={settings.smtp_password}
            onChange={(e) => handleChange('smtp_password', e.target.value)}
            placeholder="••••••••••••••••"
            helperText="Với Gmail, sử dụng App Password"
          />

          <Divider sx={{ my: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Test Email
            </Typography>
          </Divider>

          {/* Test Email */}
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              label="Email nhận"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
            <Button
              variant="outlined"
              startIcon={testing ? <CircularProgress size={16} /> : <PaperPlaneRight />}
              onClick={handleTestEmail}
              disabled={testing || !testEmail}
              sx={{ minWidth: '140px' }}
            >
              {testing ? 'Đang gửi...' : 'Gửi test'}
            </Button>
          </Box>

          {/* Help Section */}
          <Alert severity="warning">
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Hướng dẫn cấu hình Gmail:
            </Typography>
            <Typography variant="body2" component="div">
              1. Bật "2-Step Verification" trong Google Account<br />
              2. Tạo "App Password" cho "Mail"<br />
              3. Sử dụng App Password ở trường SMTP Password<br />
              4. Host: smtp.gmail.com | Port: 587 | Encryption: TLS
            </Typography>
          </Alert>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
          <Button variant="outlined" onClick={handleReset} disabled={saving}>
            Đặt lại
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <FloppyDisk />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
