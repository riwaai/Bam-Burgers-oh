/**
 * Receipt Utility for Bam Burgers
 * Supports 80mm thermal printers
 * Works with USB, Ethernet, and Cloud printing via browser print dialog
 * All times displayed in Kuwait Time (UTC+3)
 */

import { formatKuwaitTime, toKuwaitTime } from './operatingHours';

// Restaurant Info
const RESTAURANT_NAME = 'Bam Burgers';
const RESTAURANT_NAME_AR = 'بام برجر';
const RESTAURANT_LOCATION = 'Salwa, Kuwait';
const POWERED_BY = 'RIWA POS';

/**
 * Format date in Kuwait time
 */
const formatReceiptDate = (dateStr: string) => {
  const kuwaitDate = toKuwaitTime(new Date(dateStr));
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = kuwaitDate.getUTCDate();
  const month = months[kuwaitDate.getUTCMonth()];
  const year = kuwaitDate.getUTCFullYear();
  return `${day} ${month} ${year}`;
};

const formatReceiptTime = (dateStr: string) => {
  return formatKuwaitTime(new Date(dateStr), false);
};

interface OrderItem {
  item_name_en?: string;
  item_name_ar?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  modifiers?: Array<{
    modifier_name_en?: string;
    modifier_name_ar?: string;
    price?: number;
  }>;
}

interface Order {
  order_number: string;
  order_type: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  items?: OrderItem[];
  subtotal: number;
  discount_amount?: number;
  delivery_fee?: number;
  total_amount: number;
  payment_status?: string;
  transaction_id?: string;
  created_at: string;
  notes?: string;
}

/**
 * Generate receipt HTML for 80mm thermal printer
 */
