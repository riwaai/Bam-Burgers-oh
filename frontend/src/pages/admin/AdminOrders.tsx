import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Printer, Check, ChefHat, Package, Truck, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OrderReceipt from '@/components/admin/OrderReceipt';
import { useReactToPrint } from 'react-to-print';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: string;
  order_type: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: any;
  delivery_instructions: string | null;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  items?: any[];
}

const statusFlow: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Order Placed', color: 'bg-yellow-500', icon: Bell },
  accepted: { label: 'Accepted', color: 'bg-blue-500', icon: Check },
  preparing: { label: 'Preparing', color: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Ready', color: 'bg-purple-500', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-indigo-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-500', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-500', icon: BellOff },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const lastPendingCountRef = useRef(0);

  // Print handler
  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${selectedOrder?.order_number}`,
  });

  useEffect(() => {
    // Create audio element for buzzer
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQsZVrPq5bF+GQg1l+Ts8L2jLQAkhtXy+9TQVQAWadnu/+ThfgAMTcXy//zz0nkAFErI9P/99e+wYgAXRcL2//318MOADgA/QMHY9PL27ObYwYVxOSolMUBng6u9xcnExb6ypYpjPykVEB41WXuVq7W6tK6mmYpuUTQhGiEwSGF5i5ieoZ2YkYZ4Z1I+Lh8bJDZLXm54goiKiIWAeXBkVUU3KiAcIjBBUmJucHd6e3l2cm1nX1VKQDU1');  // Simple beep
    audioRef.current.loop = true;

    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${TENANT_ID}` },
        (payload) => {
          console.log('Order change:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Buzzer effect for pending orders
  useEffect(() => {
    const pendingCount = orders.filter((o) => o.status === 'pending').length;

    if (buzzerEnabled && pendingCount > 0 && pendingCount > lastPendingCountRef.current) {
      // New pending order - play buzzer
      audioRef.current?.play().catch(() => {});
      toast.warning('New order received!', { duration: 10000 });
    } else if (pendingCount === 0) {
      // No pending orders - stop buzzer
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
    }

    lastPendingCountRef.current = pendingCount;
  }, [orders, buzzerEnabled]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch items for each order
      const ordersWithItems = await Promise.all(
        (data || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);
          return { ...order, items: items || [] };
        })
      );

      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };

      if (newStatus === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      } else if (newStatus === 'delivered' || newStatus === 'cancelled') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${statusConfig[newStatus].label}`);
      fetchOrders();

      // Update selected order if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update order status');
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1];
  };

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    const parts = [
      address.area,
      address.block ? `Block ${address.block}` : '',
      address.street,
      address.building ? `Building ${address.building}` : '',
      address.floor ? `Floor ${address.floor}` : '',
      address.apartment ? `Apt ${address.apartment}` : '',
    ].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  const toggleBuzzer = () => {
    setBuzzerEnabled((prev) => {
      if (prev) {
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.currentTime = 0;
      }
      return !prev;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Button
          variant={buzzerEnabled ? 'default' : 'outline'}
          onClick={toggleBuzzer}
          className="gap-2"
        >
          {buzzerEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          Buzzer {buzzerEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Pending Orders Alert */}
      {orders.filter((o) => o.status === 'pending').length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded animate-pulse">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {orders.filter((o) => o.status === 'pending').length} pending order(s) waiting for acceptance!
            </span>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-12">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No orders yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            const nextStatus = getNextStatus(order.status);

            return (
              <Card
                key={order.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  order.status === 'pending' ? 'ring-2 ring-yellow-500 animate-pulse' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                    <Badge className={`${config.color} text-white`}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Type:</span>{' '}
                    <Badge variant="outline">
                      {order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold">{order.total_amount?.toFixed(3)} KWD</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowReceipt(false);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, nextStatus)}
                          className={statusConfig[nextStatus].color}
                        >
                          {statusConfig[nextStatus].label}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder && !showReceipt} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order #{selectedOrder.order_number}</span>
                  <Badge className={`${statusConfig[selectedOrder.status].color} text-white`}>
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {selectedOrder.customer_name}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone}</div>
                    {selectedOrder.customer_email && (
                      <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}</div>
                    )}
                  </div>
                </div>

                {/* Delivery Details */}
                {selectedOrder.order_type === 'delivery' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Delivery Address</h3>
                    <p className="text-sm">{formatAddress(selectedOrder.delivery_address)}</p>
                    {selectedOrder.delivery_instructions && (
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Instructions:</span> {selectedOrder.delivery_instructions}
                      </p>
                    )}
                  </div>
                )}

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.item_name_en}</p>
                          <p className="text-sm text-muted-foreground">{item.item_name_ar}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          {item.notes && <p className="text-sm text-orange-600">Note: {item.notes}</p>}
                        </div>
                        <span className="font-medium">{item.total_price?.toFixed(3)} KWD</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-1">Order Notes</h3>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Price Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{selectedOrder.subtotal?.toFixed(3)} KWD</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{selectedOrder.discount_amount?.toFixed(3)} KWD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{selectedOrder.delivery_fee?.toFixed(3)} KWD</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>{selectedOrder.total_amount?.toFixed(3)} KWD</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowReceipt(true)}
                    className="flex-1"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>
                  {getNextStatus(selectedOrder.status) && (
                    <Button
                      onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                      className={`flex-1 ${statusConfig[getNextStatus(selectedOrder.status)!].color}`}
                    >
                      Mark as {statusConfig[getNextStatus(selectedOrder.status)!].label}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={() => setShowReceipt(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Print Receipt</DialogTitle>
          </DialogHeader>
          <div ref={receiptRef}>
            {selectedOrder && <OrderReceipt order={selectedOrder} />}
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1">
              Close
            </Button>
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
