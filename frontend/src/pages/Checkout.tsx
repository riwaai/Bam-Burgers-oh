import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Truck, MapPin, CreditCard, Banknote, Loader2, Store, Navigation } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder } from "@/contexts/OrderContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { formatPrice } from "@/hooks/useSupabaseMenu";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase, BRANCH_ID, TENANT_ID } from "@/integrations/supabase/client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const KUWAIT_CENTER: [number, number] = [29.3759, 47.9774];

type PaymentMethod = 'cash' | 'online';

// Lazy load map component
const MapSection = lazy(() => import('@/components/CheckoutMap'));

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, total, discount, clearCart } = useCart();
  const { t, isRTL } = useLanguage();
  const { orderType, deliveryAddress, selectedBranch, setOrderType } = useOrder();
  const { customer } = useCustomerAuth();

  const [localOrderType, setLocalOrderType] = useState(orderType || 'delivery');
  const isPickup = localOrderType === 'pickup';
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  
  // Fetch delivery fee from Supabase
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (isPickup) {
        setDeliveryFee(0);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('delivery_zones')
          .select('delivery_fee')
          .eq('branch_id', BRANCH_ID)
          .eq('status', 'active')
          .limit(1)
          .single();
        
        if (data && !error) {
          setDeliveryFee(data.delivery_fee || 0);
        } else {
          setDeliveryFee(0); // Default to 0 if no zone found
        }
      } catch (err) {
        console.error('Error fetching delivery fee:', err);
        setDeliveryFee(0);
      }
    };
    fetchDeliveryFee();
  }, [isPickup]);

  // Loyalty settings
  interface LoyaltySettings {
    enabled: boolean;
    points_per_kwd: number;
    redemption_rate: number;
    min_points_to_redeem: number;
    max_redemption_percent: number;
  }
 
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
 
  // Fetch loyalty settings
  useEffect(() => {
    const fetchLoyaltySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('loyalty_settings')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .single();
       
        if (data && !error) {
          setLoyaltySettings(data);
        }
      } catch (err) {
        console.error('Error fetching loyalty settings:', err);
      }
    };
    fetchLoyaltySettings();
  }, []);
 
  // Calculate loyalty discount
  const customerPoints = customer?.loyalty_points || 0;
  const pointValue = loyaltySettings?.redemption_rate || 0.01;
  const maxRedeemPercent = loyaltySettings?.max_redemption_percent || 100;
  const minPointsToRedeem = loyaltySettings?.min_points_to_redeem || 0;
 
  // Maximum discount based on points and order total
  const orderTotal = subtotal - discount + (isPickup ? 0 : deliveryFee);
  const maxDiscountFromPercent = (orderTotal * maxRedeemPercent) / 100;
  const maxDiscountFromPoints = customerPoints * pointValue;
  const maxLoyaltyDiscount = Math.min(maxDiscountFromPercent, maxDiscountFromPoints);
 
  const loyaltyDiscount = usePoints ? Math.min(pointsToRedeem * pointValue, maxLoyaltyDiscount) : 0;
  const finalTotal = orderTotal - loyaltyDiscount;
 
  // Points to earn from this order
  const pointsPerKwd = loyaltySettings?.points_per_kwd || 1;
  const pointsToEarn = Math.floor(finalTotal * pointsPerKwd);
 

  const [formData, setFormData] = useState({
    firstName: customer?.name?.split(' ')[0] || '',
    lastName: customer?.name?.split(' ').slice(1).join(' ') || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    area: deliveryAddress?.area || '',
    block: deliveryAddress?.block || '',
    street: deliveryAddress?.street || '',
    building: deliveryAddress?.building || '',
    floor: deliveryAddress?.floor || '',
    apartment: deliveryAddress?.apartment || '',
    additionalInfo: deliveryAddress?.additional_directions || '',
    notes: '',
  });

  const handleAddressFromMap = useCallback((address: { area: string; street: string; block: string; building: string }) => {
    setFormData(prev => ({
      ...prev,
      area: address.area || prev.area,
      street: address.street || prev.street,
      block: address.block || prev.block,
      building: address.building || prev.building,
    }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.phone) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    if (!isPickup && (!formData.area || !formData.block || !formData.building)) {
      toast.error(isRTL ? 'يرجى إدخال عنوان التوصيل' : 'Please enter delivery address');
      return;
    }

    if (items.length === 0) {
      toast.error(isRTL ? 'سلتك فارغة' : 'Your cart is empty');
      navigate('/menu');
      return;
    }

    setIsProcessing(true);

    try {
      const addressObj = isPickup ? undefined : {
        area: formData.area,
        block: formData.block,
        street: formData.street,
        building: formData.building,
        floor: formData.floor,
        apartment: formData.apartment,
        additional_directions: formData.additionalInfo,
        geo_lat: mapPosition?.[0],
        geo_lng: mapPosition?.[1],
      };

      // Calculate final order total with loyalty discount
      const orderTotal = subtotal - discount - loyaltyDiscount + (isPickup ? 0 : deliveryFee);

      const orderItems = items.map(item => ({
        item_id: item.menu_item_id,
        item_name_en: item.name,
        item_name_ar: item.name_ar || item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total_price,
        notes: item.special_instructions || item.notes || null,
        modifiers: item.modifiers?.map(m => ({
          id: m.modifier?.id || m.id || '',
          name_en: m.modifier?.name_en || m.modifier?.name || m.name_en || m.name || '',
          name_ar: m.modifier?.name_ar || m.name_ar || '',
          price: m.modifier?.price || m.price || 0,
        })) || [],
      }));

      // Collect all item notes for order notes
      const itemNotes = items
        .filter(item => item.special_instructions || item.notes)
        .map(item => `${item.name}: ${item.special_instructions || item.notes}`)
        .join('; ');
      
      const combinedNotes = [formData.notes, itemNotes].filter(Boolean).join(' | ');

      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: localOrderType,
          customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
          customer_phone: formData.phone,
          customer_email: formData.email || undefined,
          customer_id: customer?.id || undefined,
          delivery_address: addressObj,
          delivery_instructions: formData.additionalInfo || undefined,
          items: orderItems,
          subtotal: subtotal,
          discount_amount: discount + loyaltyDiscount, // Include loyalty discount
          delivery_fee: isPickup ? 0 : deliveryFee,
          total_amount: orderTotal,
          notes: combinedNotes || undefined,
          payment_method: paymentMethod === 'online' ? 'tap' : 'cash',
          coupon_code: appliedCoupon || undefined, // Include coupon code
          // Loyalty data
          loyalty_points_used: usePoints ? pointsToRedeem : 0,
          loyalty_points_earned: pointsToEarn,
        }),
      });

      if (!response.ok) {
        toast.error(isRTL ? 'حدث خطأ أثناء تقديم الطلب' : 'Error placing order');
        return;
      }

      const orderResult = await response.json();
      
      // If Tap payment, redirect to payment page (DON'T clear cart yet - only clear after payment verified)
      if (paymentMethod === 'online' && orderResult.payment_url) {
        // Cart will be cleared after successful payment verification in PaymentResult page
        window.location.href = orderResult.payment_url;
        return;
      }
      
      // For cash orders, clear cart and show success
      toast.success(isRTL ? 'تم تقديم الطلب بنجاح!' : 'Order placed successfully!');
      clearCart();
      navigate(`/track-order/${orderResult.id}?order_number=${orderResult.order_number}`);
    } catch (error) {
      console.error('Order error:', error);
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{t.cart.empty}</p>
            <Button onClick={() => navigate('/menu')}>{t.cart.browseMenu}</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className={`inline-flex items-center text-primary hover:underline mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? (
              <>{t.checkout.backToCart}<ArrowRight className="h-4 w-4 ml-2" /></>
            ) : (
              <><ArrowLeft className="h-4 w-4 mr-2" />{t.checkout.backToCart}</>
            )}
          </button>

          <h1 className={`text-3xl md:text-4xl font-bold mb-8 ${isRTL ? 'text-right' : ''}`}>
            <span className="text-primary">{t.checkout.title}</span>
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Order Type Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? 'نوع الطلب' : 'Order Type'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={localOrderType} onValueChange={(v) => setLocalOrderType(v as 'delivery' | 'pickup')} className="w-full">
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="delivery" className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          {isRTL ? 'توصيل' : 'Delivery'}
                        </TabsTrigger>
                        <TabsTrigger value="pickup" className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          {isRTL ? 'استلام' : 'Pickup'}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                    
                    <div className="mt-4">
                      {isPickup ? (
                        <div className={`flex items-start gap-3 p-4 bg-primary/5 rounded-lg ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                          <MapPin className="h-6 w-6 text-primary mt-1" />
                          <div>
                            <p className="font-medium mb-1">{isRTL ? 'فرع سلوى' : 'Salwa Branch'}</p>
                            <p className="text-sm text-muted-foreground">{isRTL ? 'سلوى، الكويت' : 'Salwa, Kuwait'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-3 p-4 bg-primary/5 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Truck className="h-6 w-6 text-primary" />
                          <p className="font-medium">{isRTL ? 'سنوصل طلبك إلى باب منزلك' : "We'll deliver to your doorstep"}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                  <CardHeader><CardTitle>{t.checkout.customerInfo}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t.checkout.firstName} *</Label>
                        <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required className={isRTL ? 'text-right' : ''} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t.checkout.lastName}</Label>
                        <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className={isRTL ? 'text-right' : ''} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.checkout.phone} *</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                          +965
                        </div>
                        <Input 
                          id="phone" 
                          name="phone" 
                          type="tel" 
                          placeholder="XXXX XXXX" 
                          value={formData.phone.replace(/^\+965\s*/, '')} 
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d]/g, '').slice(0, 8);
                            setFormData(prev => ({ ...prev, phone: `+965${value}` }));
                          }} 
                          required 
                          dir="ltr" 
                          className="rounded-l-none"
                          maxLength={8}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.checkout.email}</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} dir="ltr" />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Address with Map */}
                {!isPickup && (
                  <Card>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <MapPin className="h-5 w-5" />
                        {t.checkout.deliveryAddress}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Map Section - Lazy Loaded */}
                      <Suspense fallback={
                        <div className="h-[200px] bg-gray-100 rounded-lg flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      }>
                        <MapSection 
                          onPositionChange={setMapPosition}
                          onAddressChange={handleAddressFromMap}
                          isRTL={isRTL}
                        />
                      </Suspense>

                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="area">{t.checkout.area} *</Label>
                          <Input id="area" name="area" value={formData.area} onChange={handleInputChange} required className={isRTL ? 'text-right' : ''} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="block">{t.checkout.block} *</Label>
                          <Input id="block" name="block" value={formData.block} onChange={handleInputChange} required className={isRTL ? 'text-right' : ''} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street">{t.checkout.address}</Label>
                        <Input id="street" name="street" value={formData.street} onChange={handleInputChange} className={isRTL ? 'text-right' : ''} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="building">{t.checkout.building} *</Label>
                          <Input id="building" name="building" value={formData.building} onChange={handleInputChange} required className={isRTL ? 'text-right' : ''} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="floor">{t.checkout.floor}</Label>
                          <Input id="floor" name="floor" value={formData.floor} onChange={handleInputChange} className={isRTL ? 'text-right' : ''} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apartment">{t.checkout.apartment}</Label>
                          <Input id="apartment" name="apartment" value={formData.apartment} onChange={handleInputChange} className={isRTL ? 'text-right' : ''} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="additionalInfo">{t.checkout.additionalInfo}</Label>
                        <Textarea id="additionalInfo" name="additionalInfo" value={formData.additionalInfo} onChange={handleInputChange} rows={2} className={isRTL ? 'text-right' : ''} placeholder={isRTL ? 'تعليمات إضافية (اختياري)' : 'Additional instructions (optional)'} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CreditCard className="h-5 w-5" />
                      {t.checkout.paymentMethod}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-3">
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : ''} ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className={`flex items-center gap-2 cursor-pointer flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Banknote className="h-5 w-5" />
                          {t.checkout.cashOnDelivery}
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : ''} ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className={`flex items-center gap-2 cursor-pointer flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <CreditCard className="h-5 w-5" />
                          {t.checkout.onlinePayment}
                          <span className="text-xs text-muted-foreground ml-2">(KNET, Visa, Mastercard)</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader><CardTitle>{isRTL ? 'ملاحظات الطلب' : 'Order Notes'}</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder={isRTL ? 'أي ملاحظات خاصة بالطلب...' : 'Any special notes...'} rows={3} className={isRTL ? 'text-right' : ''} />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader><CardTitle>{t.checkout.orderSummary}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item, index) => (
                        <div key={index} className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-muted-foreground">{t.checkout.subtotal}</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className={`flex justify-between text-green-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{t.checkout.discount}</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      {loyaltyDiscount > 0 && (
                        <div className={`flex justify-between text-orange-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{isRTL ? 'خصم النقاط' : 'Points Discount'}</span>
                          <span>-{formatPrice(loyaltyDiscount)}</span>
                        </div>
                      )}
                      {!isPickup && (
                        <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-muted-foreground">{t.checkout.deliveryFee}</span>
                          <span>{formatPrice(deliveryFee)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Loyalty Points Section - Only for logged in customers */}
                    {customer && loyaltySettings?.enabled && customerPoints > 0 && (
                      <>
                        <Separator />
                        <div className="p-3 bg-orange-50 rounded-lg space-y-3">
                          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm font-medium text-orange-700">
                              {isRTL ? 'نقاط الولاء' : 'Loyalty Points'}
                            </span>
                            <span className="text-sm font-bold text-orange-600">
                              {customerPoints} {isRTL ? 'نقطة' : 'pts'}
                            </span>
                          </div>
                          
                          {customerPoints >= minPointsToRedeem ? (
                            <div className="space-y-2">
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <input
                                  type="checkbox"
                                  id="usePoints"
                                  checked={usePoints}
                                  onChange={(e) => {
                                    setUsePoints(e.target.checked);
                                    if (e.target.checked) {
                                      setPointsToRedeem(customerPoints);
                                    } else {
                                      setPointsToRedeem(0);
                                    }
                                  }}
                                  className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                                />
                                <label htmlFor="usePoints" className="text-sm text-orange-700 cursor-pointer">
                                  {isRTL ? 'استخدم النقاط للخصم' : 'Use points for discount'}
                                </label>
                              </div>
                              {usePoints && (
                                <div className="space-y-1">
                                  <input
                                    type="range"
                                    min={0}
                                    max={customerPoints}
                                    value={pointsToRedeem}
                                    onChange={(e) => setPointsToRedeem(parseInt(e.target.value))}
                                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                                  />
                                  <div className={`flex justify-between text-xs text-orange-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                    <span>0 pts</span>
                                    <span className="font-bold">{pointsToRedeem} pts = {formatPrice(pointsToRedeem * pointValue)} discount</span>
                                    <span>{customerPoints} pts</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-orange-600">
                              {isRTL 
                                ? `تحتاج ${minPointsToRedeem} نقطة على الأقل للاستبدال`
                                : `You need at least ${minPointsToRedeem} points to redeem`}
                            </p>
                          )}
                          
                          <div className="text-xs text-orange-500 pt-1 border-t border-orange-200">
                            {isRTL 
                              ? `ستكسب ${pointsToEarn} نقطة من هذا الطلب`
                              : `You'll earn ${pointsToEarn} points from this order`}
                          </div>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className={`flex justify-between text-lg font-bold ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{t.checkout.total}</span>
                      <span className="text-primary">{formatPrice(finalTotal)}</span>
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={isProcessing}>
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isRTL ? 'جاري المعالجة...' : 'Processing...'}</>
                      ) : (
                        t.checkout.placeOrder
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
