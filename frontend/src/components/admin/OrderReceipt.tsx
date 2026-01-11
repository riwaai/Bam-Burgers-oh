import React from 'react';
import { RESTAURANT_NAME } from '@/integrations/supabase/client';

interface OrderItemModifier {
  modifier_name_en: string;
  modifier_name_ar?: string;
  price: number;
  quantity?: number;
}

interface OrderReceiptProps {
  order: {
    id: string;
    order_number: string;
    order_type: string;
    status: string;
    customer_name: string;
    customer_phone: string;
    delivery_address?: {
      area?: string;
      block?: string;
      street?: string;
      building?: string;
      floor?: string;
      apartment?: string;
      additional_directions?: string;
    } | null;
    subtotal: number;
    discount_amount: number;
    delivery_fee: number;
    total_amount: number;
    notes?: string | null;
    created_at: string;
    items?: {
      id?: string;
      item_name_en: string;
      item_name_ar?: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      notes?: string;
      modifiers?: OrderItemModifier[];
    }[];
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

// Get current time in user's local timezone
const getCurrentTime = () => {
  return new Date().toLocaleString('en-GB', {
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

  // Calculate totals
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  
  // Calculate item total including modifiers
  const getItemTotal = (item: any) => {
    const modifiersTotal = (item.modifiers || []).reduce((sum: number, mod: OrderItemModifier) => 
      sum + (mod.price * (mod.quantity || 1)), 0
    );
    return item.total_price + (modifiersTotal * item.quantity);
  };

  return (
    <div className="bg-white p-4 text-black text-sm print-receipt" style={{ width: '80mm', maxWidth: '80mm', fontFamily: 'Courier New, monospace' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <p className="font-bold text-xl">{RESTAURANT_NAME}</p>
        <p className="text-xs">Salwa, Kuwait</p>
        <p className="text-xs">Printed: {getCurrentTime()}</p>
        <p className="text-xs text-gray-500">Order Time: {formatKuwaitDate(order.created_at)}</p>
      </div>

      {/* Bill Info */}
      <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
        <p className="font-bold">Quick Bill</p>
        <p className="font-bold text-xl">Bill No: {order.order_number.split('-').pop()}</p>
        <p className="text-xs uppercase">{order.order_type}</p>
      </div>

      {/* Customer Info */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 text-xs">
        <p><strong>Customer:</strong> {order.customer_name || 'Guest'}</p>
        <p><strong>Phone:</strong> {order.customer_phone || 'N/A'}</p>
      </div>

      {/* Items Table Header */}
      <div className="border-b border-gray-300 pb-2 mb-2">
        <div className="grid grid-cols-12 text-xs font-bold">
          <div className="col-span-5">Item / غرض</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-3 text-right">Total</div>
        </div>
      </div>

      {/* Order Items with Modifiers */}
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
            
            {/* Modifiers/Add-ons */}
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="ml-2 mt-1">
                {item.modifiers.map((mod, modIdx) => (
                  <div key={modIdx} className="grid grid-cols-12 text-xs text-orange-700">
                    <div className="col-span-7">+ {mod.modifier_name_en}</div>
                    <div className="col-span-5 text-right">
                      {mod.price > 0 ? `+${mod.price.toFixed(3)}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Item Notes */}
            {item.notes && (
              <p className="text-xs text-orange-600 mt-1 italic">* {item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="border-b border-dashed border-gray-400 pb-3 mb-3 text-sm">
        <div className="flex justify-between">
          <span>Items:</span>
          <span>{totalItems}</span>
        </div>
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{order.subtotal?.toFixed(3)} KWD</span>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount:</span>
            <span>-{order.discount_amount?.toFixed(3)} KWD</span>
          </div>
        )}
        {order.delivery_fee > 0 && (
          <div className="flex justify-between">
            <span>Delivery:</span>
            <span>{order.delivery_fee?.toFixed(3)} KWD</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="text-center py-4 bg-gray-100 -mx-6 px-6 mb-4">
        <p className="font-bold text-lg">Grand Total</p>
        <p className="text-right font-bold" dir="rtl">المجموع الإجمالي</p>
        <p className="font-bold text-2xl mt-2">د.ك {order.total_amount?.toFixed(3)}</p>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="border-t border-dashed border-gray-400 pt-3 mb-3 text-xs">
          <p className="font-bold">Order Notes:</p>
          <p className="text-orange-700">{order.notes}</p>
        </div>
      )}

      {/* Delivery Address */}
      {order.order_type === 'delivery' && order.delivery_address && (
        <div className="border-t border-dashed border-gray-400 pt-3 mt-3 text-xs">
          <p className="font-bold mb-1">Delivery To / التوصيل إلى:</p>
          <p>{order.customer_name}</p>
          <p>{order.customer_phone}</p>
          <p>{formatAddress(order.delivery_address)}</p>
          {order.delivery_address.additional_directions && (
            <p className="text-gray-600 italic mt-1">{order.delivery_address.additional_directions}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs mt-4 pt-4 border-t border-gray-300">
        <p className="mb-2">--------------------------------</p>
        <p className="font-bold">Thank you for choosing</p>
        <p className="font-bold">{RESTAURANT_NAME}!</p>
        <p className="mt-2" dir="rtl">شكراً لاختياركم بام برجر</p>
        <p className="mt-4 text-gray-500">Powered by RIWA POS</p>
      </div>
    </div>
  );
};

export default OrderReceipt;
