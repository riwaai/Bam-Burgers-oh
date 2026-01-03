import React from 'react';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_bamburger/artifacts/n9z16qz8_Logo.png';
const RESTAURANT_ADDRESS = 'Kitchen Park Salwa - 834C+HH Rumaithiya, Kuwait';
const RESTAURANT_PHONE = '+965 9474 5424';

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate loyalty points (1 point per 1 KWD spent)
  const loyaltyPoints = Math.floor(order.total_amount);

  return (
    <div className="bg-white p-4 text-black text-sm font-mono" style={{ width: '300px' }}>
      {/* Header with Logo */}
      <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
        <img src={LOGO_URL} alt="Bam Burgers" className="h-16 mx-auto mb-2" />
        <p className="text-xs">{RESTAURANT_ADDRESS}</p>
        <p className="text-xs">{RESTAURANT_PHONE}</p>
      </div>

      {/* Order Info */}
      <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
        <div className="flex justify-between">
          <span>Order #:</span>
          <span className="font-bold">{order.order_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(order.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span>Type:</span>
          <span>{order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="uppercase">{order.status?.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
        <p className="font-bold mb-1">Customer:</p>
        <p>{order.customer_name}</p>
        <p>{order.customer_phone}</p>
        {order.order_type === 'delivery' && order.delivery_address && (
          <p className="text-xs mt-1">{formatAddress(order.delivery_address)}</p>
        )}
      </div>

      {/* Order Items */}
      <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
        <p className="font-bold mb-2">Items:</p>
        {order.items?.map((item, idx) => (
          <div key={idx} className="mb-2">
            <div className="flex justify-between">
              <span>
                {item.quantity}x {item.item_name_en}
              </span>
              <span>{item.total_price?.toFixed(3)}</span>
            </div>
            {item.item_name_ar && (
              <p className="text-xs text-gray-600 text-right">{item.item_name_ar}</p>
            )}
            {item.notes && (
              <p className="text-xs text-orange-600">* {item.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-b border-dashed border-gray-400 pb-4 mb-4">
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
        <div className="flex justify-between">
          <span>Delivery Fee:</span>
          <span>{order.delivery_fee?.toFixed(3)} KWD</span>
        </div>
        <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-400">
          <span>TOTAL:</span>
          <span>{order.total_amount?.toFixed(3)} KWD</span>
        </div>
      </div>

      {/* Loyalty Points */}
      <div className="border-b border-dashed border-gray-400 pb-4 mb-4 text-center">
        <p className="text-xs">Loyalty Points Earned</p>
        <p className="font-bold text-lg">+{loyaltyPoints} points</p>
      </div>

      {/* Payment Status */}
      <div className="text-center mb-4">
        <p className="text-xs">Payment Status:</p>
        <p className="font-bold uppercase">Cash on Delivery</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs">
        <p className="mb-2">--------------------------------</p>
        <p className="font-bold">Thank you for choosing</p>
        <p className="font-bold">Bam Burgers!</p>
        <p className="mt-2">شكراً لاختياركم بام برجر</p>
        <p className="mt-4">www.bamburgers.com</p>
      </div>
    </div>
  );
};

export default OrderReceipt;
