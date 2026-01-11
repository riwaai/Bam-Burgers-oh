import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'cancelled';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState<PaymentStatus>('verifying');
  const [orderData, setOrderData] = useState<{
    order_id?: string;
    order_number?: string;
    transaction_id?: string;
    message?: string;
  }>({});
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  
  // Tap sends tap_id in the redirect URL - this is the charge ID
  const tapId = searchParams.get('tap_id');
  // Our order_id for looking up the order
  const orderId = searchParams.get('order_id');
  // Legacy ref parameter
  const chargeRef = searchParams.get('ref');

  useEffect(() => {
    const verifyPayment = async () => {
      // We need either tap_id (from Tap redirect) or order_id
      if (!tapId && !orderId && !chargeRef) {
        setStatus('failed');
        setOrderData({ message: 'Invalid payment reference' });
        return;
      }

      try {
        // Build verification URL with all parameters
        let verifyUrl = `${BACKEND_URL}/api/payment/verify`;
        const params = new URLSearchParams();
        if (tapId) params.append('tap_id', tapId);
        if (orderId) params.append('order_id', orderId);
        if (chargeRef) params.append('ref', chargeRef);
        verifyUrl += `?${params.toString()}`;
        
        console.log('Verifying payment:', { tapId, orderId, chargeRef });
        
        const response = await fetch(verifyUrl);
        const result = await response.json();
        
        console.log('Payment verification result:', result);
        
        if (result.success && result.status === 'paid') {
          // Payment successful - order created
          setStatus('success');
          setOrderData({
            order_id: result.order_id,
            order_number: result.order_number,
            transaction_id: result.transaction_id,
            message: result.message
          });
          // Clear cart on successful payment
          clearCart();
        } else if (result.status === 'pending' && verificationAttempts < 5) {
          // Payment still processing, retry after a delay
          setTimeout(() => {
            setVerificationAttempts(prev => prev + 1);
          }, 2000);
        } else if (result.status === 'failed' || result.status === 'cancelled') {
          setStatus('failed');
          setOrderData({ message: result.message || 'Payment was not completed' });
        } else {
          setStatus('failed');
          setOrderData({ message: result.message || 'Payment verification failed' });
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setOrderData({ message: 'Could not verify payment. Please contact support.' });
      }
    };

    if (status === 'verifying') {
      verifyPayment();
    }
  }, [tapId, orderId, chargeRef, verificationAttempts, status, clearCart]);

  const handleBackToCheckout = () => {
    // Navigate back to checkout - cart is preserved since we didn't clear it
    navigate('/checkout');
  };

  const handleTrackOrder = () => {
    if (orderData.order_id) {
      navigate(`/track-order/${orderData.order_id}?order_number=${orderData.order_number}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            {status === 'verifying' && (
              <>
                <Loader2 className="h-16 w-16 mx-auto mb-4 text-primary animate-spin" />
                <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment with Tap.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a few seconds.
                </p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h2>
                <p className="text-muted-foreground mb-4">
                  Your order has been placed successfully.
                </p>
                
                {orderData.order_number && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="text-xl font-bold text-primary">{orderData.order_number}</p>
                    {orderData.transaction_id && (
                      <>
                        <p className="text-sm text-muted-foreground mt-2">Transaction ID</p>
                        <p className="text-sm font-mono">{orderData.transaction_id}</p>
                      </>
                    )}
                  </div>
                )}
                
                <div className="space-y-3">
                  <Button className="w-full" onClick={handleTrackOrder}>
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
                <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h2>
                <p className="text-muted-foreground mb-2">
                  {orderData.message || 'Your payment could not be processed.'}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your cart items have been preserved. You can try again.
                </p>
                
                <div className="space-y-3">
                  <Button className="w-full" onClick={handleBackToCheckout}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Checkout
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/cart')}>
                    Review Cart
                  </Button>
                </div>
              </>
            )}

            {status === 'cancelled' && (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-yellow-600">Payment Cancelled</h2>
                <p className="text-muted-foreground mb-2">
                  You cancelled the payment process.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your cart items are still available. You can try again when ready.
                </p>
                
                <div className="space-y-3">
                  <Button className="w-full" onClick={handleBackToCheckout}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Checkout
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/menu')}>
                    Continue Shopping
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
