import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, MapPin, Star, Truck, Flame, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MenuCard from "@/components/MenuCard";
import OrderTypeModal from "@/components/OrderTypeModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder } from "@/contexts/OrderContext";
import { menuItems } from "@/data/menuItems";

const Index = () => {
  const { t, isRTL } = useLanguage();
  const { showOrderTypeModal, setShowOrderTypeModal, selectedBranch } = useOrder();

  const popularItems = menuItems.filter((item) => item.is_popular).slice(0, 4);

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
            backgroundImage: `url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=80')` 
          }}
        >
          <div className={`absolute inset-0 ${isRTL ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/90 via-black/70 to-transparent`} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className={`max-w-2xl space-y-6 ${isRTL ? 'mr-auto text-right' : 'ml-0'}`}>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              {t.hero.title}
              <br />
              <span className="text-primary">{t.hero.titleHighlight}</span>
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
                    : "Craving food at night? We're open until 1 AM daily"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Items */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>

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

      {/* Location */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-6 ${isRTL ? 'order-2 text-right' : ''}`}>
              <h2 className="text-3xl md:text-4xl font-bold">
                {isRTL ? (
                  <>اعثر <span className="text-primary">علينا</span></>
                ) : (
                  <>Find <span className="text-primary">Us</span></>
                )}
              </h2>
              <p className="text-muted-foreground">
                {isRTL
                  ? 'قم بزيارتنا في موقعنا المريح. نوفر خيارات تناول الطعام في المكان والاستلام'
                  : 'Visit us at our convenient location. We offer both dine-in and takeout options.'
                }
              </p>
              <div className="space-y-4">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <span>{isRTL ? selectedBranch?.address_ar : selectedBranch?.address}</span>
                </div>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <span>{t.restaurant.hoursWeekday}</span>
                </div>
              </div>
              <Link to="/contact">
                <Button variant="outline" className="group">
                  {isRTL ? 'احصل على الاتجاهات' : 'Get Directions'}
                  <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'mr-2 rotate-180 group-hover:-translate-x-1' : 'ml-2'}`} />
                </Button>
              </Link>
            </div>
            <div className={`${isRTL ? 'order-1' : ''}`}>
              <div className="bg-muted rounded-2xl aspect-video flex items-center justify-center overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3479.123456789!2d48.0123456!3d29.3123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDE4JzQ0LjQiTiA0OMKwMDAnNDQuNCJF!5e0!3m2!1sen!2skw!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-2xl"
                />
              </div>
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
