import React from "react";
import { Gift, Star, Trophy, Crown, ArrowRight, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Link } from "react-router-dom";

const Loyalty = () => {
  const { t, isRTL } = useLanguage();
  const { customer, isAuthenticated } = useCustomerAuth();

  const tiers = [
    { id: 'bronze', name: t.loyalty.bronze, name_ar: 'برونزي', icon: Star, points: 0, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { id: 'silver', name: t.loyalty.silver, name_ar: 'فضي', icon: Trophy, points: 500, color: 'text-gray-500', bgColor: 'bg-gray-100' },
    { id: 'gold', name: t.loyalty.gold, name_ar: 'ذهبي', icon: Crown, points: 1500, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
    { id: 'platinum', name: t.loyalty.platinum, name_ar: 'بلاتيني', icon: Gift, points: 3000, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  ];

  const currentPoints = customer?.loyalty_points || 0;
  const currentTier = tiers.find(tier => {
    const nextTier = tiers[tiers.indexOf(tier) + 1];
    return nextTier ? currentPoints < nextTier.points : true;
  }) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progressToNext = nextTier 
    ? ((currentPoints - currentTier.points) / (nextTier.points - currentTier.points)) * 100
    : 100;

  const rewards = [
    { points: 100, reward: isRTL ? 'مشروب مجاني' : 'Free Drink' },
    { points: 250, reward: isRTL ? 'بطاطس مجانية' : 'Free Fries' },
    { points: 500, reward: isRTL ? 'برجر مجاني' : 'Free Burger' },
    { points: 1000, reward: isRTL ? 'وجبة كومبو مجانية' : 'Free Combo Meal' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className={`text-center mb-12 ${isRTL ? '' : ''}`}>
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
                  <div className={`flex items-center gap-6 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-20 h-20 rounded-full ${currentTier.bgColor} flex items-center justify-center`}>
                      <currentTier.icon className={`h-10 w-10 ${currentTier.color}`} />
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="text-sm text-muted-foreground">{t.loyalty.currentTier}</p>
                      <p className={`text-2xl font-bold ${currentTier.color}`}>
                        {isRTL ? currentTier.name_ar : currentTier.name}
                      </p>
                    </div>
                    <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} text-center`}>
                      <p className="text-4xl font-bold text-primary">{currentPoints}</p>
                      <p className="text-sm text-muted-foreground">{t.loyalty.yourPoints}</p>
                    </div>
                  </div>

                  {nextTier && (
                    <div>
                      <div className={`flex justify-between text-sm mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{isRTL ? currentTier.name_ar : currentTier.name}</span>
                        <span>{isRTL ? nextTier.name_ar : nextTier.name}</span>
                      </div>
                      <Progress value={progressToNext} className="h-3" />
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        {nextTier.points - currentPoints} {t.loyalty.pointsToNext}
                      </p>
                    </div>
                  )}
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
              {[t.loyalty.step1, t.loyalty.step2, t.loyalty.step3].map((step, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 mx-auto bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                      {index + 1}
                    </div>
                    <p className="font-medium">{step}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div className="max-w-2xl mx-auto">
            <h2 className={`text-2xl font-bold mb-8 ${isRTL ? 'text-right' : 'text-center'}`}>
              {t.loyalty.redeemPoints}
            </h2>
            <div className="space-y-4">
              {rewards.map((reward, index) => (
                <Card key={index}>
                  <CardContent className={`p-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Gift className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium">{reward.reward}</span>
                    </div>
                    <Badge variant="outline" className="text-primary border-primary">
                      {reward.points} {isRTL ? 'نقطة' : 'pts'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tiers */}
          <div className="max-w-4xl mx-auto mt-12">
            <h2 className={`text-2xl font-bold mb-8 ${isRTL ? 'text-right' : 'text-center'}`}>
              {isRTL ? 'مستويات الولاء' : 'Loyalty Tiers'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tiers.map((tier) => (
                <Card key={tier.id} className={tier.id === currentTier.id ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 mx-auto ${tier.bgColor} rounded-full flex items-center justify-center mb-3`}>
                      <tier.icon className={`h-6 w-6 ${tier.color}`} />
                    </div>
                    <p className="font-semibold">{isRTL ? tier.name_ar : tier.name}</p>
                    <p className="text-sm text-muted-foreground">{tier.points}+ {isRTL ? 'نقطة' : 'pts'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Loyalty;
