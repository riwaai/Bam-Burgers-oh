import React, { useState, useEffect } from "react";
import { Gift, Star, Trophy, Crown, ArrowRight, Lock, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Link } from "react-router-dom";
import { supabase, TENANT_ID } from "@/integrations/supabase/client";

interface LoyaltySettings {
  enabled: boolean;
  points_per_kwd: number;
  min_order_amount: number;
  redemption_rate: number;
  min_points_to_redeem: number;
  max_redemption_percent: number;
}

const Loyalty = () => {
  const { t, isRTL } = useLanguage();
  const { customer, isAuthenticated } = useCustomerAuth();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltySettings();
  }, []);

  const fetchLoyaltySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching loyalty settings:', error);
      }
      
      setSettings(data || {
        enabled: true,
        points_per_kwd: 1,
        min_order_amount: 0,
        redemption_rate: 0.01,
        min_points_to_redeem: 0,
        max_redemption_percent: 100
      });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentPoints = customer?.loyalty_points || 0;
  
  // Calculate how much 1 point is worth
  const pointValue = settings?.redemption_rate || 0.01; // e.g., 0.01 means 100 points = 1 KWD
  const pointsPerKWD = settings?.points_per_kwd || 1;
  
  // Points needed for different reward amounts
  const getPointsForValue = (kwdValue: number) => Math.ceil(kwdValue / pointValue);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!settings?.enabled) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="container mx-auto px-4 text-center">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {isRTL ? 'برنامج الولاء غير متاح حالياً' : 'Loyalty Program Currently Unavailable'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'يرجى العودة لاحقاً' : 'Please check back later'}
            </p>
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
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Gift className="h-4 w-4" />
              <span className="text-sm font-medium">{t.loyalty.title}</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {isRTL ? (
                <>برنامج <span className="text-primary">الولاء</span></>
              ) : (
                <><span className="text-primary">Loyalty</span> Program</>
              )}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.loyalty.subtitle}
            </p>
          </div>

          {isAuthenticated ? (
            <>
              {/* User Points Card */}
              <Card className="max-w-2xl mx-auto mb-12">
                <CardContent className="p-8">
                  <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Gift className="h-10 w-10 text-primary" />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm text-muted-foreground">{t.loyalty.yourPoints}</p>
                      <p className="text-4xl font-bold text-primary">{currentPoints}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isRTL 
                          ? `يساوي ${(currentPoints * pointValue).toFixed(3)} د.ك` 
                          : `Worth ${(currentPoints * pointValue).toFixed(3)} KWD`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Not Logged In */
            <Card className="max-w-md mx-auto mb-12">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {isRTL ? 'سجل دخولك لتتبع نقاطك' : 'Sign in to track your points'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {isRTL ? 'اكسب نقاط مع كل طلب واستبدلها بمكافآت رائعة' : 'Earn points with every order and redeem them for great rewards'}
                </p>
                <Link to="/login">
                  <Button>
                    {t.auth.login}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* How It Works */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className={`text-2xl font-bold mb-8 ${isRTL ? 'text-right' : 'text-center'}`}>
              {t.loyalty.howItWorks}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    1
                  </div>
                  <p className="font-medium">
                    {isRTL 
                      ? `اكسب ${pointsPerKWD} نقطة مع كل دينار كويتي تنفقه`
                      : `Earn ${pointsPerKWD} point${pointsPerKWD > 1 ? 's' : ''} for every 1 KWD you spend`}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    2
                  </div>
                  <p className="font-medium">
                    {isRTL 
                      ? 'تجمع نقاطك تلقائياً مع كل طلب'
                      : 'Points accumulate automatically with each order'}
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 mx-auto bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                    3
                  </div>
                  <p className="font-medium">
                    {isRTL 
                      ? 'استبدل نقاطك بخصم على طلبك القادم'
                      : 'Redeem points for discounts on your next order'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Points Value Info */}
          <Card className="max-w-2xl mx-auto mb-12">
            <CardContent className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? 'قيمة النقاط' : 'Points Value'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">{pointsPerKWD}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'نقطة لكل 1 د.ك' : 'point(s) per 1 KWD'}
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">{getPointsForValue(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'نقطة = خصم 1 د.ك' : 'points = 1 KWD discount'}
                  </p>
                </div>
              </div>
              
              {settings.min_points_to_redeem > 0 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {isRTL 
                    ? `الحد الأدنى للاستبدال: ${settings.min_points_to_redeem} نقطة`
                    : `Minimum to redeem: ${settings.min_points_to_redeem} points`}
                </p>
              )}
              
              {settings.max_redemption_percent < 100 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {isRTL 
                    ? `يمكنك استخدام النقاط لتغطية حتى ${settings.max_redemption_percent}% من طلبك`
                    : `You can use points to cover up to ${settings.max_redemption_percent}% of your order`}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Loyalty;
