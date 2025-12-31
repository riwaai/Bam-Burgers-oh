import React, { useState, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MenuCard from "@/components/MenuCard";
import OrderTypeModal from "@/components/OrderTypeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder } from "@/contexts/OrderContext";
import { useCategories, useMenuItems } from "@/hooks/useSupabaseMenu";

const Menu = () => {
  const { t, isRTL } = useLanguage();
  const { showOrderTypeModal, setShowOrderTypeModal } = useOrder();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch from Supabase
  const { categories: dbCategories, loading: categoriesLoading } = useCategories();
  const { items: dbItems, loading: itemsLoading } = useMenuItems(activeCategory);

  // Build categories array with "All" option
  const categories = useMemo(() => {
    const allOption = { 
      id: 'all', 
      name_en: 'All Items', 
      name_ar: 'جميع الأصناف',
      sort_order: 0 
    };
    return [allOption, ...dbCategories];
  }, [dbCategories]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return dbItems;
    
    const query = searchQuery.toLowerCase();
    return dbItems.filter((item) => 
      item.name_en.toLowerCase().includes(query) ||
      item.name_ar.includes(query) ||
      (item.description_en && item.description_en.toLowerCase().includes(query)) ||
      (item.description_ar && item.description_ar.includes(query))
    );
  }, [dbItems, searchQuery]);

  const loading = categoriesLoading || itemsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className={`mb-8 ${isRTL ? 'text-right' : 'text-center'}`}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isRTL ? (
                <><span className="text-primary">قائمتنا</span></>
              ) : (
                <>Our <span className="text-primary">Menu</span></>
              )}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.menu.subtitle}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                type="text"
                placeholder={t.common.search + '...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10 text-right' : 'pl-10'} h-12 rounded-full border-2 focus:border-primary`}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-10 overflow-x-auto scrollbar-hide">
            <div className={`flex gap-2 pb-2 min-w-max ${isRTL ? 'flex-row-reverse justify-end' : 'justify-center'}`}>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full whitespace-nowrap transition-all ${
                    activeCategory === category.id 
                      ? 'shadow-md' 
                      : 'hover:border-primary hover:text-primary'
                  }`}
                  size="sm"
                >
                  {isRTL ? category.name_ar : category.name_en}
                </Button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length > 0 ? (
            /* Menu Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">{t.menu.noItems}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
              >
                {isRTL ? 'عرض جميع الأصناف' : 'Show All Items'}
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Order Type Modal */}
      <OrderTypeModal 
        isOpen={showOrderTypeModal} 
        onClose={() => setShowOrderTypeModal(false)} 
      />
    </div>
  );
};

export default Menu;
