import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder } from "@/contexts/OrderContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { formatPrice } from "@/data/menuItems";

const Cart = () => {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    subtotal, 
    total, 
    appliedCoupon, 
    applyCoupon, 
    removeCoupon, 
    discount,
    deliveryFee,
    setDeliveryFee
  } = useCart();
  const { t, isRTL } = useLanguage();
  const { orderType } = useOrder();
  const { customer } = useCustomerAuth();
  const [couponCode, setCouponCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Set delivery fee based on order type
  React.useEffect(() => {
    setDeliveryFee(orderType === 'delivery' ? 0.500 : 0.5);
  }, [orderType, setDeliveryFee]);

  const handleApplyCoupon = async () => {
    if (couponCode.trim()) {
      setIsApplying(true);
      await applyCoupon(couponCode.trim(), customer?.id);
      setCouponCode("");
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="mb-8">
            <Link 
              to="/menu" 
              className={`inline-flex items-center text-primary hover:underline ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {isRTL ? (
                <>
                  {t.cart.continueShopping}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.cart.continueShopping}
                </>
              )}
            </Link>
          </div>

          <h1 className={`text-3xl md:text-4xl font-bold mb-8 ${isRTL ? 'text-right' : ''}`}>
            {isRTL ? (
              <><span className="text-primary">سلتك</span></>
            ) : (
              <>Your <span className="text-primary">Cart</span></>
            )}
          </h1>

          {items.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-muted rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">{t.cart.empty}</h2>
                <p className="text-muted-foreground">{t.cart.emptyDesc}</p>
                <Link to="/menu">
                  <Button>{t.cart.browseMenu}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <img
                          src={item.image}
                          alt={isRTL ? item.name_ar : item.name}
                          className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                        />
                        <div className={`flex-1 space-y-2 ${isRTL ? 'text-right' : ''}`}>
                          <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div>
                              <h3 className="font-semibold">{isRTL ? item.name_ar : item.name}</h3>
                              {/* Modifiers */}
                              {item.modifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.modifiers.map((mod) => (
                                    <Badge key={mod.modifier.id} variant="secondary" className="text-xs">
                                      {isRTL ? mod.modifier.name_ar : mod.modifier.name}
                                      {mod.modifier.price > 0 && ` (+${formatPrice(mod.modifier.price)})`}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {/* Special Instructions */}
                              {item.special_instructions && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {item.special_instructions}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <span className="font-bold text-primary text-lg">
                              {formatPrice(item.total_price)} {isRTL ? 'د.ك' : 'KWD'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-28">
                  <CardHeader>
                    <CardTitle>{isRTL ? 'ملخص الطلب' : 'Order Summary'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Coupon */}
                    <div className="space-y-2">
                      <label className={`text-sm font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Tag className="h-4 w-4" />
                        {t.cart.coupon}
                      </label>
                      {appliedCoupon ? (
                        <div className={`flex items-center justify-between bg-primary/10 p-3 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-sm font-medium text-primary">
                            {appliedCoupon} {t.cart.couponApplied}
                          </span>
                          <Button variant="ghost" size="sm" onClick={removeCoupon}>
                            {t.cart.removeCoupon}
                          </Button>
                        </div>
                      ) : (
                        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Input
                            placeholder={isRTL ? 'أدخل الكود' : 'Enter code'}
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            className={isRTL ? 'text-right' : ''}
                          />
                          <Button 
                            variant="outline" 
                            onClick={handleApplyCoupon}
                            disabled={isApplying}
                          >
                            {t.cart.applyCoupon}
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{t.cart.subtotal}</span>
                        <span>{formatPrice(subtotal)} {isRTL ? 'د.ك' : 'KWD'}</span>
                      </div>
                      {discount > 0 && (
                        <div className={`flex justify-between text-sm text-green-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{t.cart.discount}</span>
                          <span>-{formatPrice(discount)} {isRTL ? 'د.ك' : 'KWD'}</span>
                        </div>
                      )}
                      <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{t.cart.deliveryFee}</span>
                        <span>
                          {deliveryFee > 0 
                            ? `${formatPrice(deliveryFee)} ${isRTL ? 'د.ك' : 'KWD'}` 
                            : t.cart.free
                          }
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className={`flex justify-between font-semibold text-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span>{t.cart.total}</span>
                      <span className="text-primary">{formatPrice(total)} {isRTL ? 'د.ك' : 'KWD'}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link to="/checkout" className="w-full">
                      <Button className="w-full" size="lg">
                        {t.cart.checkout}
                        {isRTL ? (
                          <ArrowLeft className="h-5 w-5 mr-2" />
                        ) : (
                          <ArrowRight className="h-5 w-5 ml-2" />
                        )}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
