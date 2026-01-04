import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Save, Trash2, Edit2, X, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  max_uses?: number;
  uses_count: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

const defaultCoupon: Coupon = {
  id: '',
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: undefined,
  max_uses: undefined,
  uses_count: 0,
  status: 'active',
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon>(defaultCoupon);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/coupons`);
      if (response.ok) {
        const data = await response.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      // Use built-in coupons as fallback
      setCoupons([
        { id: 'b1', code: 'SAVE10', description: '10% off any order', discount_type: 'percentage', discount_value: 10, min_order_amount: 0, uses_count: 0, status: 'active' },
        { id: 'b2', code: 'SAVE20', description: '20% off orders above 3 KWD', discount_type: 'percentage', discount_value: 20, min_order_amount: 3, uses_count: 0, status: 'active' },
        { id: 'b3', code: 'FIRST50', description: '50% off up to 3 KWD', discount_type: 'percentage', discount_value: 50, min_order_amount: 5, max_discount_amount: 3, uses_count: 0, status: 'active' },
        { id: 'b4', code: 'FREE1', description: '1 KWD off', discount_type: 'fixed', discount_value: 1, min_order_amount: 5, uses_count: 0, status: 'active' },
      ]);
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
      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing 
        ? `${BACKEND_URL}/api/admin/coupons/${editingCoupon.id}`
        : `${BACKEND_URL}/api/admin/coupons`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editingCoupon.code,
          description: editingCoupon.description,
          discount_type: editingCoupon.discount_type,
          discount_value: editingCoupon.discount_value,
          min_order_amount: editingCoupon.min_order_amount,
          max_discount_amount: editingCoupon.max_discount_amount,
          max_uses: editingCoupon.max_uses,
          status: editingCoupon.status,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success(isEditing ? 'Coupon updated' : 'Coupon created');
      setShowDialog(false);
      setEditingCoupon(defaultCoupon);
      fetchCoupons();
    } catch (err) {
      toast.error('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Delete this coupon?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/coupons/${couponId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

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
    c.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Coupon Cards */}
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
              {coupon.description && (
                <CardDescription>{coupon.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-primary">
                {coupon.discount_type === 'percentage' 
                  ? `${coupon.discount_value}% OFF`
                  : `${coupon.discount_value.toFixed(3)} KWD OFF`
                }
              </div>
              
              {coupon.min_order_amount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Min. order: {coupon.min_order_amount.toFixed(3)} KWD
                </p>
              )}
              
              {coupon.max_discount_amount && (
                <p className="text-sm text-muted-foreground">
                  Max discount: {coupon.max_discount_amount.toFixed(3)} KWD
                </p>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Used: {coupon.uses_count || 0}{coupon.max_uses ? `/${coupon.max_uses}` : ''} times
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
          No coupons found
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={editingCoupon.code}
                onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editingCoupon.description || ''}
                onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                placeholder="e.g., 20% off summer sale"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={editingCoupon.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') => 
                    setEditingCoupon({ ...editingCoupon, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed (KWD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Discount Value</Label>
                <Input
                  type="number"
                  value={editingCoupon.discount_value}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, discount_value: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Order (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={editingCoupon.min_order_amount}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, min_order_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Discount (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={editingCoupon.max_discount_amount || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, max_discount_amount: parseFloat(e.target.value) || undefined })}
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                value={editingCoupon.max_uses || ''}
                onChange={(e) => setEditingCoupon({ ...editingCoupon, max_uses: parseInt(e.target.value) || undefined })}
                placeholder="Unlimited"
              />
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
