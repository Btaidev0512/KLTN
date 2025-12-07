/**
 * Application-wide constants
 */

// ✅ Placeholder image using SVG data URI (no external file needed)
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="Arial" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';

// Backend API base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Image URL helper
export const getFullImageUrl = (imageUrl: string | undefined): string => {
  if (!imageUrl || imageUrl.trim() === '') {
    return PLACEHOLDER_IMAGE;
  }
  
  // If already full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  
  // Build full URL with backend
  const cleanPath = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
  return `${API_BASE_URL}${cleanPath}`;
};
