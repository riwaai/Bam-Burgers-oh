import React, { useState } from "react";
import { Plus, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { MenuItem, getModifierGroupsForItem, formatPrice } from "@/data/menuItems";
import ItemDetailModal from "./ItemDetailModal";

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard = ({ item }: MenuCardProps) => {
  const { t, language, isRTL } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const hasModifiers = item.modifier_group_ids.length > 0;
  const displayName = isRTL ? item.name_ar : item.name;
  const displayDescription = isRTL ? item.description_ar : item.description;

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
            src={item.image}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {item.is_popular && (
              <Badge className="bg-primary text-primary-foreground shadow-md">
                <Flame className="h-3 w-3 mr-1" />
                {t.menu.popular}
              </Badge>
            )}
          </div>
          {!item.is_available && (
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
              {formatPrice(item.price)}
              <span className="text-xs text-muted-foreground ml-1">
                {isRTL ? 'د.ك' : 'KWD'}
              </span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {displayDescription}
          </p>
          <Button 
            className="w-full" 
            size="sm"
            disabled={!item.is_available}
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
