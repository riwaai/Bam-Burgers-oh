import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Printer, Check, ChefHat, Package, Truck, Eye, X, RefreshCw, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OrderReceipt from '@/components/admin/OrderReceipt';
import html2canvas from 'html2canvas';

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  item_name_en: string;
  item_name_ar: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

interface Order {
  id: string;
  order_number: string;
  order_type: string;
  channel?: string;
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
  items?: OrderItem[];
}

const statusFlow: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'Order Placed', color: 'text-yellow-800', bgColor: 'bg-yellow-500', icon: Bell },
  accepted: { label: 'Accepted', color: 'text-blue-800', bgColor: 'bg-blue-500', icon: Check },
  preparing: { label: 'Preparing', color: 'text-orange-800', bgColor: 'bg-orange-500', icon: ChefHat },
  ready: { label: 'Ready', color: 'text-purple-800', bgColor: 'bg-purple-500', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-indigo-800', bgColor: 'bg-indigo-500', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-800', bgColor: 'bg-green-500', icon: Check },
  completed: { label: 'Completed', color: 'text-green-800', bgColor: 'bg-green-500', icon: Check },
  cancelled: { label: 'Cancelled', color: 'text-red-800', bgColor: 'bg-red-500', icon: X },
};

// Loud buzzer sound - continuous alert tone
const BUZZER_SOUND_URL = 'https://www.soundjay.com/button/sounds/beep-07.mp3';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const lastPendingCountRef = useRef(0);
  const buzzerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(BUZZER_SOUND_URL);
    audioRef.current.loop = false;
    audioRef.current.volume = 1.0;

    return () => {
      if (buzzerIntervalRef.current) {
        clearInterval(buzzerIntervalRef.current);
      }
      audioRef.current?.pause();
    };
  }, []);

  // Fetch orders and subscribe to realtime
  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${TENANT_ID}` },
        (payload) => {
          console.log('Order change received:', payload);
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Poll every 15 seconds as backup
    const pollInterval = setInterval(fetchOrders, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  // Buzzer effect for pending orders - LOUD and CONTINUOUS
  useEffect(() => {
    const pendingCount = orders.filter((o) => o.status === 'pending').length;

    if (buzzerEnabled && pendingCount > 0) {
      // Start buzzer if we have pending orders
      if (!buzzerIntervalRef.current) {
        // Play immediately
        playBuzzer();
        
        // Set interval to keep buzzing every 2 seconds (more frequent)
        buzzerIntervalRef.current = setInterval(() => {
          playBuzzer();
        }, 2000);
      }
      
      // Show toast for new orders
      if (pendingCount > lastPendingCountRef.current) {
        toast.warning(`🔔 ${pendingCount} pending order(s) waiting!`, { 
          duration: 10000,
          id: 'pending-orders'
        });
      }
    } else {
      // Stop buzzer if no pending orders
      stopBuzzer();
    }

    lastPendingCountRef.current = pendingCount;
  }, [orders, buzzerEnabled]);

  const playBuzzer = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Audio play failed:', err);
      });
    }
  };

  const stopBuzzer = () => {
    if (buzzerIntervalRef.current) {
      clearInterval(buzzerIntervalRef.current);
      buzzerIntervalRef.current = null;
    }
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

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
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId);
    try {
      const updateData: any = { 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      };

      if (newStatus === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      } else if (newStatus === 'delivered' || newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      toast.success(`Order status updated to ${statusConfig[newStatus].label}`);
      
      // Immediately update local state
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));

      // Update selected order if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      // Refresh from server
      fetchOrders();
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
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
        stopBuzzer();
      }
      return !prev;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Print receipt as image
  const handlePrintReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `receipt-${selectedOrder?.order_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Receipt downloaded!');
    } catch (err) {
      console.error('Error generating receipt:', err);
      toast.error('Failed to generate receipt');
    }
  };

  // Filter orders
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === statusFilter);

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage incoming orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={buzzerEnabled ? 'default' : 'outline'}
            onClick={toggleBuzzer}
            className="gap-2"
          >
            {buzzerEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Buzzer {buzzerEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status as OrderStatus]?.label || status}
            {status === 'pending' && pendingCount > 0 && (
              <Badge className="ml-2 bg-yellow-500">{pendingCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Pending Orders Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded animate-pulse">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600 animate-bounce" />
            <span className="font-medium text-yellow-800">
              🔔 {pendingCount} pending order(s) waiting for acceptance!
            </span>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No orders found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const nextStatus = getNextStatus(order.status);
            const isUpdating = updatingStatus === order.id;

            return (
              <Card
                key={order.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  order.status === 'pending' ? 'ring-2 ring-yellow-500 animate-pulse' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                    <Badge className={`${config.bgColor} text-white`}>
                      {config.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.created_at)}
                    {order.channel && <span className="ml-2">• {order.channel}</span>}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{order.customer_name || 'Guest'}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_phone || 'No phone'}</p>
                  </div>

                  <div className="text-sm">
                    <span className="font-medium">Type:</span>{' '}
                    <Badge variant="outline">
                      {order.order_type === 'pickup' || order.order_type === 'qsr' ? 'Pickup' : 'Delivery'}
                    </Badge>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <p key={idx}>{item.quantity}x {item.item_name_en}</p>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-primary">+{order.items.length - 2} more items</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-bold">{(order.total_amount || 0).toFixed(3)} KWD</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowReceipt(false);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'completed' && (
                    <div className="flex gap-2 pt-2">
                      {nextStatus && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, nextStatus);
                          }}
                          className={`flex-1 ${statusConfig[nextStatus].bgColor}`}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Updating...' : statusConfig[nextStatus].label}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to reject this order?')) {
                            updateOrderStatus(order.id, 'cancelled');
                          }
                        }}
                        disabled={isUpdating}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
                  <Badge className={`${statusConfig[selectedOrder.status]?.bgColor || 'bg-gray-500'} text-white`}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Customer Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Customer Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> {selectedOrder.customer_name || 'Guest'}</div>
                    <div><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone || 'N/A'}</div>
                    {selectedOrder.customer_email && (
                      <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}</div>
                    )}
                  </div>
                </div>

                {/* Delivery Details */}
                {selectedOrder.order_type === 'delivery' && selectedOrder.delivery_address && (
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
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{item.item_name_en}</p>
                            {item.item_name_ar && <p className="text-sm text-muted-foreground">{item.item_name_ar}</p>}
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} × {(item.unit_price || 0).toFixed(3)} KWD</p>
                            {item.notes && <p className="text-sm text-orange-600">Note: {item.notes}</p>}
                          </div>
                          <span className="font-medium">{(item.total_price || 0).toFixed(3)} KWD</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No items found</p>
                    )}
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
                    <span>{(selectedOrder.subtotal || 0).toFixed(3)} KWD</span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{(selectedOrder.discount_amount || 0).toFixed(3)} KWD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>{(selectedOrder.delivery_fee || 0).toFixed(3)} KWD</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total</span>
                    <span>{(selectedOrder.total_amount || 0).toFixed(3)} KWD</span>
                  </div>
                </div>

                {/* Status Update Buttons */}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'completed' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-3">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {statusFlow.map((status) => {
                        const currentIndex = statusFlow.indexOf(selectedOrder.status);
                        const statusIndex = statusFlow.indexOf(status);
                        const isNext = statusIndex === currentIndex + 1;
                        const isCurrent = status === selectedOrder.status;
                        const isPast = statusIndex < currentIndex;
                        
                        return (
                          <Button
                            key={status}
                            size="sm"
                            variant={isCurrent ? 'default' : isNext ? 'default' : 'outline'}
                            className={isNext ? statusConfig[status].bgColor : ''}
                            disabled={isPast || isCurrent || updatingStatus === selectedOrder.id}
                            onClick={() => updateOrderStatus(selectedOrder.id, status)}
                          >
                            {statusConfig[status].label}
                          </Button>
                        );
                      })}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to reject this order?')) {
                            updateOrderStatus(selectedOrder.id, 'cancelled');
                          }
                        }}
                        disabled={updatingStatus === selectedOrder.id}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowReceipt(true)}
                    className="flex-1"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    View Receipt
                  </Button>
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
            <DialogTitle>Order Receipt</DialogTitle>
          </DialogHeader>
          <div ref={receiptRef} className="bg-white">
            {selectedOrder && <OrderReceipt order={selectedOrder} />}
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1">
              Close
            </Button>
            <Button onClick={handlePrintReceipt} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
