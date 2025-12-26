import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, MapPin, Clock, Receipt, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder } from "@/contexts/OrderContext";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order_number') || orderId;
  const { t, isRTL } = useLanguage();
  const { orderType, selectedBranch } = useOrder();

  const estimatedTime = orderType === 'delivery' ? '30-45' : '15-20';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Animation */}
          <div className="text-center mb-8 animate-scale-in">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-14 w-14 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              {t.orderConfirmation.title}
            </h1>
            <p className="text-muted-foreground">
              {t.orderConfirmation.thankYou}
            </p>
          </div>

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardContent className="p-6 space-y-6">
              {/* Order Number */}
              <div className={`flex items-center justify-between p-4 bg-primary/5 rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm text-muted-foreground">{t.orderConfirmation.orderNumber}</p>
                  <p className="text-2xl font-bold text-primary">{orderNumber}</p>
                </div>
                <Receipt className="h-10 w-10 text-primary" />
              </div>

              {/* Estimated Time */}
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm text-muted-foreground">{t.orderConfirmation.estimatedTime}</p>
                  <p className="text-xl font-semibold">{estimatedTime} {t.orderConfirmation.minutes}</p>
                </div>
              </div>

              {/* Location */}
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm text-muted-foreground">
                    {orderType === 'delivery' 
                      ? (isRTL ? 'التوصيل إلى' : 'Delivering to')
                      : (isRTL ? 'الاستلام من' : 'Pickup from')
                    }
                  </p>
                  <p className="font-medium">
                    {orderType === 'delivery' 
                      ? (isRTL ? 'عنوانك المحدد' : 'Your delivery address')
                      : (isRTL ? selectedBranch?.name_ar : selectedBranch?.name)
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to={`/track-order/${orderId}`} className="flex-1">
              <Button className="w-full" size="lg">
                {t.orderConfirmation.trackOrder}
                <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </Link>
            <Link to="/menu" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                {t.orderConfirmation.orderAnother}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
