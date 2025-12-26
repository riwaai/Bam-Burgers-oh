import React, { useState, useEffect } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart, CartItemModifier } from "@/contexts/CartContext";
import { MenuItem, ModifierGroup, Modifier, getModifierGroupsForItem, formatPrice } from "@/data/menuItems";

interface ItemDetailModalProps {
  item: MenuItem;
  isOpen: boolean;
  onClose: () => void;
}

const ItemDetailModal = ({ item, isOpen, onClose }: ItemDetailModalProps) => {
  const { t, language, isRTL } = useLanguage();
  const { addItem } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  const modifierGroups = getModifierGroupsForItem(item);
  const displayName = isRTL ? item.name_ar : item.name;
  const displayDescription = isRTL ? item.description_ar : item.description;

  // Initialize default modifiers
  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, string[]> = {};
      modifierGroups.forEach(group => {
        const defaultMods = group.modifiers
          .filter(m => m.is_default && m.is_available)
          .map(m => m.id);
        if (defaultMods.length > 0) {
          defaults[group.id] = defaultMods;
        }
      });
      setSelectedModifiers(defaults);
      setQuantity(1);
      setSpecialInstructions("");
    }
  }, [isOpen, item.id]);

  // Calculate total price
  const calculateTotal = (): number => {
    let total = item.price;
    
    modifierGroups.forEach(group => {
      const selected = selectedModifiers[group.id] || [];
      selected.forEach(modId => {
        const modifier = group.modifiers.find(m => m.id === modId);
        if (modifier) {
          total += modifier.price;
        }
      });
    });
    
    return total * quantity;
  };

  // Handle modifier selection
  const handleModifierChange = (group: ModifierGroup, modifierId: string, checked: boolean) => {
    setSelectedModifiers(prev => {
      const current = prev[group.id] || [];
      
      if (group.max_selections === 1) {
        // Radio button behavior
        return { ...prev, [group.id]: checked ? [modifierId] : [] };
      }
      
      if (checked) {
        // Check max selections
        if (current.length >= group.max_selections) {
          return prev;
        }
        return { ...prev, [group.id]: [...current, modifierId] };
      } else {
        return { ...prev, [group.id]: current.filter(id => id !== modifierId) };
      }
    });
  };

  // Validate required modifiers
  const isValid = (): boolean => {
    return modifierGroups.every(group => {
      if (!group.is_required) return true;
      const selected = selectedModifiers[group.id] || [];
      return selected.length >= group.min_selections;
    });
  };

  // Add to cart
  const handleAddToCart = () => {
    if (!isValid()) return;

    // Build cart item modifiers
    const cartModifiers: CartItemModifier[] = [];
    modifierGroups.forEach(group => {
      const selected = selectedModifiers[group.id] || [];
      selected.forEach(modId => {
        const modifier = group.modifiers.find(m => m.id === modId);
        if (modifier) {
          cartModifiers.push({
            modifier: {
              id: modifier.id,
              name: modifier.name,
              name_ar: modifier.name_ar,
              price: modifier.price,
              group_id: group.id,
              group_name: group.name,
            },
            quantity: 1,
          });
        }
      });
    });

    const modifiersTotal = cartModifiers.reduce((sum, mod) => sum + mod.modifier.price, 0);
    const totalPrice = (item.price + modifiersTotal) * quantity;

    addItem({
      menu_item_id: item.id,
      name: item.name,
      name_ar: item.name_ar,
      price: item.price,
      quantity,
      image: item.image,
      modifiers: cartModifiers,
      special_instructions: specialInstructions || undefined,
      total_price: totalPrice,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
        <div className="relative">
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={item.image}
              alt={displayName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[50vh] overflow-y-auto">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-muted-foreground text-sm mt-1">{displayDescription}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-bold text-primary">
                  {formatPrice(item.price)} {isRTL ? 'د.ك' : 'KWD'}
                </span>
                {item.calories && (
                  <Badge variant="outline" className="text-xs">
                    {item.calories} cal
                  </Badge>
                )}
              </div>
            </div>

            {/* Modifier Groups */}
            {modifierGroups.map((group) => (
              <div key={group.id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    {isRTL ? group.name_ar : group.name}
                  </h3>
                  <Badge variant={group.is_required ? "default" : "outline"} className="text-xs">
                    {group.is_required ? t.itemModal.required : t.itemModal.optional}
                    {group.max_selections > 1 && ` (max ${group.max_selections})`}
                  </Badge>
                </div>

                {group.max_selections === 1 ? (
                  // Radio group for single selection
                  <RadioGroup
                    value={(selectedModifiers[group.id] || [])[0] || ''}
                    onValueChange={(value) => handleModifierChange(group, value, true)}
                    className="space-y-2"
                  >
                    {group.modifiers.filter(m => m.is_available).map((modifier) => (
                      <Label
                        key={modifier.id}
                        htmlFor={modifier.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          (selectedModifiers[group.id] || []).includes(modifier.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={modifier.id} id={modifier.id} />
                          <span>{isRTL ? modifier.name_ar : modifier.name}</span>
                        </div>
                        {modifier.price > 0 && (
                          <span className="text-primary font-medium">
                            +{formatPrice(modifier.price)}
                          </span>
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                ) : (
                  // Checkboxes for multiple selection
                  <div className="space-y-2">
                    {group.modifiers.filter(m => m.is_available).map((modifier) => {
                      const isSelected = (selectedModifiers[group.id] || []).includes(modifier.id);
                      const isDisabled = !isSelected && 
                        (selectedModifiers[group.id] || []).length >= group.max_selections;
                      
                      return (
                        <Label
                          key={modifier.id}
                          htmlFor={modifier.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : isDisabled
                              ? 'border-border opacity-50 cursor-not-allowed'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={modifier.id}
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => 
                                handleModifierChange(group, modifier.id, checked as boolean)
                              }
                            />
                            <span>{isRTL ? modifier.name_ar : modifier.name}</span>
                          </div>
                          {modifier.price > 0 ? (
                            <span className="text-primary font-medium">
                              +{formatPrice(modifier.price)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {t.modifiers.free}
                            </span>
                          )}
                        </Label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Special Instructions */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">{t.itemModal.specialInstructions}</h3>
              <Textarea
                placeholder={t.itemModal.specialInstructionsPlaceholder}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-card">
            <div className="flex items-center justify-between mb-3">
              {/* Quantity selector */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-lg w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Total */}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t.itemModal.total}</p>
                <p className="text-xl font-bold text-primary">
                  {formatPrice(calculateTotal())} {isRTL ? 'د.ك' : 'KWD'}
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleAddToCart}
              disabled={!isValid() || !item.is_available}
            >
              <Plus className="h-5 w-5 mr-2" />
              {t.itemModal.addToCartBtn}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemDetailModal;
