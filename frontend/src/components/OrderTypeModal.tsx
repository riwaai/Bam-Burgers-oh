import React from "react";
import { Truck, Store, MapPin, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOrder, OrderType } from "@/contexts/OrderContext";

interface OrderTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OrderTypeModal = ({ isOpen, onClose }: OrderTypeModalProps) => {
  const { t, isRTL } = useLanguage();
  const { orderType, setOrderType, selectedBranch } = useOrder();

  const handleSelect = (type: OrderType) => {
    setOrderType(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {t.orderType.title}
          </DialogTitle>
        </DialogHeader>

        {/* Branch Info */}
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4">
          <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {isRTL ? selectedBranch?.name_ar : selectedBranch?.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isRTL ? selectedBranch?.address_ar : selectedBranch?.address}
            </p>
          </div>
        </div>

        {/* Order Type Options */}
        <div className="grid grid-cols-2 gap-4">
          {/* Delivery */}
          <button
            onClick={() => handleSelect('delivery')}
            className={`relative p-6 rounded-xl border-2 transition-all text-center ${
              orderType === 'delivery'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {orderType === 'delivery' && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <Truck className={`h-10 w-10 mx-auto mb-3 ${
              orderType === 'delivery' ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <h3 className="font-semibold text-lg">{t.orderType.delivery}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t.orderType.deliveryDesc}
            </p>
          </button>

          {/* Pickup */}
          <button
            onClick={() => handleSelect('pickup')}
            className={`relative p-6 rounded-xl border-2 transition-all text-center ${
              orderType === 'pickup'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {orderType === 'pickup' && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <Store className={`h-10 w-10 mx-auto mb-3 ${
              orderType === 'pickup' ? 'text-primary' : 'text-muted-foreground'
            }`} />
            <h3 className="font-semibold text-lg">{t.orderType.pickup}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t.orderType.pickupDesc}
            </p>
          </button>
        </div>

        <Button onClick={onClose} className="w-full mt-4">
          {t.orderType.continue}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTypeModal;
