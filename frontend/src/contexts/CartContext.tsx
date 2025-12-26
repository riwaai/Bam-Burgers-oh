import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

// Modifier types
export interface Modifier {
  id: string;
  name: string;
  name_ar?: string;
  price: number;
  group_id: string;
  group_name: string;
}

export interface CartItemModifier {
  modifier: Modifier;
  quantity: number;
}

export interface CartItem {
  id: string; // unique cart item id
  menu_item_id: string;
  name: string;
  name_ar?: string;
  price: number;
  quantity: number;
  image: string;
  modifiers: CartItemModifier[];
  special_instructions?: string;
  total_price: number; // calculated with modifiers
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  itemCount: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  discount: number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate unique ID for cart items
const generateCartItemId = () => `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Storage key
const CART_STORAGE_KEY = 'bam-cart';
const COUPON_STORAGE_KEY = 'bam-coupon';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(() => {
    return localStorage.getItem(COUPON_STORAGE_KEY);
  });

  const [discount, setDiscount] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Persist coupon to localStorage
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, appliedCoupon);
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon]);

  const addItem = (item: Omit<CartItem, "id">) => {
    const newItem: CartItem = {
      ...item,
      id: generateCartItemId(),
    };

    setItems((prev) => [...prev, newItem]);
    toast.success(`${item.name} added to cart`);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.info("Item removed from cart");
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const modifiersTotal = i.modifiers.reduce(
            (sum, mod) => sum + mod.modifier.price * mod.quantity,
            0
          );
          const newTotalPrice = (i.price + modifiersTotal) * quantity;
          return { ...i, quantity, total_price: newTotalPrice };
        }
        return i;
      })
    );
  };

  const updateItem = (id: string, updates: Partial<CartItem>) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const updated = { ...i, ...updates };
          // Recalculate total price
          const modifiersTotal = updated.modifiers.reduce(
            (sum, mod) => sum + mod.modifier.price * mod.quantity,
            0
          );
          updated.total_price = (updated.price + modifiersTotal) * updated.quantity;
          return updated;
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
    setDiscount(0);
  };

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

  // Calculate item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Apply coupon (will be connected to Supabase later)
  const applyCoupon = async (code: string): Promise<boolean> => {
    // Mock coupon validation - will be replaced with Supabase query
    const mockCoupons: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {
      'SAVE10': { type: 'percentage', value: 10 },
      'SAVE20': { type: 'percentage', value: 20 },
      'FIRST50': { type: 'percentage', value: 50 },
      'FREE1': { type: 'fixed', value: 1 },
    };

    const upperCode = code.toUpperCase();
    const coupon = mockCoupons[upperCode];

    if (coupon) {
      setAppliedCoupon(upperCode);
      if (coupon.type === 'percentage') {
        setDiscount((subtotal * coupon.value) / 100);
      } else {
        setDiscount(coupon.value);
      }
      toast.success(`Coupon applied! ${coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toFixed(3)} KWD`} off`);
      return true;
    }

    toast.error("Invalid coupon code");
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    toast.info("Coupon removed");
  };

  // Recalculate discount when subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      // Re-validate coupon when subtotal changes
      const mockCoupons: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {
        'SAVE10': { type: 'percentage', value: 10 },
        'SAVE20': { type: 'percentage', value: 20 },
        'FIRST50': { type: 'percentage', value: 50 },
        'FREE1': { type: 'fixed', value: 1 },
      };

      const coupon = mockCoupons[appliedCoupon];
      if (coupon) {
        if (coupon.type === 'percentage') {
          setDiscount((subtotal * coupon.value) / 100);
        } else {
          setDiscount(Math.min(coupon.value, subtotal));
        }
      }
    }
  }, [subtotal, appliedCoupon]);

  // Calculate total
  const total = Math.max(0, subtotal - discount + deliveryFee);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateItem,
        clearCart,
        subtotal,
        total,
        itemCount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discount,
        deliveryFee,
        setDeliveryFee,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
