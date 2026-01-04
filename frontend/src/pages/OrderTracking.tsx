import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Check, Clock, ChefHat, Package, Truck, Home, Phone, Loader2, Download, X, Printer } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrderTracking, useOrderByNumber } from "@/hooks/useOrders";
import { supabase } from "@/integrations/supabase/client";
import OrderReceipt from "@/components/admin/OrderReceipt";
import html2canvas from "html2canvas";
import { toast } from "sonner";

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';

const statusMapping: Record<string, OrderStatus> = {
  'pending': 'pending',
  'accepted': 'accepted',
  'preparing': 'preparing',
  'ready': 'ready',
  'out_for_delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'completed': 'delivered',
  'cancelled': 'cancelled',
};

// Timer-based automatic status updates (in milliseconds)
const STATUS_TIMERS: Record<OrderStatus, { next: OrderStatus | null; delay: number }> = {
  'pending': { next: 'accepted', delay: 40 * 1000 }, // 40 seconds
  'accepted': { next: 'preparing', delay: 60 * 1000 }, // 1 minute
  'preparing': { next: 'ready', delay: 12 * 60 * 1000 }, // 12 minutes
  'ready': { next: 'out_for_delivery', delay: 2 * 60 * 1000 }, // 2 minutes
  'out_for_delivery': { next: 'delivered', delay: 20 * 60 * 1000 }, // 20 minutes
  'delivered': { next: null, delay: 0 },
  'completed': { next: null, delay: 0 },
  'cancelled': { next: null, delay: 0 },
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order_number');
  const { t, isRTL } = useLanguage();
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [displayStatus, setDisplayStatus] = useState<OrderStatus>('pending');
  const receiptRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statusStartTimeRef = useRef<number>(Date.now());

  const { order: orderById, loading: loadingById } = useOrderTracking(orderId);
  const { order: orderByNum, loading: loadingByNum } = useOrderByNumber(orderNumber || undefined);

  const order = orderById || orderByNum;
  const loading = loadingById || loadingByNum;
  const backendStatus = order ? (statusMapping[order.status] || 'pending') : 'pending';

  // Timer-based status progression
  useEffect(() => {
    if (!order) return;

    // Initialize display status from order
    const initialStatus = statusMapping[order.status] || 'pending';
    setDisplayStatus(initialStatus);
    statusStartTimeRef.current = Date.now();

    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set up automatic progression
    const progressStatus = () => {
      setDisplayStatus(current => {
        const config = STATUS_TIMERS[current];
        if (config.next && current !== 'cancelled') {
          // Schedule next transition
          const nextConfig = STATUS_TIMERS[config.next];
          if (nextConfig.next) {
            timerRef.current = setTimeout(progressStatus, nextConfig.delay);
          }
          return config.next;
        }
        return current;
      });
    };

    // Start timer for current status
    const config = STATUS_TIMERS[initialStatus];
    if (config.next && initialStatus !== 'cancelled') {
      timerRef.current = setTimeout(progressStatus, config.delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [order?.id, order?.status]);

  // Fetch order items
  useEffect(() => {
    const fetchItems = async () => {
      if (!order?.id) return;
      
      // Check if items are already in order (from MongoDB)
      if (order.items && order.items.length > 0) {
        setOrderItems(order.items);
        return;
      }
      
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      
      if (!error && data) {
        setOrderItems(data);
      }
    };
    
    fetchItems();
  }, [order?.id]);

  const steps = [
    { id: 'pending', label: isRTL ? 'تم استلام الطلب' : 'Order Placed', icon: Check },
    { id: 'accepted', label: isRTL ? 'تم قبول الطلب' : 'Order Accepted', icon: Check },
    { id: 'preparing', label: isRTL ? 'جاري التحضير' : 'Freshly Preparing', icon: ChefHat },
    { id: 'ready', label: isRTL ? 'جاهز للتوصيل' : 'Ready for Delivery', icon: Package },
    { id: 'out_for_delivery', label: isRTL ? 'في الطريق إليك' : 'Out for Delivery', icon: Truck },
    { id: 'delivered', label: isRTL ? 'تم التوصيل' : 'Delivered', icon: Home },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === displayStatus);

  const getStepStatus = (index: number) => {
    if (displayStatus === 'cancelled') return 'cancelled';
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `receipt-${order?.order_number || 'order'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success(isRTL ? 'تم تحميل الإيصال' : 'Receipt downloaded!');
    } catch (err) {
      console.error('Error generating receipt:', err);
      toast.error(isRTL ? 'فشل تحميل الإيصال' : 'Failed to download receipt');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!order && !loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {isRTL ? 'لم يتم العثور على الطلب' : 'Order not found'}
            </p>
            <Link to="/menu">
              <Button>{isRTL ? 'العودة للقائمة' : 'Back to Menu'}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const orderWithItems = order ? { ...order, items: orderItems } : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className={`text-3xl font-bold mb-4 ${isRTL ? 'text-right' : ''}`}>
            <span className="text-primary">{t.orderTracking.title}</span>
          </h1>

          {order && (
            <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <p className={`text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? 'رقم الطلب: ' : 'Order #: '}
                <span className="font-semibold text-foreground">{order.order_number}</span>
              </p>
              <Button variant="outline" size="sm" onClick={() => setShowReceipt(true)}>
                <Download className="h-4 w-4 mr-2" />
                {isRTL ? 'تحميل الإيصال' : 'Download Receipt'}
              </Button>
            </div>
          )}

          {displayStatus === 'cancelled' && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-semibold text-red-600">
                      {isRTL ? 'تم إلغاء الطلب' : 'Order Cancelled'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'لمزيد من المعلومات، يرجى الاتصال بنا' : 'For more information, please contact us'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {displayStatus !== 'cancelled' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Clock className="h-5 w-5" />
                  {t.orderTracking.status}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {steps.map((step, index) => {
                    const stepStatus = getStepStatus(index);
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className={`flex items-start gap-4 ${index < steps.length - 1 ? 'pb-8' : ''} ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                          stepStatus === 'completed' ? 'bg-green-500 text-white' :
                          stepStatus === 'current' ? 'bg-primary text-white animate-pulse' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {stepStatus === 'completed' ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        
                        {index < steps.length - 1 && (
                          <div className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-10 w-0.5 h-8 transition-all duration-500 ${
                            stepStatus === 'completed' ? 'bg-green-500' : 'bg-muted'
                          }`} />
                        )}
                        
                        <div className={`flex-1 pt-2 ${isRTL ? 'text-right' : ''}`}>
                          <p className={`font-medium ${
                            stepStatus === 'completed' ? 'text-green-600' :
                            stepStatus === 'current' ? 'text-primary' :
                            'text-muted-foreground'
                          }`}>
                            {step.label}
                          </p>
                          {stepStatus === 'current' && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {isRTL ? 'قيد التنفيذ...' : 'In progress...'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{isRTL ? 'ملخص الطلب' : 'Order Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems.length > 0 ? (
                <>
                  {orderItems.map((item, idx) => (
                    <div key={idx} className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{item.quantity}x {item.item_name_en}</span>
                      <span className="font-medium">{(item.total_price || 0).toFixed(3)} KWD</span>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className={`flex justify-between font-bold ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                      <span className="text-primary">{(order?.total_amount || 0).toFixed(3)} KWD</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {isRTL ? 'جاري تحميل تفاصيل الطلب...' : 'Loading order details...'}
                </p>
              )}
            </CardContent>
          </Card>

          {displayStatus !== 'cancelled' && displayStatus !== 'delivered' && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="text-sm text-muted-foreground">
                      {t.orderTracking.estimatedDelivery}
                    </p>
                    <p className="text-xl font-semibold">30-45 {t.orderConfirmation.minutes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className={isRTL ? 'text-right' : ''}>
                    <p className="font-medium">{isRTL ? 'هل تحتاج مساعدة؟' : 'Need help?'}</p>
                    <p className="text-sm text-muted-foreground">+965 9474 5424</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="tel:+96594745424">
                    <Phone className="h-4 w-4 mr-2" />
                    {isRTL ? 'اتصل' : 'Call'}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link to="/menu">
              <Button variant="outline">
                {isRTL ? 'العودة للقائمة' : 'Back to Menu'}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* Receipt Modal - Scrollable with buttons at top */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إيصال الطلب' : 'Order Receipt'}</DialogTitle>
          </DialogHeader>
          {/* Buttons at top */}
          <div className="flex gap-3 pb-4 border-b">
            <Button variant="outline" onClick={() => setShowReceipt(false)} className="flex-1">
              {isRTL ? 'إغلاق' : 'Close'}
            </Button>
            <Button onClick={handleDownloadReceipt} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {isRTL ? 'تحميل' : 'Download'}
            </Button>
          </div>
          {/* Scrollable receipt content */}
          <div className="overflow-y-auto flex-1">
            <div ref={receiptRef} className="bg-white">
              {orderWithItems && <OrderReceipt order={orderWithItems} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTracking;
