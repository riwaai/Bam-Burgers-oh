import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  times_used: number;
  expires_at: string | null;
  status: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: '',
    usage_limit: '',
    expires_at: '',
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
      const couponData = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount,
        max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        expires_at: form.expires_at || null,
        status: form.status,
      };

      if (editing) {
        const { error } = await supabase
          .from('coupons')
          .update({ ...couponData, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Coupon updated');
      } else {
        const { error } = await supabase.from('coupons').insert({
          ...couponData,
          tenant_id: TENANT_ID,
          times_used: 0,
        });
        if (error) throw error;
        toast.success('Coupon created');
      }

      setShowDialog(false);
      setEditing(null);
      resetForm();
      fetchCoupons();
    } catch (err: any) {
      console.error('Error saving coupon:', err);
      toast.error(err.message || 'Failed to save coupon');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      toast.error('Failed to delete coupon');
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      expires_at: coupon.expires_at?.split('T')[0] || '',
      status: coupon.status,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setForm({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: '',
      usage_limit: '',
      expires_at: '',
      status: 'active',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Coupon
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No coupons created yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                  <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                    {coupon.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-primary">
                  {coupon.discount_type === 'percentage'
                    ? `${coupon.discount_value}% OFF`
                    : `${coupon.discount_value.toFixed(3)} KWD OFF`}
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>Min order: {coupon.min_order_amount.toFixed(3)} KWD</p>
                  {coupon.max_discount_amount && (
                    <p>Max discount: {coupon.max_discount_amount.toFixed(3)} KWD</p>
                  )}
                  {coupon.usage_limit && (
                    <p>Uses: {coupon.times_used}/{coupon.usage_limit}</p>
                  )}
                  {coupon.expires_at && (
                    <p>Expires: {new Date(coupon.expires_at).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(coupon)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, discount_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (KWD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Order Amount (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Max Discount (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.max_discount_amount}
                  onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.status === 'active'}
                onCheckedChange={(checked) => setForm({ ...form, status: checked ? 'active' : 'inactive' })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
