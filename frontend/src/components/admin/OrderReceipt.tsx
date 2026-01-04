import React from 'react';
import { LOGO_URL, RESTAURANT_ADDRESS, RESTAURANT_PHONE, RESTAURANT_NAME } from '@/integrations/supabase/client';

interface OrderReceiptProps {
  order: {
    id: string;
    order_number: string;
    order_type: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    delivery_address?: any;
    subtotal: number;
    discount_amount: number;
    delivery_fee: number;
    total_amount: number;
    notes?: string | null;
    created_at: string;
    items?: any[];
  };
}

// Format date in Kuwait time (UTC+3)
const formatKuwaitDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    timeZone: 'Asia/Kuwait',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const OrderReceipt: React.FC<OrderReceiptProps> = ({ order }) => {
  const formatAddress = (address: any) => {
    if (!address) return '';
    const parts = [
      address.area,
      address.block ? `Block ${address.block}` : '',
      address.street,
      address.building ? `Building ${address.building}` : '',
      address.floor ? `Floor ${address.floor}` : '',
      address.apartment ? `Apt ${address.apartment}` : '',
    ].filter(Boolean);
    return parts.join(', ');
  };

  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="bg-white p-6 text-black text-sm" style={{ width: '320px', fontFamily: 'monospace' }}>
      {/* Header with Logo */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <img src={LOGO_URL} alt="Bam" className="h-16 mx-auto mb-2" />
        <p className="font-bold text-lg">{RESTAURANT_NAME}</p>
        <p className="text-xs">Salwa</p>
        <p className="text-xs">{formatKuwaitDate(order.created_at)}</p>
      </div>

      {/* Bill Info */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <p className="font-bold">Quick Bill</p>
        <p className="font-bold text-xl">Bill No:{order.order_number.split('-').pop()}</p>
        <p className="text-sm">Quick Bill: {order.order_number.split('-').pop()}</p>
      </div>

      {/* User and Payment Info */}
      <div className="flex justify-between border-b border-dashed border-gray-400 pb-3 mb-3 text-xs">
        <div>
          <p className="font-bold">Quick Bill</p>
          <p>Pay Mode: Cash</p>
        </div>
        <div className="text-right">
          <p>User: {order.customer_name || 'bamburger1'}</p>
        </div>
      </div>

      {/* Items Table Header */}
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="grid grid-cols-12 text-xs font-bold">
          <div className="col-span-5">Item / غرض</div>
          <div className="col-span-2 text-center">Qty / الكمية</div>
          <div className="col-span-2 text-right">Rate / السعر</div>
          <div className="col-span-3 text-right">Total / الإجمالي</div>
        </div>
      </div>

      {/* Order Items */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        {order.items?.map((item, idx) => (
          <div key={idx} className="mb-3">
            <div className="grid grid-cols-12 text-xs">
              <div className="col-span-5">
                <p className="font-medium">{item.item_name_en}</p>
                {item.item_name_ar && (
                  <p className="text-gray-600 text-right" dir="rtl">{item.item_name_ar}</p>
                )}
              </div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-2 text-right">{item.unit_price?.toFixed(3)}</div>
              <div className="col-span-3 text-right">{item.total_price?.toFixed(3)}</div>
            </div>
            {item.notes && (
              <p className="text-xs text-orange-600 mt-1">* {item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3">
        <div className="flex justify-between text-sm font-bold">
          <span>Total:</span>
          <span>{totalItems}</span>
          <span>د.ك {order.subtotal?.toFixed(3)}</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="text-center py-4 bg-gray-100 -mx-6 px-6 mb-4">
        <p className="font-bold text-lg">Grand Total</p>
        <p className="text-right font-bold" dir="rtl">المجموع الإجمالي</p>
        <p className="font-bold text-2xl mt-2">د.ك {order.total_amount?.toFixed(3)}</p>
      </div>

      {/* Discount if any */}
      {order.discount_amount > 0 && (
        <div className="flex justify-between text-sm text-green-600 mb-2">
          <span>Discount / الخصم:</span>
          <span>-{order.discount_amount?.toFixed(3)} KWD</span>
        </div>
      )}

      {/* Delivery Fee if any */}
      {order.delivery_fee > 0 && (
        <div className="flex justify-between text-sm mb-2">
          <span>Delivery Fee / رسوم التوصيل:</span>
          <span>{order.delivery_fee?.toFixed(3)} KWD</span>
        </div>
      )}

      {/* Customer Info if delivery */}
      {order.order_type === 'delivery' && order.delivery_address && (
        <div className="border-t border-dashed border-gray-400 pt-3 mt-3 text-xs">
          <p className="font-bold mb-1">Delivery To / التوصيل إلى:</p>
          <p>{order.customer_name}</p>
          <p>{order.customer_phone}</p>
          <p>{formatAddress(order.delivery_address)}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs mt-4 pt-4 border-t border-gray-300">
        <p className="mb-2">--------------------------------</p>
        <p className="font-bold">Thank you for choosing</p>
        <p className="font-bold">{RESTAURANT_NAME}!</p>
        <p className="mt-2" dir="rtl">شكراً لاختياركم بام برجر</p>
        <p className="mt-4 text-gray-500">Powered by TMBill v7.4.100</p>
      </div>
    </div>
  );
};

export default OrderReceipt;
