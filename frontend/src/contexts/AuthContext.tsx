import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import axios from 'axios';
import { setLogoutCallback } from '../services/api';
import { isTokenExpired, getTimeUntilExpiry } from '../utils/tokenUtils';

interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  role: string;
  gender?: string;
  birth_date?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (userData: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenCheckInterval = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    console.log('🚪 Logging out user...');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    // Clear token check interval
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
      tokenCheckInterval.current = null;
    }
    
    // Dispatch event to update UI components
    window.dispatchEvent(new Event('authChanged'));
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  // Periodic token expiry check
  const startTokenExpiryCheck = (authToken: string) => {
    // Clear existing interval
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current);
    }

    // Check token expiry every minute
    tokenCheckInterval.current = setInterval(() => {
      if (isTokenExpired(authToken)) {
        console.log('⏰ Token expired, auto logout');
        logout();
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = '/login';
      } else {
        const timeLeft = getTimeUntilExpiry(authToken);
        console.log(`⏱️ Token expires in ${Math.floor(timeLeft / 60)} minutes`);
      }
    }, 60000); // Check every minute
  };

  useEffect(() => {
    // Register logout callback with API service
    setLogoutCallback(logout);

    // Khôi phục và validate thông tin đăng nhập từ localStorage
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('userData');
      
      if (savedToken && savedUser && savedToken !== 'null' && savedToken !== 'undefined') {
        // Check if token is expired first
        if (isTokenExpired(savedToken)) {
          console.log('❌ Token is expired');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setIsLoading(false);
          return;
        }

        try {
          const userData = JSON.parse(savedUser);
          
          // Validate token by calling a protected endpoint
          try {
            await axios.get('http://localhost:5000/api/auth/profile', {
              headers: {
                Authorization: `Bearer ${savedToken}`
              }
            });
            
            // Token is valid, restore session
            console.log('✅ Token is valid, restoring session...');
            setToken(savedToken);
            setUser(userData);
            
            // Start periodic token expiry check
            startTokenExpiryCheck(savedToken);
          } catch (error: any) {
            // Token is invalid or expired
            console.log('❌ Token validation failed:', error.response?.status);
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
        }
      }
      
      setIsLoading(false);
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      if (tokenCheckInterval.current) {
        clearInterval(tokenCheckInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (userData: User, authToken: string) => {
    console.log('✅ User logged in:', userData.username, 'Role:', userData.role);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Start periodic token expiry check
    startTokenExpiryCheck(authToken);
    
    // Dispatch event to update UI components
    window.dispatchEvent(new Event('authChanged'));
    window.dispatchEvent(new Event('cartUpdated'));
    window.dispatchEvent(new Event('wishlistUpdated'));
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
    window.dispatchEvent(new Event('authChanged'));
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        updateUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};