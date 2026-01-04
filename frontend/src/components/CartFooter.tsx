import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { ShoppingBag } from 'lucide-react';

const CartFooter: React.FC = () => {
  const { items, total, itemCount } = useCart();
  const navigate = useNavigate();

  if (itemCount === 0) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#C8102E] text-white shadow-lg cursor-pointer"
      onClick={() => navigate('/checkout')}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#9B0D24] rounded-lg flex items-center justify-center font-bold text-lg">
            {itemCount}
          </div>
          <span className="font-medium text-lg">View Cart</span>
        </div>
        <div className="font-bold text-xl">
          {total.toFixed(3)} KWD
        </div>
      </div>
    </div>
  );
};

export default CartFooter;
