import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface CouponWithUsage {
  id: string;
  code: string;
  name_en: string;
  discount_type: string;
  discount_value: number;
  usage_limit: number | null;
  per_customer_limit: number;
  valid_from: string | null;
  valid_to: string | null;
  status: string;
  usage_count: number;
}

const AdminCouponUsage = () => {
  const [coupons, setCoupons] = useState<CouponWithUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCouponsWithUsage();
  }, []);

  const fetchCouponsWithUsage = async () => {
    try {
      // Fetch all coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });

      if (couponsError) throw couponsError;

      // Fetch usage count for each coupon
      const couponsWithUsage = await Promise.all(
        (couponsData || []).map(async (coupon) => {
          const { data: usageData, error: usageError } = await supabase
            .from('coupon_usage')
            .select('id')
            .eq('coupon_id', coupon.id);

          return {
            ...coupon,
            usage_count: usageData ? usageData.length : 0,
          };
        })
      );

      setCoupons(couponsWithUsage);
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (validTo: string | null) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  const isNotYetValid = (validFrom: string | null) => {
    if (!validFrom) return false;
    return new Date(validFrom) > new Date();
  };

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getRemainingUses = (used: number, limit: number | null) => {
    if (!limit) return 'Unlimited';
    const remaining = limit - used;
    return remaining > 0 ? remaining : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coupon Usage Report</h1>
        <p className="text-muted-foreground">Track coupon usage and remaining limits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Coupons</p>
                <p className="text-2xl font-bold">{coupons.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">
                  {coupons.filter(c => c.status === 'active' && !isExpired(c.valid_to)).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">
                  {coupons.filter(c => isExpired(c.valid_to)).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Limit Reached</p>
                <p className="text-2xl font-bold">
                  {coupons.filter(c => c.usage_limit && c.usage_count >= c.usage_limit).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {coupons.map((coupon) => {
          const expired = isExpired(coupon.valid_to);
          const notYetValid = isNotYetValid(coupon.valid_from);
          const limitReached = coupon.usage_limit && coupon.usage_count >= coupon.usage_limit;
          const usagePercent = getUsagePercentage(coupon.usage_count, coupon.usage_limit);

          return (
            <Card key={coupon.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{coupon.code}</h3>
                        {expired && <Badge variant="destructive">Expired</Badge>}
                        {notYetValid && <Badge variant="secondary">Not Yet Valid</Badge>}
                        {limitReached && <Badge variant="destructive">Limit Reached</Badge>}
                        {coupon.status === 'inactive' && <Badge variant="outline">Inactive</Badge>}
                        {coupon.status === 'active' && !expired && !notYetValid && !limitReached && (
                          <Badge className="bg-green-500">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{coupon.name_en}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {coupon.discount_type === 'percent' || coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}% off`
                          : `${coupon.discount_value} KWD off`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Times Used</p>
                      <p className="text-xl font-bold">{coupon.usage_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-xl font-bold">
                        {getRemainingUses(coupon.usage_count, coupon.usage_limit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Per Customer</p>
                      <p className="text-xl font-bold">{coupon.per_customer_limit}</p>
                    </div>
                  </div>

                  {coupon.usage_limit && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Usage Progress</span>
                        <span>{coupon.usage_count} / {coupon.usage_limit}</span>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                    </div>
                  )}

                  {(coupon.valid_from || coupon.valid_to) && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {coupon.valid_from && (
                        <div>
                          <span className="font-medium">Valid From:</span>{' '}
                          {new Date(coupon.valid_from).toLocaleDateString()}
                        </div>
                      )}
                      {coupon.valid_to && (
                        <div>
                          <span className="font-medium">Valid Until:</span>{' '}
                          {new Date(coupon.valid_to).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCouponUsage;
