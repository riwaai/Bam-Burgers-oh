import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Clock, ChefHat, Package, Truck, Home, Store, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'picked_up';

const OrderTracking = () => {
  const { orderId } = useParams();
  const { t, isRTL } = useLanguage();
  const [status, setStatus] = useState<OrderStatus>('preparing');
  const [orderType] = useState<'delivery' | 'pickup'>('delivery');

  // Simulate status updates (in real app, this would be from Supabase realtime)
  useEffect(() => {
    const statuses: OrderStatus[] = ['confirmed', 'preparing', 'ready'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < statuses.length) {
        setStatus(statuses[currentIndex]);
        currentIndex++;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const deliverySteps = [
    { id: 'confirmed', label: t.orderTracking.confirmed, icon: Check },
    { id: 'preparing', label: t.orderTracking.preparing, icon: ChefHat },
    { id: 'ready', label: t.orderTracking.ready, icon: Package },
    { id: 'out_for_delivery', label: t.orderTracking.onTheWay, icon: Truck },
    { id: 'delivered', label: t.orderTracking.delivered, icon: Home },
  ];

  const pickupSteps = [
    { id: 'confirmed', label: t.orderTracking.confirmed, icon: Check },
    { id: 'preparing', label: t.orderTracking.preparing, icon: ChefHat },
    { id: 'ready', label: t.orderTracking.ready, icon: Package },
    { id: 'picked_up', label: t.orderTracking.pickedUp, icon: Store },
  ];

  const steps = orderType === 'delivery' ? deliverySteps : pickupSteps;
  const currentStepIndex = steps.findIndex(s => s.id === status);

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className={`text-3xl font-bold mb-8 ${isRTL ? 'text-right' : ''}`}>
            <span className="text-primary">{t.orderTracking.title}</span>
          </h1>

          {/* Status Timeline */}
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
                      {/* Icon */}
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
                      
                      {/* Line */}
                      {index < steps.length - 1 && (
                        <div className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-10 w-0.5 h-8 transition-all duration-500 ${
                          stepStatus === 'completed' ? 'bg-green-500' : 'bg-muted'
                        }`} />
                      )}
                      
                      {/* Label */}
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

          {/* Estimated Time */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className={isRTL ? 'text-right' : ''}>
                  <p className="text-sm text-muted-foreground">
                    {orderType === 'delivery' ? t.orderTracking.estimatedDelivery : t.orderTracking.estimatedPickup}
                  </p>
                  <p className="text-xl font-semibold">15-20 {t.orderConfirmation.minutes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
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

          {/* Back to Menu */}
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
    </div>
  );
};

export default OrderTracking;
