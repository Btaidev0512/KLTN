import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook để tự động redirect admin từ trang user sang trang admin
 * Đặt hook này trong các trang user (Home, Products, etc.)
 */
export const useAdminRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Nếu là admin và đang ở trang user, hiển thị notification
    if (isAuthenticated && user?.role === 'admin' && !location.pathname.startsWith('/admin')) {
      // Show banner cho admin biết có thể vào trang admin
      const banner = document.createElement('div');
      banner.id = 'admin-notification-banner';
      banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 20px;
        text-align: center;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideDown 0.3s ease;
        font-size: 14px;
        font-weight: 500;
      `;
      
      banner.innerHTML = `
        <style>
          @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
          }
          .admin-banner-btn {
            background: white;
            color: #667eea;
            border: none;
            padding: 6px 16px;
            margin: 0 8px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: all 0.2s;
          }
          .admin-banner-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          }
          .close-banner-btn {
            background: transparent;
            border: 1px solid white;
            color: white;
          }
          .close-banner-btn:hover {
            background: rgba(255,255,255,0.2);
          }
        </style>
        <span>👑 Bạn đang đăng nhập với tài khoản <strong>ADMIN</strong></span>
        <button class="admin-banner-btn" onclick="window.location.href='/admin'">
          🚀 Đến Trang Quản Trị
        </button>
        <button class="admin-banner-btn close-banner-btn" onclick="document.getElementById('admin-notification-banner').remove()">
          ✕ Đóng
        </button>
      `;

      // Remove existing banner if any
      const existingBanner = document.getElementById('admin-notification-banner');
      if (existingBanner) {
        existingBanner.remove();
      }

      // Add banner to body
      document.body.appendChild(banner);

      // Push body down to avoid content being hidden
      document.body.style.paddingTop = '48px';

      // Auto remove after 10 seconds
      const timer = setTimeout(() => {
        const bannerElement = document.getElementById('admin-notification-banner');
        if (bannerElement) {
          bannerElement.style.animation = 'slideDown 0.3s ease reverse';
          setTimeout(() => {
            bannerElement.remove();
            document.body.style.paddingTop = '0';
          }, 300);
        }
      }, 10000);

      // Cleanup
      return () => {
        clearTimeout(timer);
        const bannerElement = document.getElementById('admin-notification-banner');
        if (bannerElement) {
          bannerElement.remove();
        }
        document.body.style.paddingTop = '0';
      };
    }
  }, [isAuthenticated, user, location.pathname]);
};

/**
 * Component wrapper để tự động redirect admin
 * Dùng trong App.tsx để wrap các route user
 */
export const AdminRedirectWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useAdminRedirect();
  return <>{children}</>;
};

export default useAdminRedirect;
