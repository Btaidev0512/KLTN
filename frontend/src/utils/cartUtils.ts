// Cart and Wishlist utility functions

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
}

// Cart functions
export const getCartItems = (): CartItem[] => {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error getting cart items:', error);
    return [];
  }
};

export const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1): void => {
  try {
    const cart = getCartItems();
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += quantity;
    } else {
      cart.push({ ...item, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Dispatch custom event to notify components
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

export const removeFromCart = (itemId: string): void => {
  try {
    const cart = getCartItems();
    const updatedCart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
};

export const updateCartItemQuantity = (itemId: string, quantity: number): void => {
  try {
    const cart = getCartItems();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      if (quantity <= 0) {
        removeFromCart(itemId);
      } else {
        cart[itemIndex].quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));
      }
    }
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
  }
};

export const getCartCount = (): number => {
  const cart = getCartItems();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

export const getCartTotal = (): number => {
  const cart = getCartItems();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const clearCart = (): void => {
  try {
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};

// Wishlist functions
export const getWishlistItems = (): WishlistItem[] => {
  try {
    const wishlist = localStorage.getItem('wishlist');
    return wishlist ? JSON.parse(wishlist) : [];
  } catch (error) {
    console.error('Error getting wishlist items:', error);
    return [];
  }
};

export const addToWishlist = (item: WishlistItem): void => {
  try {
    const wishlist = getWishlistItems();
    const existingItem = wishlist.find(wishlistItem => wishlistItem.id === item.id);
    
    if (!existingItem) {
      wishlist.push(item);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      window.dispatchEvent(new Event('wishlistUpdated'));
    }
  } catch (error) {
    console.error('Error adding to wishlist:', error);
  }
};

export const removeFromWishlist = (itemId: string): void => {
  try {
    const wishlist = getWishlistItems();
    const updatedWishlist = wishlist.filter(item => item.id !== itemId);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event('wishlistUpdated'));
  } catch (error) {
    console.error('Error removing from wishlist:', error);
  }
};

export const isInWishlist = (itemId: string): boolean => {
  const wishlist = getWishlistItems();
  return wishlist.some(item => item.id === itemId);
};

export const toggleWishlist = (item: WishlistItem): boolean => {
  const inWishlist = isInWishlist(item.id);
  
  if (inWishlist) {
    removeFromWishlist(item.id);
    return false;
  } else {
    addToWishlist(item);
    return true;
  }
};

export const getWishlistCount = (): number => {
  return getWishlistItems().length;
};

export const clearWishlist = (): void => {
  try {
    localStorage.removeItem('wishlist');
    window.dispatchEvent(new Event('wishlistUpdated'));
  } catch (error) {
    console.error('Error clearing wishlist:', error);
  }
};