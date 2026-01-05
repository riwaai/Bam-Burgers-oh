import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [order, setOrder] = useState<any>(null);
  
  const orderId = searchParams.get('order_id');
  const tapId = searchParams.get('tap_id');

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!orderId) {
        setStatus('failed');
        return;
      }

      try {
        // Get order details
        const orderRes = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          setOrder(orderData);
          
          if (orderData.payment_status === 'paid') {
            setStatus('success');
          } else if (tapId) {
            // Check tap charge status
            const tapRes = await fetch(`${BACKEND_URL}/api/tap/charge/${tapId}`);
            if (tapRes.ok) {
              const tapData = await tapRes.json();
              if (tapData.status === 'CAPTURED') {
                setStatus('success');
              } else {
                setStatus('failed');
              }
            } else {
              // Assume success if we can't verify (payment might have gone through)
              setStatus('success');
            }
          } else {
            // No tap_id, assume cash payment
            setStatus('success');
          }
        } else {
          setStatus('failed');
        }
      } catch (err) {
        console.error('Error checking payment:', err);
        setStatus('failed');
      }
    };

    checkPaymentStatus();
  }, [orderId, tapId]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
                <h2 className="text-xl font-bold mb-2">Processing Payment...</h2>
                <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-xl font-bold mb-2 text-green-600">Payment Successful!</h2>
                <p className="text-muted-foreground mb-4">
                  Your order has been placed successfully.
                </p>
                {order && (
                  <p className="font-medium mb-6">
                    Order Number: <span className="text-primary">{order.order_number}</span>
                  </p>
                )}
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/track-order/${orderId}?order_number=${order?.order_number}`)}
                  >
                    Track Your Order
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/menu')}>
                    Order More
                  </Button>
                </div>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-bold mb-2 text-red-600">Payment Failed</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't process your payment. Please try again.
                </p>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => navigate('/checkout')}>
                    Try Again
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/menu')}>
                    Back to Menu
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default PaymentResult;
