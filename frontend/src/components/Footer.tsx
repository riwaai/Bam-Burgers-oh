import React from "react";
import { Link } from "react-router-dom";
import { Phone, Clock, Facebook, Instagram, Twitter, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Logo URL
const LOGO_URL = "https://customer-assets.emergentagent.com/job_bam-delivery/artifacts/gxx028af_Logo.png";

// Restaurant Address
const RESTAURANT_ADDRESS = "Kitchen Park Salwa - 834C+HH Rumaithiya, Kuwait";
const RESTAURANT_ADDRESS_AR = "كيتشن بارك سلوى - 834C+HH الرميثية، الكويت";

const Footer = () => {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img 
                src={LOGO_URL} 
                alt="Bam Burgers" 
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-sm opacity-80">
              {t.footer.description}
            </p>
            <div className="flex gap-4">             
              <a href="https://www.instagram.com/eatbam/" target ="_blank" className="hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>          
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">{t.footer.quickLinks}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/menu" className="text-sm opacity-80 hover:text-primary hover:opacity-100 transition-all">
                  {t.footer.ourMenu}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm opacity-80 hover:text-primary hover:opacity-100 transition-all">
                  {t.footer.aboutUs}
                </Link>
              </li>
              <li>
                <Link to="/loyalty" className="text-sm opacity-80 hover:text-primary hover:opacity-100 transition-all">
                  {t.footer.loyaltyProgram}
                </Link>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">{isRTL ? 'موقعنا' : 'Our Location'}</h4>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm opacity-80">
                {isRTL ? RESTAURANT_ADDRESS_AR : RESTAURANT_ADDRESS}
              </p>
            </div>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">{t.footer.contact}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                <a href={`tel:${t.restaurant.phone}`} className="text-sm opacity-80 hover:text-primary hover:opacity-100 transition-all">
                  {t.restaurant.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm opacity-80">
                  {t.restaurant.hoursWeekday}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-sm opacity-70">
              © {new Date().getFullYear()} {t.restaurant.name}. {t.footer.allRightsReserved}
            </p>
            <div className="flex gap-4 text-sm opacity-70">
              <a href="#" className="hover:opacity-100 hover:text-primary transition-all">
                {t.footer.privacyPolicy}
              </a>
              <a href="#" className="hover:opacity-100 hover:text-primary transition-all">
                {t.footer.termsOfService}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
