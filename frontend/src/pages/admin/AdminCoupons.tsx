import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Percent, DollarSign, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  valid_from?: string;
  valid_until?: string;
  status: string;
  created_at: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    valid_from: '',
    valid_until: '',
    status: 'active',
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!form.code) {
        toast.error('Please enter a coupon code');
        return;
      }

      const couponData = {
        code: form.code.toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount || 0,
        max_discount_amount: form.max_discount_amount || null,
        usage_limit: form.usage_limit || null,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        status: form.status,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update({ ...couponData, updated_at: new Date().toISOString() })
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert({
            tenant_id: TENANT_ID,
            ...couponData,
            used_count: 0,
          });

        if (error) throw error;
        toast.success('Coupon created');
      }

      setShowDialog(false);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      console.error('Error saving coupon:', err);
      if (err.message?.includes('duplicate')) {
        toast.error('Coupon code already exists');
      } else {
        toast.error('Failed to save coupon');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Failed to delete coupon');
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_amount: 0,
      max_discount_amount: 0,
      usage_limit: 0,
      valid_from: '',
      valid_until: '',
      status: 'active',
    });
    setEditingCoupon(null);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount || 0,
      usage_limit: coupon.usage_limit || 0,
      valid_from: coupon.valid_from?.split('T')[0] || '',
      valid_until: coupon.valid_until?.split('T')[0] || '',
      status: coupon.status,
    });
    setShowDialog(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied!');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-GB');
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.valid_until) return false;
    return new Date(coupon.valid_until) < new Date();
  };

  const isUsedUp = (coupon: Coupon) => {
    if (!coupon.usage_limit) return false;
    return coupon.used_count >= coupon.usage_limit;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotions</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Coupons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {coupons.filter(c => c.status === 'active' && !isExpired(c) && !isUsedUp(c)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {coupons.reduce((sum, c) => sum + (c.used_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(coupon => {
          const expired = isExpired(coupon);
          const usedUp = isUsedUp(coupon);
          const inactive = coupon.status !== 'active' || expired || usedUp;

          return (
            <Card key={coupon.id} className={inactive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      coupon.discount_type === 'percentage' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {coupon.discount_type === 'percentage' ? (
                        <Percent className="h-6 w-6 text-blue-600" />
                      ) : (
                        <DollarSign className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{coupon.code}</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-primary font-semibold">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}% OFF`
                          : `${coupon.discount_value.toFixed(3)} KWD OFF`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {coupon.description && (
                  <p className="text-sm text-muted-foreground mt-3">{coupon.description}</p>
                )}

                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {coupon.min_order_amount > 0 && (
                    <p>Min order: {coupon.min_order_amount.toFixed(3)} KWD</p>
                  )}
                  {coupon.max_discount_amount && (
                    <p>Max discount: {coupon.max_discount_amount.toFixed(3)} KWD</p>
                  )}
                  <p>Valid: {formatDate(coupon.valid_from)} - {formatDate(coupon.valid_until)}</p>
                  <p>Used: {coupon.used_count || 0} / {coupon.usage_limit || '∞'}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex gap-2">
                    <Badge variant={coupon.status === 'active' && !expired && !usedUp ? 'default' : 'secondary'}>
                      {expired ? 'Expired' : usedUp ? 'Used Up' : coupon.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {coupons.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No coupons yet. Create your first coupon!</p>
        </div>
      )}

      {/* Coupon Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SAVE20"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. 20% off on orders above 5 KWD"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select 
                  value={form.discount_type} 
                  onValueChange={(value: 'percentage' | 'fixed') => setForm({ ...form, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value {form.discount_type === 'percentage' ? '(%)' : '(KWD)'}</Label>
                <Input
                  type="number"
                  step={form.discount_type === 'percentage' ? '1' : '0.001'}
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Order (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Discount (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.max_discount_amount}
                  onChange={(e) => setForm({ ...form, max_discount_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="No limit"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Usage Limit</Label>
              <Input
                type="number"
                value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) || 0 })}
                placeholder="Unlimited"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid Until</Label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={form.status} 
                onValueChange={(value) => setForm({ ...form, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
