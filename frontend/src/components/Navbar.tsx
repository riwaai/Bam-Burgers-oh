import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, User, Globe, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";

// Logo URL
const LOGO_URL = "https://customer-assets.emergentagent.com/job_bam-delivery/artifacts/gxx028af_Logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { isAuthenticated, customer, signOut } = useCustomerAuth();

  const navLinks = [
    { name: t.nav.home, path: "/" },
    { name: t.nav.menu, path: "/menu" },
    { name: t.nav.about, path: "/about" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        {/* Top bar with phone & hours */}
        <div className="flex items-center justify-between py-2 text-xs border-b border-border/50">
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a 
              href={`tel:${t.restaurant.phone}`}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline">{t.restaurant.phone}</span>
            </a>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="hidden sm:inline">{isRTL ? 'يومياً 11ص - 1ص' : '11AM - 1AM'}</span>
            </span>
          </div>
          
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Globe className="h-3 w-3" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
        </div>

        {/* Main navbar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src={LOGO_URL} 
              alt="Bam Burgers" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.path) ? "text-primary" : "text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {customer?.name || customer?.email}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/loyalty" className="cursor-pointer">
                      {t.nav.loyalty}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  {t.nav.login}
                </Button>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-lg ${
                    isActive(link.path) ? "text-primary bg-primary/5" : "text-foreground"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-primary px-3 py-2"
                >
                  {t.nav.login}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
