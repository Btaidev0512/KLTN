interface DecodedToken {
  id: number;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Decode JWT token without verification (client-side only)
 */
const decodeToken = (token: string): DecodedToken | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired (with 5 minute buffer)
    return decoded.exp < (currentTime + 300);
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true;
  }
};

/**
 * Get token expiry time
 */
export const getTokenExpiry = (token: string | null): Date | null => {
  if (!token) return null;

  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return null;
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiry:', error);
    return null;
  }
};

/**
 * Get time until token expires (in seconds)
 */
export const getTimeUntilExpiry = (token: string | null): number => {
  if (!token) return 0;

  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return 0;
    
    const currentTime = Date.now() / 1000;
    return Math.max(0, decoded.exp - currentTime);
  } catch (error) {
    console.error('Error getting time until expiry:', error);
    return 0;
  }
};

/**
 * Validate token format and structure
 */
export const isValidTokenFormat = (token: string | null): boolean => {
  if (!token) return false;
  
  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    const decoded = decodeToken(token);
    return decoded !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get user info from token
 */
export const getUserFromToken = (token: string | null): Partial<DecodedToken> | null => {
  if (!token) return null;
  
  try {
    return decodeToken(token);
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};
