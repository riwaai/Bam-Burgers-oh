import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Truck, MapPin, CreditCard, Banknote, Loader2, Store } from "lucide-react";
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

// Backend API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

type PaymentMethod = 'cash' | 'online';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, total, discount, deliveryFee, clearCart } = useCart();
  const { t, isRTL } = useLanguage();
  const { orderType, deliveryAddress, selectedBranch } = useOrder();
  const { customer, isAuthenticated } = useCustomerAuth();

  const isPickup = orderType === 'pickup';
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  
  // Form state
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.firstName || !formData.phone) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    // Only require address for delivery
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
      // Build delivery address object (only for delivery orders)
      const addressObj = isPickup ? undefined : {
        area: formData.area,
        block: formData.block,
        street: formData.street,
        building: formData.building,
        floor: formData.floor,
        apartment: formData.apartment,
        additional_directions: formData.additionalInfo,
      };

      // Calculate totals
      const orderDeliveryFee = isPickup ? 0 : deliveryFee;
      const orderTotal = isPickup ? (subtotal - discount) : total;

      // Build order items for API
      const orderItems = items.map(item => ({
        item_id: item.menu_item_id,
        item_name_en: item.name,
        item_name_ar: item.name_ar || item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total_price,
        notes: item.special_instructions || null,
        modifiers: item.modifiers?.map(m => ({
          id: m.modifier?.id,
          name: m.modifier?.name,
          price: m.modifier?.price,
        })) || [],
      }));

      // Create order via backend API
      const response = await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_type: isPickup ? 'pickup' : 'delivery',
          customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
          customer_phone: formData.phone,
          customer_email: formData.email || undefined,
          delivery_address: addressObj,
          delivery_instructions: formData.additionalInfo || undefined,
          items: orderItems,
          subtotal: subtotal,
          discount_amount: discount,
          delivery_fee: orderDeliveryFee,
          total_amount: orderTotal,
          notes: formData.notes || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Order error:', errorData);
        toast.error(isRTL ? 'حدث خطأ أثناء تقديم الطلب' : 'Error placing order. Please try again.');
        return;
      }

      const orderResult = await response.json();

      toast.success(isRTL ? 'تم تقديم الطلب بنجاح!' : 'Order placed successfully!');
      clearCart();
      navigate(`/track-order/${orderResult.id}?order_number=${orderResult.order_number}`);

    } catch (error) {
      console.error('Order error:', error);
      toast.error(t.errors.orderFailed);
    } finally {
      setIsProcessing(false);
    }
  };

  // Redirect if cart is empty
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
          {/* Back Link */}
          <button
            onClick={() => navigate(-1)}
            className={`inline-flex items-center text-primary hover:underline mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? (
              <>
                {t.checkout.backToCart}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.checkout.backToCart}
              </>
            )}
          </button>

          <h1 className={`text-3xl md:text-4xl font-bold mb-8 ${isRTL ? 'text-right' : ''}`}>
            <span className="text-primary">{t.checkout.title}</span>
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Type Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isPickup ? <Store className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                      {isPickup 
                        ? (isRTL ? 'استلام من الفرع' : 'Pickup from Branch')
                        : (isRTL ? 'توصيل للمنزل' : 'Home Delivery')
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPickup ? (
                      <div className={`flex items-start gap-3 p-4 bg-primary/5 rounded-lg ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                        <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">
                            {isRTL ? selectedBranch?.name_ar : selectedBranch?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {isRTL ? selectedBranch?.address_ar : selectedBranch?.address}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-3 p-4 bg-primary/5 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Truck className="h-6 w-6 text-primary" />
                        <p className="font-medium">
                          {isRTL ? 'سنوصل طلبك إلى باب منزلك' : "We'll deliver your order to your doorstep"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.checkout.customerInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">{t.checkout.firstName} *</Label>
                        <Input 
                          id="firstName" 
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required 
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">{t.checkout.lastName}</Label>
                        <Input 
                          id="lastName" 
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.checkout.phone} *</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        type="tel" 
                        placeholder="+965 XXXX XXXX" 
                        value={formData.phone}
                        onChange={handleInputChange}
                        required 
                        className={isRTL ? 'text-right' : ''}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.checkout.email}</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={formData.email}
                        onChange={handleInputChange}
                        className={isRTL ? 'text-right' : ''}
                        dir="ltr"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Address - Only for delivery orders */}
                {!isPickup && (
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <MapPin className="h-5 w-5" />
                      {t.checkout.deliveryAddress}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="area">{t.checkout.area} *</Label>
                        <Input 
                          id="area" 
                          name="area"
                          value={formData.area}
                          onChange={handleInputChange}
                          required 
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="block">{t.checkout.block} *</Label>
                        <Input 
                          id="block" 
                          name="block"
                          value={formData.block}
                          onChange={handleInputChange}
                          required 
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street">{t.checkout.address}</Label>
                      <Input 
                        id="street" 
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className={isRTL ? 'text-right' : ''}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="building">{t.checkout.building} *</Label>
                        <Input 
                          id="building" 
                          name="building"
                          value={formData.building}
                          onChange={handleInputChange}
                          required 
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="floor">{t.checkout.floor}</Label>
                        <Input 
                          id="floor" 
                          name="floor"
                          value={formData.floor}
                          onChange={handleInputChange}
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="apartment">{t.checkout.apartment}</Label>
                        <Input 
                          id="apartment" 
                          name="apartment"
                          value={formData.apartment}
                          onChange={handleInputChange}
                          className={isRTL ? 'text-right' : ''}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="additionalInfo">{t.checkout.additionalInfo}</Label>
                      <Textarea 
                        id="additionalInfo" 
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        rows={2}
                        className={isRTL ? 'text-right' : ''}
                      />
                    </div>
                  </CardContent>
                </Card>
                )}

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <CreditCard className="h-5 w-5" />
                      {t.checkout.paymentMethod}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                      className="space-y-3"
                    >
                      {/* Cash */}
                      <Label
                        htmlFor="cash"
                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'cash'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <RadioGroupItem value="cash" id="cash" />
                        <Banknote className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className={isRTL ? 'text-right' : ''}>
                          <p className="font-medium">{t.checkout.cashOnDelivery}</p>
                        </div>
                      </Label>

                      {/* Online Payment */}
                      <Label
                        htmlFor="online"
                        className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                          paymentMethod === 'online'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <RadioGroupItem value="online" id="online" />
                        <CreditCard className={`h-6 w-6 ${paymentMethod === 'online' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className={isRTL ? 'text-right' : ''}>
                          <p className="font-medium">{t.checkout.onlinePayment}</p>
                          <p className="text-sm text-muted-foreground">
                            {t.checkout.onlinePaymentDesc}
                          </p>
                        </div>
                      </Label>
                    </RadioGroup>

                    {paymentMethod === 'online' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          {isRTL 
                            ? '⚠️ الدفع الإلكتروني غير مفعل حالياً. يرجى اختيار الدفع النقدي.'
                            : '⚠️ Online payment is not configured yet. Please select cash payment.'
                          }
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t.checkout.notes}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      name="notes"
                      placeholder={t.checkout.notesPlaceholder}
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className={isRTL ? 'text-right' : ''}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-28">
                  <CardHeader>
                    <CardTitle>{t.checkout.orderSummary}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="flex-1">
                            {isRTL ? item.name_ar : item.name} × {item.quantity}
                          </span>
                          <span className="font-medium">{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-2">
                      <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{t.cart.subtotal}</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className={`flex justify-between text-sm text-green-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{t.cart.discount}</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{t.cart.deliveryFee}</span>
                        <span>{deliveryFee > 0 ? formatPrice(deliveryFee) : t.cart.free}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className={`flex justify-between font-semibold text-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{t.cart.total}</span>
                      <span className="text-primary">{formatPrice(total)} {isRTL ? 'د.ك' : 'KWD'}</span>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg" 
                      disabled={isProcessing || paymentMethod === 'online'}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          {t.checkout.processing}
                        </>
                      ) : (
                        t.checkout.placeOrder
                      )}
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-xs text-center text-muted-foreground">
                        {t.auth.loginToEarnPoints}
                      </p>
                    )}
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
