import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Save, Trash2, Edit2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Match the actual Supabase coupons table schema
interface Coupon {
  id: string;
  code: string;
  name_en?: string;
  name_ar?: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_basket: number;
  max_discount?: number;
  valid_from?: string;
  valid_to?: string;
  usage_limit?: number;
  per_customer_limit: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

const defaultCoupon: Partial<Coupon> = {
  code: '',
  name_en: '',
  name_ar: '',
  discount_type: 'percent',
  discount_value: 10,
  min_basket: 0,
  max_discount: undefined,
  usage_limit: undefined,
  per_customer_limit: 1,
  status: 'active',
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon>>(defaultCoupon);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

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
    if (!editingCoupon.code) {
      toast.error('Coupon code is required');
      return;
    }

    setSaving(true);
    try {
      const couponData = {
        code: editingCoupon.code.toUpperCase(),
        name_en: editingCoupon.name_en || null,
        name_ar: editingCoupon.name_ar || null,
        discount_type: editingCoupon.discount_type,
        discount_value: editingCoupon.discount_value,
        min_basket: editingCoupon.min_basket || 0,
        max_discount: editingCoupon.max_discount || null,
        usage_limit: editingCoupon.usage_limit || null,
        per_customer_limit: editingCoupon.per_customer_limit || 1,
        status: editingCoupon.status,
      };

      if (isEditing && editingCoupon.id) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        
        if (error) throw error;
        toast.success('Coupon updated');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert({
            tenant_id: TENANT_ID,
            ...couponData,
          });
        
        if (error) throw error;
        toast.success('Coupon created');
      }

      setShowDialog(false);
      setEditingCoupon(defaultCoupon);
      fetchCoupons();
    } catch (err: any) {
      console.error('Error saving coupon:', err);
      toast.error(err.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Delete this coupon?')) return;
    
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsEditing(true);
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingCoupon(defaultCoupon);
    setIsEditing(false);
    setShowDialog(true);
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <p className="text-muted-foreground">Manage discount coupons</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map((coupon) => (
          <Card key={coupon.id} className={`${coupon.status === 'inactive' ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  {coupon.code}
                </CardTitle>
                <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                  {coupon.status}
                </Badge>
              </div>
              {coupon.name_en && (
                <CardDescription>{coupon.name_en}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-primary">
                {coupon.discount_type === 'percent' 
                  ? `${coupon.discount_value}% OFF`
                  : `${coupon.discount_value.toFixed(3)} KWD OFF`
                }
              </div>
              
              {coupon.min_basket > 0 && (
                <p className="text-sm text-muted-foreground">
                  Min. order: {coupon.min_basket.toFixed(3)} KWD
                </p>
              )}
              
              {coupon.max_discount && (
                <p className="text-sm text-muted-foreground">
                  Max discount: {coupon.max_discount.toFixed(3)} KWD
                </p>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  {coupon.usage_limit ? `Limit: ${coupon.usage_limit}` : 'Unlimited'}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditDialog(coupon)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(coupon.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCoupons.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? 'No coupons match your search' : 'No coupons found. Create one to get started!'}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={editingCoupon.code || ''}
                onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input
                  value={editingCoupon.name_en || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, name_en: e.target.value })}
                  placeholder="Summer Sale"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={editingCoupon.name_ar || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, name_ar: e.target.value })}
                  placeholder="تخفيضات الصيف"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={editingCoupon.discount_type}
                  onValueChange={(value: 'percent' | 'fixed') => 
                    setEditingCoupon({ ...editingCoupon, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (KWD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={editingCoupon.discount_value || 0}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Basket (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={editingCoupon.min_basket || 0}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, min_basket: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Discount (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={editingCoupon.max_discount || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, max_discount: parseFloat(e.target.value) || undefined })}
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  value={editingCoupon.usage_limit || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, usage_limit: parseInt(e.target.value) || undefined })}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-2">
                <Label>Per Customer Limit</Label>
                <Input
                  type="number"
                  value={editingCoupon.per_customer_limit || 1}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, per_customer_limit: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={editingCoupon.status === 'active'}
                onCheckedChange={(checked) => setEditingCoupon({ ...editingCoupon, status: checked ? 'active' : 'inactive' })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
