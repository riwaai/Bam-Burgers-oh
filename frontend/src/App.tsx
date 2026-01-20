import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Contexts
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { OrderProvider } from "@/contexts/OrderContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";

// Components
import ScrollToTop from "@/components/ScrollToTop";
import CartFooter from "@/components/CartFooter";

// Customer Pages
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import About from "./pages/About";
import Loyalty from "./pages/Loyalty";
import CustomerLogin from "./pages/CustomerLogin";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminLoyalty from "./pages/admin/AdminLoyalty";
import AdminZones from "./pages/admin/AdminZones";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminModifiers from "./pages/admin/AdminModifiers";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminOperatingHours from "./pages/admin/AdminOperatingHours";
import AdminCouponUsage from "./pages/admin/AdminCouponUsage";

// Payment Result Page
const PaymentResult = React.lazy(() => import("./pages/PaymentResult"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <CustomerAuthProvider>
          <AdminAuthProvider>
            <OrderProvider>
              <CartProvider>
                <Toaster />
                <Sonner position="top-center" />
                <BrowserRouter>
                  <ScrollToTop />
                  <CartFooter />
                  <Routes>
                    {/* Customer Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                    <Route path="/track-order/:orderId" element={<OrderTracking />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/loyalty" element={<Loyalty />} />
                    <Route path="/login" element={<CustomerLogin />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="menu" element={<AdminMenu />} />
                      <Route path="modifiers" element={<AdminModifiers />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="coupon-usage" element={<AdminCouponUsage />} />
                      <Route path="loyalty" element={<AdminLoyalty />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="zones" element={<AdminZones />} />
                      <Route path="operating-hours" element={<AdminOperatingHours />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>
                    
                    {/* Payment Result */}
                    <Route path="/payment-result" element={
                      <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
                        <PaymentResult />
                      </React.Suspense>
                    } />
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </CartProvider>
            </OrderProvider>
          </AdminAuthProvider>
        </CustomerAuthProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
