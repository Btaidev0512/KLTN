/**
 * Format giá tiền theo chuẩn Việt Nam
 * @param price - Giá tiền (number hoặc string)
 * @returns Chuỗi giá đã format, ví dụ: "1.809.000 ₫"
 */
export const formatPrice = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null || price === '') {
    return '0 ₫';
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0 ₫';
  }
  
  // Format theo chuẩn Việt Nam: dấu chấm phân cách hàng ngàn
  return numPrice.toLocaleString('vi-VN') + ' ₫';
};

/**
 * Format giá tiền ngắn gọn (không có ₫)
 */
export const formatPriceNumber = (price: number | string | undefined | null): string => {
  if (price === undefined || price === null || price === '') {
    return '0';
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0';
  }
  
  return numPrice.toLocaleString('vi-VN');
};
