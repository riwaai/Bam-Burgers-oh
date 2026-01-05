import React from "react";
import { ChefHat, Heart, Leaf, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t, isRTL } = useLanguage();

  const values = [
    {
      icon: ChefHat,
      title: isRTL ? 'مصنوع بعناية' : 'Crafted with Care',
      description: isRTL 
        ? 'كل برجر يُصنع بعناية باستخدام وصفاتنا المميزة'
        : 'Every burger is handcrafted using our signature recipes'
    },
    {
      icon: Leaf,
      title: isRTL ? 'مكونات طازجة' : 'Fresh Ingredients',
      description: isRTL
        ? 'نستخدم فقط المكونات الطازجة من أفضل الموردين'
        : 'We use only the freshest ingredients from trusted suppliers'
    },
    {
      icon: Heart,
      title: isRTL ? 'مصنوع بحب' : 'Made with Love',
      description: isRTL
        ? 'شغفنا بالطعام الجيد يظهر في كل وجبة نقدمها'
        : 'Our passion for great food shows in every meal we serve'
    },
    {
      icon: Award,
      title: isRTL ? 'جودة متميزة' : 'Premium Quality',
      description: isRTL
        ? 'نلتزم بأعلى معايير الجودة في كل ما نقدمه'
        : 'We maintain the highest quality standards in everything we do'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        {/* Hero */}
        <section className="relative py-20 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRTL ? 'عن بام برجرز' : 'About Bam Burgers'}
            </h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              {isRTL 
                ? 'نقدم أفضل برجر في الكويت منذ عام 2025. نؤمن بالجودة والطعم والخدمة المتميزة'
                : 'Serving the best burgers in Kuwait since 2025. We believe in quality, taste, and exceptional service.'
              }
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">
                {isRTL ? 'قصتنا' : 'Our Story'}
              </h2>
              <p className={`text-muted-foreground leading-relaxed ${isRTL ? 'text-right' : ''}`}>
                {isRTL 
                  ? 'بدأت رحلة بام برجرز من حب بسيط للبرجر الجيد. أردنا أن نقدم شيئاً مختلفاً - برجر مصنوع بعناية من مكونات طازجة ووصفات مميزة. اليوم، نفخر بخدمة آلاف العملاء الذين يشاركوننا شغفنا بالطعام الجيد.'
                  : 'Bam Burgers started from a simple love for great burgers. We wanted to offer something different - burgers crafted with care using fresh ingredients and unique recipes. Today, we\'re proud to serve thousands of customers who share our passion for good food.'
                }
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isRTL ? 'قيمنا' : 'Our Values'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <value.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isRTL ? 'صور من مطبخنا' : 'From Our Kitchen'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                'https://i.pinimg.com/1200x/6c/98/ce/6c98cea3f45baa66b089a864f5633b4a.jpg',
                'https://i.pinimg.com/1200x/81/52/cb/8152cb70a460856fe674fc07f46f68db.jpg',
                'https://i.pinimg.com/1200x/20/7a/45/207a4513e969cd8161986bebae7ea117.jpg',
                'https://i.pinimg.com/1200x/4b/f5/78/4bf578d31490356b404cd2249b49c15b.jpg',
              ].map((img, index) => (
                <div key={index} className="aspect-square rounded-xl overflow-hidden">
                  <img 
                    src={img} 
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
