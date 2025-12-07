// Store recently viewed products in localStorage
const STORAGE_KEY = 'vnbsports_recently_viewed';
const MAX_ITEMS = 8;

interface RecentlyViewedProduct {
  product_id: number;
  product_name: string;
  product_slug: string;
  base_price: number;
  sale_price?: number;
  image_url: string;
  viewed_at: number;
}

export const addToRecentlyViewed = (product: Omit<RecentlyViewedProduct, 'viewed_at'>) => {
  try {
    const existing = getRecentlyViewed();
    
    // Remove if already exists
    const filtered = existing.filter(p => p.product_id !== product.product_id);
    
    // Add to beginning
    const updated = [
      { ...product, viewed_at: Date.now() },
      ...filtered
    ].slice(0, MAX_ITEMS); // Keep only MAX_ITEMS
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recently viewed:', error);
  }
};

export const getRecentlyViewed = (): RecentlyViewedProduct[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const items: RecentlyViewedProduct[] = JSON.parse(data);
    
    // Filter out items older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = items.filter(item => item.viewed_at > thirtyDaysAgo);
    
    // Save filtered list
    if (filtered.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
    
    return filtered;
  } catch (error) {
    console.error('Error getting recently viewed:', error);
    return [];
  }
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};

export const getRecentlyViewedExcept = (productId: number): RecentlyViewedProduct[] => {
  return getRecentlyViewed().filter(p => p.product_id !== productId);
};
