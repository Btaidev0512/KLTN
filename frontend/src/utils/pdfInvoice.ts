import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderData {
  order_code: string;
  created_at: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_ward: string;
  shipping_district: string;
  shipping_province: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  total_amount: number;
  discount_amount: number;
  shipping_fee: number;
  final_amount: number;
  items: OrderItem[];
  notes?: string | null;
}

export const generateInvoicePDF = (order: OrderData) => {
  const doc = new jsPDF();
  
  // Configure font for Vietnamese
  doc.setFont('helvetica');
  
  // Header - Company Logo & Info
  doc.setFontSize(22);
  doc.setTextColor(255, 107, 53); // Orange color #FF6B35
  doc.text('VNBSPORTS', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Cua hang cau long chuyen nghiep', 105, 27, { align: 'center' });
  doc.text('Hotline: 0901 234 567', 105, 32, { align: 'center' });
  
  // Invoice Title
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text('HOA DON BAN HANG', 105, 45, { align: 'center' });
  
  // Order Info
  doc.setFontSize(10);
  doc.text(`Ma don hang: ${order.order_code}`, 14, 55);
  doc.text(`Ngay dat: ${new Date(order.created_at).toLocaleString('vi-VN')}`, 14, 61);
  doc.text(`Trang thai: ${getStatusLabel(order.order_status)}`, 14, 67);
  
  // Customer Info
  doc.setFontSize(12);
  doc.setTextColor(255, 107, 53);
  doc.text('Thong tin khach hang', 14, 77);
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Ten: ${order.shipping_name}`, 14, 84);
  doc.text(`Dien thoai: ${order.shipping_phone}`, 14, 90);
  const fullAddress = `${order.shipping_address}, ${order.shipping_ward}, ${order.shipping_district}, ${order.shipping_province}`;
  const addressLines = doc.splitTextToSize(`Dia chi: ${fullAddress}`, 180);
  doc.text(addressLines, 14, 96);
  
  // Products Table
  const tableStartY = 96 + (addressLines.length * 6) + 5;
  
  autoTable(doc, {
    startY: tableStartY,
    head: [['STT', 'San pham', 'So luong', 'Don gia', 'Thanh tien']],
    body: order.items.map((item, index) => [
      (index + 1).toString(),
      item.product_name,
      item.quantity.toString(),
      formatPrice(item.price),
      formatPrice(item.subtotal)
    ]),
    headStyles: {
      fillColor: [255, 107, 53],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });
  
  // Summary Section
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text('Tam tinh:', 140, finalY);
  doc.text(formatPrice(order.total_amount), 190, finalY, { align: 'right' });
  
  if (order.discount_amount > 0) {
    doc.text('Giam gia:', 140, finalY + 6);
    doc.text(`-${formatPrice(order.discount_amount)}`, 190, finalY + 6, { align: 'right' });
  }
  
  doc.text('Phi van chuyen:', 140, finalY + (order.discount_amount > 0 ? 12 : 6));
  doc.text(formatPrice(order.shipping_fee), 190, finalY + (order.discount_amount > 0 ? 12 : 6), { align: 'right' });
  
  // Total
  doc.setFontSize(12);
  doc.setTextColor(255, 107, 53);
  const totalY = finalY + (order.discount_amount > 0 ? 22 : 16);
  doc.text('TONG CONG:', 140, totalY);
  doc.text(formatPrice(order.final_amount), 190, totalY, { align: 'right' });
  
  // Payment Info
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`Phuong thuc thanh toan: ${getPaymentMethodLabel(order.payment_method)}`, 14, totalY + 10);
  doc.text(`Trang thai thanh toan: ${getPaymentStatusLabel(order.payment_status)}`, 14, totalY + 16);
  
  // Notes
  if (order.notes) {
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Ghi chu: ${order.notes}`, 14, totalY + 26);
  }
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  const footerY = 280;
  doc.text('Cam on quy khach da mua hang tai VNBSports!', 105, footerY, { align: 'center' });
  doc.text('Hotline: 0901 234 567 | Email: support@vnbsports.vn', 105, footerY + 5, { align: 'center' });
  
  // Save PDF
  doc.save(`hoa-don-${order.order_code}.pdf`);
};

const formatPrice = (price: number): string => {
  const formatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
  return formatted.replace('₫', 'd');
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'Cho xac nhan',
    'confirmed': 'Da xac nhan',
    'processing': 'Dang xu ly',
    'shipping': 'Dang giao',
    'delivered': 'Da giao',
    'completed': 'Hoan thanh',
    'cancelled': 'Da huy',
    'refunded': 'Da hoan tien'
  };
  return labels[status] || status;
};

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    'cod': 'Thanh toan khi nhan hang (COD)',
    'bank_transfer': 'Chuyen khoan ngan hang',
    'credit_card': 'The tin dung/ghi no',
    'momo': 'Vi MoMo',
    'zalopay': 'ZaloPay'
  };
  return labels[method] || method;
};

const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'Chua thanh toan',
    'paid': 'Da thanh toan',
    'refunded': 'Da hoan tien'
  };
  return labels[status] || status;
};
