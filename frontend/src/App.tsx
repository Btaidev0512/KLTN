import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import './App.css';

// Auth Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import ChatBot from './components/ChatBot';

// User Layout
import UserLayout from './components/Layout/UserLayout';

// Admin Route Protection
import AdminRoute from './components/admin/AdminRoute';

// User pages (Website cầu lông)
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetailNew';
import SaleProducts from './pages/SaleProducts';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import OrderTracking from './pages/OrderTracking';
import Wishlist from './pages/Wishlist';
import MyReviews from './pages/MyReviews';
import Contact from './pages/Contact';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';
import BankTransferInstructions from './pages/BankTransferInstructions';
import BankTransfer from './pages/BankTransfer';

// Admin components
import AdminLayout from './components/admin/Layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductsManagement from './pages/admin/Products';
import OrdersManagement from './pages/admin/Orders';
import CustomersManagement from './pages/admin/Customers';
import CategoriesAndBrands from './pages/admin/Categories';
import BrandsManagement from './pages/admin/Brands';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import { Coupons } from './pages/admin/Coupons';
import { Reviews } from './pages/admin/Reviews';
import BannersManagement from './pages/admin/BannersManagement';

const theme = createTheme({
  palette: {
    primary: { main: '#FF6B35' },
    secondary: { main: '#F7931E' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

// Component để điều khiển ChatBot dựa trên route
const ChatBotWrapper: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Không hiển thị ChatBot trong trang admin
  if (isAdminRoute) {
    return null;
  }
  
  return <ChatBot />;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            {/* User Routes - Website cầu lông với Header & Footer */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:categorySlug" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/sale" element={<SaleProducts />} />
              <Route path="/khuyen-mai" element={<SaleProducts />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/thanh-toan" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/failed" element={<PaymentFailed />} />
              <Route path="/bank-transfer" element={<BankTransfer />} />
              <Route path="/bank-transfer-instructions" element={<BankTransferInstructions />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/orders/:orderId" element={<OrderDetail />} />
              <Route path="/orders/:orderId/tracking" element={<OrderTracking />} />
              <Route path="/order-history" element={<OrderHistory />} />
              <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/yeu-thich" element={<Wishlist />} />
              <Route path="/reviews" element={<MyReviews />} />
              <Route path="/my-reviews" element={<MyReviews />} />
              <Route path="/danh-gia" element={<MyReviews />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:id" element={<NewsDetail />} />
            </Route>

          {/* Admin Dashboard - chỉ admin mới truy cập được */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="customers" element={<CustomersManagement />} />
              <Route path="categories" element={<CategoriesAndBrands />} />
              <Route path="brands" element={<BrandsManagement />} />
              <Route path="banners" element={<BannersManagement />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="reviews" element={<Reviews />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>            {/* Redirect các route không tồn tại về trang chủ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* ChatBot - chỉ hiển thị trên trang người dùng, không hiển thị ở trang admin */}
          <ChatBotWrapper />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
