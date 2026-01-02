import { useState, useEffect, useCallback } from 'react';

// Backend API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Order status flow: pending -> accepted -> preparing -> ready -> out_for_delivery -> delivered
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  item_id: string;
  item_name_en: string;
  item_name_ar: string;
  unit_price: number;
  quantity: number;
  modifiers?: any[];
  notes?: string;
  total_price: number;
}

export interface Order {
  id: string;
  tenant_id: string;
  branch_id: string;
  order_number: string;
  order_type: string;
  channel: string;
  customer_id?: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: any;
  delivery_instructions: string | null;
  subtotal: number;
  tax_amount: number;
  service_charge: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: string;
  notes: string | null;
  items?: OrderItem[];
  created_at: string;
  accepted_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
  source?: string;
}

// Hook to track an order with polling for updates (since MongoDB doesn't support realtime)
export function useOrderTracking(orderId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found');
          return;
        }
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      setOrder(data as Order);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);

    return () => clearInterval(interval);
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}

// Hook to get order by order number
export function useOrderByNumber(orderNumber: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/number/${orderNumber}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Order not found');
          return;
        }
        throw new Error('Failed to fetch order');
      }
      
      const data = await response.json();
      setOrder(data as Order);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    fetchOrder();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);

    return () => clearInterval(interval);
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
}

// Hook to get all orders for admin
export function useAdminOrders(status?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      let url = `${BACKEND_URL}/api/admin/orders`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data as Order[]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchOrders();

    // Poll for updates every 5 seconds for admin
    const interval = setInterval(fetchOrders, 5000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

// Function to update order status
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status?status=${status}`, {
      method: 'PATCH',
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order status');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    return false;
  }
}
