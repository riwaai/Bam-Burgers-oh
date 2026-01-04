import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Printer, Check, ChefHat, Package, Truck, Eye, X, RefreshCw, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OrderReceipt from '@/components/admin/OrderReceipt';

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

// Admin flow: Pending -> Accepted -> Ready
const adminStatusFlow: OrderStatus[] = ['pending', 'accepted', 'ready'];
const statusFlow: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered'];

const statusConfig: Record<OrderStatus, { label: string; bgColor: string }> = {
  pending: { label: 'Order Placed', bgColor: 'bg-yellow-500' },
  accepted: { label: 'Accepted', bgColor: 'bg-blue-500' },
  preparing: { label: 'Preparing', bgColor: 'bg-orange-500' },
  ready: { label: 'Ready', bgColor: 'bg-purple-500' },
  out_for_delivery: { label: 'Out for Delivery', bgColor: 'bg-indigo-500' },
  delivered: { label: 'Delivered', bgColor: 'bg-green-500' },
  completed: { label: 'Completed', bgColor: 'bg-green-500' },
  cancelled: { label: 'Cancelled', bgColor: 'bg-red-500' },
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const buzzerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const lastPendingCountRef = useRef(0);

  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      gainNode.gain.value = 0.5;
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${TENANT_ID}` }, () => fetchOrders())
      .subscribe();
    const pollInterval = setInterval(fetchOrders, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      if (buzzerIntervalRef.current) clearInterval(buzzerIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    if (buzzerEnabled && pendingCount > 0) {
      if (!buzzerIntervalRef.current) {
        playBeep();
        buzzerIntervalRef.current = setInterval(playBeep, 2000);
      }
      if (pendingCount > lastPendingCountRef.current) {
        toast.warning(`🔔 ${pendingCount} pending order(s)!`, { duration: 10000, id: 'pending' });
      }
    } else {
      if (buzzerIntervalRef.current) {
        clearInterval(buzzerIntervalRef.current);
        buzzerIntervalRef.current = null;
      }
    }
    lastPendingCountRef.current = pendingCount;
  }, [orders, buzzerEnabled]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/orders?limit=100`);
      if (!response.ok) throw new Error('Failed to fetch');
      const ordersData = await response.json();
      
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          // Check if items are already in order (from MongoDB)
          if (order.items && order.items.length > 0) {
            return order;
          }
          const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
          return { ...order, items: items || [] };
        })
      );
      setOrders(ordersWithItems);
    } catch (err) {
      console.error('Error fetching orders:', err);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const ordersWithItems = await Promise.all(
          (data || []).map(async (order) => {
            const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
            return { ...order, items: items || [] };
          })
        );
        setOrders(ordersWithItems);
      } catch (e) {
        console.error('Fallback fetch failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId);
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update');
      toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      fetchOrders();
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getNextAdminStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = adminStatusFlow.indexOf(current);
    return idx >= 0 && idx < adminStatusFlow.length - 1 ? adminStatusFlow[idx + 1] : null;
  };

  const formatAddress = (addr: any) => {
    if (!addr) return 'N/A';
    return [addr.area, addr.block && `Block ${addr.block}`, addr.street, addr.building && `Bldg ${addr.building}`, addr.floor && `Floor ${addr.floor}`, addr.apartment && `Apt ${addr.apartment}`].filter(Boolean).join(', ') || 'N/A';
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleString('en-GB', {
      timeZone: 'Asia/Kuwait',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrintReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${selectedOrder?.order_number}</title>
          <style>
            body { font-family: monospace; margin: 0; padding: 20px; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage incoming orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button variant={buzzerEnabled ? 'default' : 'outline'} onClick={() => { setBuzzerEnabled(!buzzerEnabled); if (buzzerEnabled && buzzerIntervalRef.current) { clearInterval(buzzerIntervalRef.current); buzzerIntervalRef.current = null; } }} className="gap-2">
            {buzzerEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Buzzer {buzzerEnabled ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'accepted', 'ready', 'delivered', 'cancelled'].map((s) => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : statusConfig[s as OrderStatus]?.label}
            {s === 'pending' && pendingCount > 0 && <Badge className="ml-2 bg-yellow-500">{pendingCount}</Badge>}
          </Button>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded animate-pulse">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-600 animate-bounce" />
            <span className="font-medium text-yellow-800">🔔 {pendingCount} pending order(s)!</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No orders found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const next = getNextAdminStatus(order.status);
            const isUpdating = updatingStatus === order.id;
            return (
              <Card key={order.id} className={`hover:shadow-lg transition-all ${order.status === 'pending' ? 'ring-2 ring-yellow-500 animate-pulse' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                    <Badge className={`${cfg.bgColor} text-white`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{order.customer_name || 'Guest'}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_phone || 'No phone'}</p>
                  </div>
                  <div className="text-sm"><Badge variant="outline">{order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}</Badge></div>
                  {order.items && order.items.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {order.items.slice(0, 2).map((item, i) => <p key={i}>{item.quantity}x {item.item_name_en}</p>)}
                      {order.items.length > 2 && <p className="text-primary">+{order.items.length - 2} more</p>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-lg font-bold">{(order.total_amount || 0).toFixed(3)} KWD</span>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(order); setShowReceipt(false); }}><Eye className="h-4 w-4" /></Button>
                  </div>
                  {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'completed' && order.status !== 'ready' && (
                    <div className="flex gap-2 pt-2">
                      {next && <Button size="sm" onClick={() => updateOrderStatus(order.id, next)} className={`flex-1 ${statusConfig[next].bgColor}`} disabled={isUpdating}>{isUpdating ? '...' : statusConfig[next].label}</Button>}
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm('Reject this order?')) updateOrderStatus(order.id, 'cancelled'); }} disabled={isUpdating}><Ban className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {order.status === 'ready' && (
                    <div className="text-center text-green-600 font-medium py-2">✓ Order Ready</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedOrder && !showReceipt} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Order #{selectedOrder.order_number}</span>
                  <Badge className={`${statusConfig[selectedOrder.status]?.bgColor || 'bg-gray-500'} text-white`}>{statusConfig[selectedOrder.status]?.label}</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Customer</h3>
                  <p>{selectedOrder.customer_name || 'Guest'} • {selectedOrder.customer_phone || 'N/A'}</p>
                </div>
                {selectedOrder.order_type === 'delivery' && selectedOrder.delivery_address && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Address</h3>
                    <p className="text-sm">{formatAddress(selectedOrder.delivery_address)}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold mb-2">Items</h3>
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between p-2 bg-gray-50 rounded mb-1">
                      <span>{item.quantity}x {item.item_name_en}</span>
                      <span>{(item.total_price || 0).toFixed(3)} KWD</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{(selectedOrder.total_amount || 0).toFixed(3)} KWD</span></div>
                </div>
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'completed' && selectedOrder.status !== 'ready' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Update Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {adminStatusFlow.map((s) => {
                        const idx = adminStatusFlow.indexOf(selectedOrder.status);
                        const sIdx = adminStatusFlow.indexOf(s);
                        return (
                          <Button key={s} size="sm" variant={s === selectedOrder.status ? 'default' : sIdx === idx + 1 ? 'default' : 'outline'} className={sIdx === idx + 1 ? statusConfig[s].bgColor : ''} disabled={sIdx <= idx || updatingStatus === selectedOrder.id} onClick={() => updateOrderStatus(selectedOrder.id, s)}>
                            {statusConfig[s].label}
                          </Button>
                        );
                      })}
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm('Reject?')) updateOrderStatus(selectedOrder.id, 'cancelled'); }}><Ban className="h-4 w-4 mr-1" />Reject</Button>
                    </div>
                  </div>
                )}
                <Button variant="outline" onClick={() => setShowReceipt(true)} className="w-full"><Printer className="h-4 w-4 mr-2" />View Receipt</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog - Scrollable with print button at top */}
      <Dialog open={showReceipt} onOpenChange={() => setShowReceipt(false)}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
          {/* Buttons at top */}
          <div className="flex gap-3 pb-4 border-b">
            <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1">Close</Button>
            <Button onClick={handlePrintReceipt} className="flex-1"><Printer className="h-4 w-4 mr-2" />Print Receipt</Button>
          </div>
          {/* Scrollable receipt */}
          <div className="overflow-y-auto flex-1">
            <div ref={receiptRef} className="bg-white">{selectedOrder && <OrderReceipt order={selectedOrder} />}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
