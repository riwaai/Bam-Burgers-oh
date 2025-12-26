import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-primary">404</div>
        <h1 className="text-2xl font-bold">
          {isRTL ? 'الصفحة غير موجودة' : 'Page Not Found'}
        </h1>
        <p className="text-muted-foreground">
          {isRTL 
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها'
            : "Sorry, the page you're looking for doesn't exist or has been moved."
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              {isRTL ? 'الرئيسية' : 'Go Home'}
            </Button>
          </Link>
          <Link to="/menu">
            <Button variant="outline" className="w-full sm:w-auto">
              {isRTL ? 'تصفح القائمة' : 'Browse Menu'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
