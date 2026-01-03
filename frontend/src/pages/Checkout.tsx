import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Truck, MapPin, CreditCard, Banknote, Loader2, Store, Navigation, AlertTriangle } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, useMapEvents, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Backend API URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

// Kuwait center coordinates (Salwa area)
const KUWAIT_CENTER: [number, number] = [29.3117, 47.9774];

type PaymentMethod = 'cash' | 'online';

interface DeliveryZone {
  id: string;
  zone_name: string;
  coordinates: number[][];
  delivery_fee: number;
  min_order_amount: number;
  status: string;
}

// Point in polygon check
function isPointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Map click handler component
function LocationMarker({ position, onPositionChange }: { 
  position: [number, number] | null;
  onPositionChange: (pos: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, total, discount, deliveryFee, clearCart, setDeliveryFee } = useCart();
  const { t, isRTL } = useLanguage();
  const { orderType, deliveryAddress, selectedBranch } = useOrder();
  const { customer, isAuthenticated } = useCustomerAuth();

  const isPickup = orderType === 'pickup';
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [isInDeliveryZone, setIsInDeliveryZone] = useState<boolean | null>(null);
  const [zoneFee, setZoneFee] = useState<number>(0);
  
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

  // Fetch delivery zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('status', 'active');
        
        if (error) throw error;
        setDeliveryZones(data || []);
      } catch (err) {
        console.error('Error fetching zones:', err);
      }
    };
    
    if (!isPickup) {
      fetchZones();
    }
  }, [isPickup]);

  // Check if selected position is in a delivery zone
  useEffect(() => {
    if (!mapPosition || isPickup || deliveryZones.length === 0) {
      setIsInDeliveryZone(null);
      setSelectedZone(null);
      return;
    }

    // Check each zone
    for (const zone of deliveryZones) {
      if (zone.coordinates && isPointInPolygon(mapPosition, zone.coordinates)) {
        setIsInDeliveryZone(true);
        setSelectedZone(zone);
        setZoneFee(zone.delivery_fee || 0);
        setDeliveryFee(zone.delivery_fee || 0);
        return;
      }
    }

    // Not in any zone
    setIsInDeliveryZone(false);
    setSelectedZone(null);
    setZoneFee(0);
  }, [mapPosition, deliveryZones, isPickup, setDeliveryFee]);

  // Reverse geocode using Nominatim
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      const address = data.address || {};
      
      // Extract address components
      const area = address.suburb || address.neighbourhood || address.city_district || address.town || address.city || '';
      const street = address.road || address.street || '';
      const building = address.house_number || '';
      const block = address.quarter || '';
      
      setFormData(prev => ({
        ...prev,
        area: area,
        street: street,
        building: building || prev.building,
        block: block || prev.block,
      }));
      
      toast.success(isRTL ? 'تم تحديد العنوان' : 'Address detected from map');
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      toast.error(isRTL ? 'فشل في تحديد العنوان' : 'Failed to detect address');
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [isRTL]);

  // Handle map position change
  const handleMapPositionChange = useCallback((pos: [number, number]) => {
    setMapPosition(pos);
    reverseGeocode(pos[0], pos[1]);
  }, [reverseGeocode]);

  // Get current location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setMapPosition(pos);
        reverseGeocode(pos[0], pos[1]);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location');
      }
    );
  };

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

    // Check delivery zone
    if (!isPickup && isInDeliveryZone === false) {
      toast.error(isRTL ? 'عذراً، موقعك خارج نطاق التوصيل' : 'Sorry, your location is outside our delivery area');
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
        geo_lat: mapPosition?.[0],
        geo_lng: mapPosition?.[1],
      };

      // Calculate totals with zone fee
      const orderDeliveryFee = isPickup ? 0 : zoneFee;
      const orderTotal = isPickup ? (subtotal - discount) : (subtotal - discount + orderDeliveryFee);

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

  // Calculate final total with zone fee
  const finalDeliveryFee = isPickup ? 0 : zoneFee;
  const finalTotal = isPickup ? (subtotal - discount) : (subtotal - discount + finalDeliveryFee);

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

                {/* Delivery Address with Map - Only for delivery orders */}
                {!isPickup && (
                <Card>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <MapPin className="h-5 w-5" />
                      {t.checkout.deliveryAddress}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Map Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{isRTL ? 'حدد موقعك على الخريطة' : 'Pin your location on the map'}</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleGetLocation}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          {isRTL ? 'موقعي الحالي' : 'Use my location'}
                        </Button>
                      </div>
                      
                      <div className="h-[250px] rounded-lg overflow-hidden border relative">
                        <MapContainer
                          center={mapPosition || KUWAIT_CENTER}
                          zoom={13}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          {/* Show delivery zones */}
                          {deliveryZones.map((zone, index) => (
                            zone.coordinates && (
                              <Polygon
                                key={zone.id}
                                positions={zone.coordinates.map(c => [c[0], c[1]] as [number, number])}
                                pathOptions={{
                                  color: selectedZone?.id === zone.id ? '#22c55e' : '#3b82f6',
                                  fillColor: selectedZone?.id === zone.id ? '#22c55e' : '#3b82f6',
                                  fillOpacity: 0.2,
                                }}
                              />
                            )
                          ))}
                          <LocationMarker 
                            position={mapPosition} 
                            onPositionChange={handleMapPositionChange}
                          />
                        </MapContainer>
                        
                        {isReverseGeocoding && (
                          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {isRTL 
                          ? 'انقر على الخريطة لتحديد موقعك وسيتم ملء العنوان تلقائياً'
                          : 'Click on the map to pin your location and auto-fill address'
                        }
                      </p>

                      {/* Zone Status */}
                      {mapPosition && (
                        <div className={`p-3 rounded-lg ${
                          isInDeliveryZone === true 
                            ? 'bg-green-50 border border-green-200' 
                            : isInDeliveryZone === false 
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-gray-50'
                        }`}>
                          {isInDeliveryZone === true && selectedZone ? (
                            <div className="flex items-center gap-2 text-green-700">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {isRTL ? `منطقة التوصيل: ${selectedZone.zone_name}` : `Delivery Zone: ${selectedZone.zone_name}`}
                                {' - '}
                                {isRTL ? `رسوم التوصيل: ${selectedZone.delivery_fee?.toFixed(3)} د.ك` : `Fee: ${selectedZone.delivery_fee?.toFixed(3)} KWD`}
                              </span>
                            </div>
                          ) : isInDeliveryZone === false ? (
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {isRTL ? 'عذراً، موقعك خارج نطاق التوصيل' : 'Sorry, your location is outside our delivery area'}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Address Fields */}
                    <Separator />
                    
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
                          placeholder={isRTL ? 'يتم ملؤه من الخريطة' : 'Auto-filled from map'}
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
                        placeholder={isRTL ? 'يتم ملؤه من الخريطة' : 'Auto-filled from map'}
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
                        placeholder={isRTL ? 'تعليمات إضافية للتوصيل (اختياري)' : 'Additional delivery instructions (optional)'}
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
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : ''} ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash" className={`flex items-center gap-2 cursor-pointer flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Banknote className="h-5 w-5" />
                          {t.checkout.cashOnDelivery}
                        </Label>
                      </div>
                      <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : ''} ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <RadioGroupItem value="online" id="online" disabled />
                        <Label htmlFor="online" className={`flex items-center gap-2 cursor-pointer flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <CreditCard className="h-5 w-5" />
                          {t.checkout.onlinePayment}
                          <span className="text-xs text-muted-foreground ml-2">(Coming Soon)</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>{isRTL ? 'ملاحظات الطلب' : 'Order Notes'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder={isRTL ? 'أي ملاحظات خاصة بالطلب...' : 'Any special notes for your order...'}
                      rows={3}
                      className={isRTL ? 'text-right' : ''}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>{t.checkout.orderSummary}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items */}
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {items.map((item, index) => (
                        <div key={index} className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={isRTL ? 'text-right' : ''}>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
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
                      {!isPickup && (
                        <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-muted-foreground">{t.checkout.deliveryFee}</span>
                          <span>{finalDeliveryFee > 0 ? formatPrice(finalDeliveryFee) : (isRTL ? 'حدد الموقع' : 'Select location')}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className={`flex justify-between text-lg font-bold ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{t.checkout.total}</span>
                      <span className="text-primary">{formatPrice(finalTotal)}</span>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full mt-4"
                      disabled={isProcessing || (!isPickup && isInDeliveryZone === false)}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isRTL ? 'جاري المعالجة...' : 'Processing...'}
                        </>
                      ) : (
                        t.checkout.placeOrder
                      )}
                    </Button>

                    {!isPickup && isInDeliveryZone === false && (
                      <p className="text-xs text-red-600 text-center">
                        {isRTL ? 'لا يمكن تقديم الطلب - موقعك خارج نطاق التوصيل' : 'Cannot place order - location outside delivery area'}
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
