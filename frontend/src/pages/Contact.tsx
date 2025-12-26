import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const Contact = () => {
  const { t, isRTL } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(isRTL ? 'تم إرسال رسالتك بنجاح!' : 'Message sent successfully!');
    setFormData({ name: '', email: '', phone: '', message: '' });
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: isRTL ? 'العنوان' : 'Address',
      value: t.restaurant.address,
    },
    {
      icon: Phone,
      title: isRTL ? 'الهاتف' : 'Phone',
      value: t.restaurant.phone,
      href: `tel:${t.restaurant.phone}`,
    },
    {
      icon: Mail,
      title: isRTL ? 'البريد الإلكتروني' : 'Email',
      value: t.restaurant.email,
      href: `mailto:${t.restaurant.email}`,
    },
    {
      icon: Clock,
      title: isRTL ? 'ساعات العمل' : 'Hours',
      value: t.restaurant.hoursWeekday,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isRTL ? (
                <>اتصل <span className="text-primary">بنا</span></>
              ) : (
                <>Contact <span className="text-primary">Us</span></>
              )}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'نسعد بالتواصل معك! أرسل لنا رسالة أو قم بزيارتنا في أي وقت'
                : "We'd love to hear from you! Send us a message or visit us anytime."
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${isRTL ? 'text-right' : ''}`}>
                {isRTL ? 'معلومات التواصل' : 'Get in Touch'}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.map((info, index) => (
                  <Card key={index}>
                    <CardContent className={`p-4 flex items-start gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.title}</p>
                        {info.href ? (
                          <a href={info.href} className="font-medium hover:text-primary transition-colors">
                            {info.value}
                          </a>
                        ) : (
                          <p className="font-medium">{info.value}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Map */}
              <div className="h-64 rounded-xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3479.123456789!2d48.0123456!3d29.3123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDE4JzQ0LjQiTiA0OMKwMDAnNDQuNCJF!5e0!3m2!1sen!2skw!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className={isRTL ? 'text-right' : ''}>
                  {isRTL ? 'أرسل لنا رسالة' : 'Send us a Message'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{isRTL ? 'الاسم' : 'Name'}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className={isRTL ? 'text-right' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{isRTL ? 'الهاتف' : 'Phone'}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">{isRTL ? 'الرسالة' : 'Message'}</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      className={isRTL ? 'text-right' : ''}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isRTL ? 'جاري الإرسال...' : 'Sending...'}</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />{isRTL ? 'إرسال' : 'Send Message'}</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