export const generateReceiptHTML = (order: Order): string => {
  const dateStr = formatReceiptDate(order.created_at);
  const timeStr = formatReceiptTime(order.created_at);
  const orderType = order.order_type?.toUpperCase() || 'PICKUP';
  const billNo = order.order_number?.replace(/^#/, '') || '0000';

  // Build items HTML
  let itemsHTML = '';
  let totalQty = 0;
  
  (order.items || []).forEach((item) => {
    const qty = item.quantity || 1;
    const rate = (item.unit_price || 0).toFixed(3);
    const total = (item.total_price || 0).toFixed(3);
    totalQty += qty;

    const itemName = item.item_name_en || 'Item';
    const itemNameAr = item.item_name_ar || '';

    itemsHTML += `
      <tr>
        <td class="item-name">
          ${itemName}
          ${itemNameAr ? `<br><span class="arabic">${itemNameAr}</span>` : ''}
    `;

    // Add modifiers
    if (item.modifiers && item.modifiers.length > 0) {
      item.modifiers.forEach((mod) => {
        const modPrice = mod.price ? `+${mod.price.toFixed(3)}` : '';
        itemsHTML += `<br><span class="modifier">+ ${mod.modifier_name_en || ''} ${modPrice}</span>`;
      });
    }

    // Add notes
    if (item.notes) {
      itemsHTML += `<br><span class="item-notes">Note: ${item.notes}</span>`;
    }

    itemsHTML += `
        </td>
        <td class="qty">${qty}</td>
        <td class="rate">${rate}</td>
        <td class="total">${total}</td>
      </tr>
    `;
  });

  const subtotal = (order.subtotal || 0).toFixed(3);
  const discountAmount = order.discount_amount || 0;
  const deliveryFee = order.delivery_fee || 0;
  const grandTotal = (order.total_amount || 0).toFixed(3);

  const isPaid = order.payment_status === 'paid';
  const paymentInfo = isPaid ? `Online Payment (${order.transaction_id || ''})` : 'Cash on Delivery';

  return `
<!DOCTYPE html>
<html dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Receipt #${billNo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: 80mm auto;
      margin: 0;
    }
    @media print {
      body {
        width: 80mm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
      width: 80mm;
      max-width: 80mm;
      padding: 5mm;
      background: white;
      color: black;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid black;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .restaurant-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    .location {
      font-size: 12px;
      color: #333;
      font-weight: bold;
    }
    .date-time {
      font-size: 12px;
      margin-top: 4px;
      font-weight: bold;
    }
    .arabic {
      font-family: 'Arial', 'Tahoma', sans-serif;
      direction: rtl;
      font-weight: bold;
    }
    .bill-info {
      text-align: center;
      margin: 10px 0;
    }
    .quick-bill {
      font-size: 12px;
      font-weight: bold;
    }
    .bill-number {
      font-size: 20px;
      font-weight: bold;
      margin: 4px 0;
    }
    .order-type {
      font-size: 13px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .dashed {
      border-top: 1px dashed black;
      margin: 8px 0;
    }
    .customer-info {
      font-size: 12px;
      margin: 8px 0;
      font-weight: bold;
    }
    .customer-info p {
      margin: 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
    }
    th {
      text-align: left;
      font-size: 11px;
      border-bottom: 1px dashed black;
      padding: 4px 2px;    
    }
    th.qty, th.rate, th.total {
      text-align: right;
      font-weight: bold;
    }
    td {
      padding: 4px 2px;
      vertical-align: top;
      font-size: 11px;
      font-weight: bold;
    }
    td.item-name {
      max-width: 120px;
      font-weight: bold;
    }
    td.qty, td.rate, td.total {
      text-align: right;
      white-space: nowrap;
    }
    .modifier {
      font-size: 12px;
      color: #e67e22;
      font-weight: bold;
    }
    .item-notes {
      font-size: 12px;
      color: #666;
      font-style: italic;
      font-weight: bold;
    }
    .totals {
      margin: 8px 0;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin: 4px 0;
      font-weight: bold;
    }
    .totals-row.bold {
      font-weight: bold;
    }
    .totals-row.discount {
      color: #27ae60;
      font-weight: bold;
    }
    .grand-total {
      background: #f5f5f5;
      padding: 10px;
      margin: 10px 0;
      text-align: center;
      border-radius: 4px;
    }
    .grand-total-label {
      font-size: 14px;
      font-weight: bold;
    }
    .grand-total-arabic {
      font-family: 'Arial', 'Tahoma', sans-serif;
      direction: rtl;
      font-size: 12px;
      color: #333;
      font-weight: bold;
    }
    .grand-total-amount {
      font-size: 24px;
      font-weight: bold;
      margin-top: 5px;
    }
    .payment-info {
      text-align: center;
      font-size: 11px;
      color: #666;
      margin: 8px 0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed black;
      font-weight: bold;
    }
    .thank-you {
      font-size: 11px;
      font-weight: bold;
    }
    .thank-you-ar {
      font-family: 'Arial', 'Tahoma', sans-serif;
      direction: rtl;
      font-size: 11px;
      margin-top: 4px;
      font-weight: bold;
    }
    .powered-by {
      font-size: 11px;
      color: #999;
      margin-top: 8px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="restaurant-name">${RESTAURANT_NAME}</div>
    <div class="location">${RESTAURANT_LOCATION}</div>
    <div class="date-time">${dateStr} at ${timeStr}</div>
  </div>

  <div class="bill-info">
    <div class="quick-bill">Quick Bill</div>
    <div class="bill-number">Bill No: ${billNo}</div>
    <div class="order-type">${orderType}</div>
  </div>

  <div class="dashed"></div>

  <div class="customer-info">
    ${order.customer_name ? `<p><strong>Customer:</strong> ${order.customer_name}</p>` : ''}
    ${order.customer_phone ? `<p><strong>Phone:</strong> ${order.customer_phone}</p>` : ''}
  </div>

  <div class="dashed"></div>

  <table>
    <thead>
      <tr>
        <th>Item / <span class="arabic">غرض</span></th>
        <th class="qty">Qty</th>
        <th class="rate">Rate</th>
        <th class="total">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="dashed"></div>

  <div class="totals">
    <div class="totals-row">
      <span>Items:</span>
      <span>${totalQty}</span>
    </div>
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${subtotal} KWD</span>
    </div>
    ${discountAmount > 0 ? `
    <div class="totals-row discount">
      <span>Discount:</span>
      <span>-${discountAmount.toFixed(3)} KWD</span>
    </div>
    ` : ''}
    ${deliveryFee > 0 ? `
    <div class="totals-row">
      <span>Delivery Fee:</span>
      <span>${deliveryFee.toFixed(3)} KWD</span>
    </div>
    ` : ''}
  </div>

  <div class="grand-total">
    <div class="grand-total-label">Grand Total</div>
    <div class="grand-total-arabic">المجموع الإجمالي</div>
    <div class="grand-total-amount">د.ك ${grandTotal}</div>
  </div>

  <div class="payment-info">
    ${paymentInfo}
  </div>

  ${order.notes ? `
  <div class="dashed"></div>
  <div style="font-size: 10px; text-align: center;">
    <strong>Notes:</strong> ${order.notes}
  </div>
  ` : ''}

  <div class="footer">
    <div class="thank-you">Thank you for choosing</div>
    <div class="thank-you">${RESTAURANT_NAME}!</div>
    <div class="thank-you-ar">شكراً لاختياركم ${RESTAURANT_NAME_AR}</div>
    <div class="powered-by">Powered by ${POWERED_BY}</div>
  </div>
</body>
</html>
  `;
};

/**
 * Print receipt with auto-print
 */
export const printReceipt = (order: Order): void => {
  const receiptHTML = generateReceiptHTML(order);
  
  // Create print window
  const printWindow = window.open('', '_blank', 'width=320,height=600,menubar=no,toolbar=no,location=no,status=no');
  
  if (!printWindow) {
    console.error('Failed to open print window. Check popup blocker.');
    // Fallback to iframe
    printViaIframe(receiptHTML);
    return;
  }

  printWindow.document.write(receiptHTML);
  printWindow.document.close();

  // Auto-print when content loads
  printWindow.onload = () => {
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.error('Print error:', e);
      }
      
      // Close window after print dialog
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 100);
  };
};

/**
 * Fallback print method using iframe
 */
const printViaIframe = (html: string): void => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:80mm;height:auto;';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument;
  if (iframeDoc) {
    iframeDoc.write(html);
    iframeDoc.close();
    
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 100);
    };
  }
};

/**
 * Download receipt as PNG using html2canvas
 */
export const downloadReceiptPNG = async (receiptElement: HTMLElement, orderNumber: string): Promise<void> => {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(receiptElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    });
    
    const link = document.createElement('a');
    link.download = `receipt-${orderNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error('Download error:', err);
    throw err;
  }
};

export default {
  generateReceiptHTML,
  printReceipt,
  downloadReceiptPNG,
};
