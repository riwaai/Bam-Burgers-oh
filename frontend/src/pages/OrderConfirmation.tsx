import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, Truck, Clock, Receipt, ArrowRight, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order_number') || orderId;
  const { t, isRTL } = useLanguage();

  const estimatedTime = '30-45';

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

              {/* Delivery Info */}
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'التوصيل إلى' : 'Delivering to'}
                  </p>
                  <p className="font-medium">
                    {isRTL ? 'عنوانك المحدد' : 'Your delivery address'}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div className={`flex items-center gap-4 p-4 bg-muted rounded-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm">
                    {isRTL ? 'هل تحتاج مساعدة؟ اتصل بنا' : 'Need help? Call us'}
                  </p>
                  <a href="tel:+96594745424" className="font-medium text-primary hover:underline">
                    +965 9474 5424
                  </a>
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
