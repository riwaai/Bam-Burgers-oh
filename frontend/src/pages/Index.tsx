import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Star, Truck, Flame, Gift, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MenuItemCard from "@/components/MenuItemCard";
import OrderTypeModal from "@/components/OrderTypeModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder } from "@/contexts/OrderContext";
import { usePopularItems } from "@/hooks/useSupabaseMenu";

// Logo URL
const LOGO_URL = "https://customer-assets.emergentagent.com/job_bam-delivery/artifacts/gxx028af_Logo.png";

const Index = () => {
  const { t, isRTL } = useLanguage();
  const { showOrderTypeModal, setShowOrderTypeModal } = useOrder();
  const { items: popularItems, loading } = usePopularItems();

  // Show order type modal on first visit
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('bam-seen-order-modal');
    if (!hasSeenModal) {
      setShowOrderTypeModal(true);
      localStorage.setItem('bam-seen-order-modal', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url('https://i.pinimg.com/1200x/2f/9c/bd/2f9cbd028868e879a48c1e1b2c7829e9.jpg')` 
          }}
        >
          <div className={`absolute inset-0 ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/90 via-black/70 to-transparent`} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className={`max-w-2xl space-y-6 ${isRTL ? 'mr-auto text-right' : 'ml-0'}`}>
            {/* Logo */}
            <img 
              src={LOGO_URL} 
              alt="Bam Burgers" 
              className="h-20 md:h-28 w-auto mb-4"
            />
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              <span className="text-primary">THE PEOPLE'S SANDWICH</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-lg">
              {t.hero.subtitle}
            </p>
            <div className={`flex flex-wrap gap-4 ${isRTL ? 'justify-end' : ''}`}>
              <Link to="/menu">
                <Button size="lg" className="text-lg px-8 shadow-lg hover:shadow-xl transition-shadow">
                  {t.hero.orderNow}
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
              <Link to="/menu">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  {t.hero.viewMenu}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Popular Items - FROM SUPABASE */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className={`mb-12 ${isRTL ? 'text-right' : 'text-center'}`}>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">{t.menu.popular}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? (
                <>الأكثر <span className="text-primary">طلباً</span></>
              ) : (
                <>Most <span className="text-primary">Popular</span> Items</>
              )}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL
                ? 'الأصناف المفضلة لدى عملائنا - مجربة ومحبوبة من الآلاف'
                : "Our customers' favorites - tried, tested, and loved by thousands"
              }
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/menu">
              <Button variant="outline" size="lg" className="group">
                {isRTL ? 'عرض القائمة كاملة' : 'View Full Menu'}
                <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${isRTL ? 'mr-2 rotate-180 group-hover:-translate-x-1' : 'ml-2'}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 border-none bg-background">
              <CardContent className="pt-6 space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  {isRTL ? 'توصيل سريع' : 'Fast Delivery'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL 
                    ? 'طعام ساخن وطازج يصل إلى باب منزلك في 30 دقيقة أو أقل'
                    : 'Hot and fresh food delivered to your doorstep in 30 minutes or less'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 border-none bg-background">
              <CardContent className="pt-6 space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  {isRTL ? 'أفضل جودة' : 'Best Quality'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL
                    ? 'مكونات فاخرة ووصفات مصنوعة بإتقان من قبل طهاتنا'
                    : 'Premium ingredients and recipes crafted to perfection by our chefs'
                  }
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 border-none bg-background">
              <CardContent className="pt-6 space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  {isRTL ? 'نفتح متأخراً' : 'Open Late'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL
                    ? 'تشتهي طعاماً في الليل؟ نحن مفتوحون حتى الساعة 1 صباحاً يومياً'
                    : "Craving food at night? We're open until 12:30 AM daily"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA - Loyalty Section */}
      <section className="py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Gift className="h-12 w-12 mx-auto mb-4 text-white/90" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.loyalty.title}
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            {t.loyalty.subtitle}
          </p>
          <Link to="/loyalty">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              {t.loyalty.joinNow}
              <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Order Now CTA */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? (
                <>جاهز <span className="text-primary">للطلب؟</span></>
              ) : (
                <>Ready to <span className="text-primary">Order?</span></>
              )}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isRTL
                ? 'اطلب الآن واحصل على توصيل سريع لباب منزلك'
                : 'Order now and get fast delivery right to your doorstep'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/menu">
                <Button size="lg" className="text-lg px-8">
                  {t.hero.orderNow}
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Button>
              </Link>
              <a href={`tel:${t.restaurant.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-5 w-5" />
                <span className="font-medium">{t.restaurant.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Order Type Modal */}
      <OrderTypeModal 
        isOpen={showOrderTypeModal} 
        onClose={() => setShowOrderTypeModal(false)} 
      />
    </div>
  );
};

export default Index;
