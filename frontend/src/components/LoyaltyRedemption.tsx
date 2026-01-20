import React, { useState, useEffect } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoyaltyRedemptionProps {
  subtotal: number;
  onApplyPoints: (points: number, discount: number) => void;
  onRemovePoints: () => void;
  isRTL: boolean;
}

interface LoyaltySettings {
  enabled: boolean;
  points_per_kwd: number;
  redemption_rate: number;
  min_points_to_redeem: number;
  max_redemption_percent: number;
}

const LoyaltyRedemption: React.FC<LoyaltyRedemptionProps> = ({
  subtotal,
  onApplyPoints,
  onRemovePoints,
  isRTL
}) => {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  useEffect(() => {
    fetchLoyaltySettings();
  }, []);

  const fetchLoyaltySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single();
      
      if (data && !error) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching loyalty settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings?.enabled || !isAuthenticated || !customer) {
    return null;
  }

  const customerPoints = customer.loyalty_points || 0;
  const pointValue = settings.redemption_rate || 0.01;
  const minPointsToRedeem = settings.min_points_to_redeem || 0;
  const maxRedeemPercent = settings.max_redemption_percent || 100;

  // Maximum discount based on points and order total
  const maxDiscountFromPercent = (subtotal * maxRedeemPercent) / 100;
  const maxDiscountFromPoints = customerPoints * pointValue;
  const maxLoyaltyDiscount = Math.min(maxDiscountFromPercent, maxDiscountFromPoints);

  if (customerPoints < minPointsToRedeem) {
    return null;
  }

  const handleToggle = () => {
    if (usePoints) {
      // Removing points
      setUsePoints(false);
      setPointsToRedeem(0);
      onRemovePoints();
    } else {
      // Applying all points
      const points = customerPoints;
      const discount = Math.min(points * pointValue, maxLoyaltyDiscount);
      setUsePoints(true);
      setPointsToRedeem(points);
      onApplyPoints(points, discount);
      toast.success(isRTL ? `تم تطبيق ${points} نقطة` : `${points} points applied`);
    }
  };

  const handleSliderChange = (value: number) => {
    setPointsToRedeem(value);
    const discount = Math.min(value * pointValue, maxLoyaltyDiscount);
    onApplyPoints(value, discount);
  };

  const loyaltyDiscount = usePoints ? Math.min(pointsToRedeem * pointValue, maxLoyaltyDiscount) : 0;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Gift className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-700">
              {isRTL ? 'نقاط الولاء' : 'Loyalty Points'}
            </span>
          </div>
          <span className="font-bold text-orange-600">
            {customerPoints} {isRTL ? 'نقطة' : 'pts'}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
          onClick={handleToggle}
        >
          {usePoints
            ? (isRTL ? 'إزالة النقاط' : 'Remove Points')
            : (isRTL ? `استخدم نقاطك (خصم ${(customerPoints * pointValue).toFixed(3)} د.ك)` : `Use Your Points (${(customerPoints * pointValue).toFixed(3)} KWD off)`)}
        </Button>
        
        {usePoints && (
          <div className="mt-3 space-y-2">
            <input
              type="range"
              min={0}
              max={customerPoints}
              value={pointsToRedeem}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className={`flex justify-between text-xs text-orange-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span>0 pts</span>
              <span className="font-bold">{pointsToRedeem} pts = {loyaltyDiscount.toFixed(3)} KWD</span>
              <span>{customerPoints} pts</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyRedemption;
