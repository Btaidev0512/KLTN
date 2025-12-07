import { apiClient } from './api';

// Settings Service
export const settingsService = {
  // Get all settings (Admin only)
  getAllSettings: () => 
    apiClient.get('/admin/settings'),

  // Get settings by category (Admin only)
  getSettingsByCategory: (category: string) => 
    apiClient.get(`/admin/settings/category/${category}`),

  // Get settings as object (Admin only)
  getSettingsAsObject: (category?: string) => 
    apiClient.get('/admin/settings/object', { params: { category } }),

  // Get single setting (Admin only)
  getSetting: (key: string) => 
    apiClient.get(`/admin/settings/${key}`),

  // Update single setting (Admin only)
  updateSetting: (key: string, value: any) => 
    apiClient.put(`/admin/settings/${key}`, { value }),

  // Update multiple settings (Admin only)
  updateMultipleSettings: (settings: Array<{ key: string; value: any }>) => 
    apiClient.put('/admin/settings', { settings }),

  // Create new setting (Admin only)
  createSetting: (settingData: {
    key: string;
    value: any;
    type?: string;
    category: string;
    displayName?: string;
    description?: string;
    isPublic?: boolean;
  }) => apiClient.post('/admin/settings', settingData),

  // Delete setting (Admin only)
  deleteSetting: (key: string) => 
    apiClient.delete(`/admin/settings/${key}`),

  // Get categories list (Admin only)
  getCategories: () => 
    apiClient.get('/admin/settings/meta/categories'),

  // Get public settings (No auth required)
  getPublicSettings: () => 
    apiClient.get('/settings/public'),
};

export default settingsService;
