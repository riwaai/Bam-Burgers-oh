import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User, Loader2, Smartphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { signIn, signUp, isAuthenticated } = useCustomerAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);
    if (!error) {
      navigate('/');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.name);
    setIsLoading(false);
    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          {/* Back Link */}
          <Link 
            to="/"
            className={`inline-flex items-center text-primary hover:underline mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? (
              <>{isRTL ? 'العودة للرئيسية' : 'Back to Home'}<ArrowLeft className="h-4 w-4 mr-2 rotate-180" /></>
            ) : (
              <><ArrowLeft className="h-4 w-4 mr-2" />{isRTL ? 'العودة للرئيسية' : 'Back to Home'}</>
            )}
          </Link>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">{t.restaurant.name}</CardTitle>
              <CardDescription>
                {isRTL ? 'سجل دخولك لكسب نقاط الولاء مع كل طلب' : 'Sign in to earn loyalty points with every order'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">{t.auth.login}</TabsTrigger>
                  <TabsTrigger value="signup">{t.auth.signup}</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t.auth.email}</Label>
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="email@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t.auth.password}</Label>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="login-password"
                          type="password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t.auth.login}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{isRTL ? 'الاسم' : 'Name'}</Label>
                      <div className="relative">
                        <User className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-name"
                          type="text"
                          value={signupData.name}
                          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                          className={isRTL ? 'pr-10 text-right' : 'pl-10'}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t.auth.email}</Label>
                      <div className="relative">
                        <Mail className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="email@example.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          dir="ltr"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t.auth.password}</Label>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-password"
                          type="password"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">{t.auth.confirmPassword}</Label>
                      <div className="relative">
                        <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                        <Input
                          id="signup-confirm"
                          type="password"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          className={isRTL ? 'pr-10' : 'pl-10'}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {t.auth.createAccount}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              {/* Phone OTP - Coming Soon */}
              <div className="text-center">
                <Button variant="outline" className="w-full" disabled>
                  <Smartphone className="h-4 w-4 mr-2" />
                  {t.auth.phoneOtp}
                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">{t.auth.phoneOtpDesc}</span>
                </Button>
              </div>

              {/* Guest Checkout */}
              <div className="mt-4 text-center">
                <Link to="/checkout">
                  <Button variant="ghost" className="text-muted-foreground">
                    {t.auth.guestCheckout}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerLogin;
