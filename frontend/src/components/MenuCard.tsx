import React, { useState } from "react";
import { Plus, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem, formatPrice } from "@/hooks/useSupabaseMenu";
import ItemDetailModal from "./ItemDetailModal";

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard = ({ item }: MenuCardProps) => {
  const { t, isRTL } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const hasModifiers = item.modifier_groups && item.modifier_groups.length > 0;
  const displayName = isRTL ? item.name_ar : item.name_en;
  const displayDescription = isRTL ? item.description_ar : item.description_en;
  const isAvailable = item.status === 'active';

  // Default image if none provided
  const imageUrl = item.image_url || 'https://png.pngtree.com/png-vector/20191129/ourmid/pngtree-hand-drawn-fast-food-doodle-vector-set-of-fast-food-vector-png-image_2046737.jpg';

  const handleClick = () => {
    setShowModal(true);
  };

  return (
    <>
      <Card 
        className="menu-card cursor-pointer group"
        onClick={handleClick}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500';
            }}
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {item.sort_order <= 4 && (
              <Badge className="bg-primary text-primary-foreground shadow-md">
                <Flame className="h-3 w-3 mr-1" />
                {t.menu.popular}
              </Badge>
            )}
          </div>
          {!isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="secondary" className="text-base">
                {t.menu.outOfStock}
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">
              {displayName}
            </h3>
            <span className="font-bold text-primary whitespace-nowrap text-lg">
              {formatPrice(item.base_price)}
              <span className="text-xs text-muted-foreground ml-1">
                {isRTL ? 'د.ك' : 'KWD'}
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {displayDescription || ''}
          </p>
          <Button 
            className="w-full" 
            size="sm"
            disabled={!isAvailable}
          >
            <Plus className="h-4 w-4 mr-2" />
            {hasModifiers ? t.menu.customize : t.menu.addToCart}
          </Button>
        </CardContent>
      </Card>

      {/* Item Detail Modal */}
      <ItemDetailModal 
        item={item}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default MenuCard;
