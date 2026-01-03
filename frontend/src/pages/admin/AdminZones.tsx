import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeliveryZone {
  id: string;
  name: string;
  name_ar?: string;
  polygon?: any;
  delivery_fee: number;
  min_order_amount: number;
  estimated_time?: string;
  status: string;
}

const AdminZones = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    name_ar: '',
    delivery_fee: 0,
    min_order_amount: 0,
    estimated_time: '30-45 min',
    status: 'active',
  });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('name', { ascending: true });

      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error('Error fetching zones:', err);
      // Don't show error toast if table doesn't exist
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!form.name) {
        toast.error('Please enter a zone name');
        return;
      }

      const zoneData = {
        name: form.name,
        name_ar: form.name_ar || null,
        delivery_fee: form.delivery_fee,
        min_order_amount: form.min_order_amount,
        estimated_time: form.estimated_time || null,
        status: form.status,
      };

      if (editingZone) {
        const { error } = await supabase
          .from('delivery_zones')
          .update({ ...zoneData, updated_at: new Date().toISOString() })
          .eq('id', editingZone.id);

        if (error) throw error;
        toast.success('Zone updated');
      } else {
        const { error } = await supabase
          .from('delivery_zones')
          .insert({
            tenant_id: TENANT_ID,
            ...zoneData,
          });

        if (error) throw error;
        toast.success('Zone created');
      }

      setShowDialog(false);
      resetForm();
      fetchZones();
    } catch (err) {
      console.error('Error saving zone:', err);
      toast.error('Failed to save zone');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Zone deleted');
      fetchZones();
    } catch (err) {
      console.error('Error deleting zone:', err);
      toast.error('Failed to delete zone');
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      name_ar: '',
      delivery_fee: 0,
      min_order_amount: 0,
      estimated_time: '30-45 min',
      status: 'active',
    });
    setEditingZone(null);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      name_ar: zone.name_ar || '',
      delivery_fee: zone.delivery_fee || 0,
      min_order_amount: zone.min_order_amount || 0,
      estimated_time: zone.estimated_time || '30-45 min',
      status: zone.status,
    });
    setShowDialog(true);
  };

  // Generate random color for zone
  const getZoneColor = (index: number) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
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
          <h1 className="text-2xl font-bold">Delivery Zones</h1>
          <p className="text-muted-foreground">Manage delivery areas and fees</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Zone
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Delivery Zone Management</p>
              <p className="text-sm text-blue-800 mt-1">
                Configure delivery zones for your restaurant. Set delivery fees and minimum order amounts for each area.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zones List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone, index) => (
          <Card key={zone.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getZoneColor(index) }}
                  />
                  <div>
                    <h3 className="font-semibold">{zone.name}</h3>
                    {zone.name_ar && <p className="text-sm text-muted-foreground">{zone.name_ar}</p>}
                  </div>
                </div>
                <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                  {zone.status}
                </Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span className="font-medium">{(zone.delivery_fee || 0).toFixed(3)} KWD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Order:</span>
                  <span className="font-medium">{(zone.min_order_amount || 0).toFixed(3)} KWD</span>
                </div>
                {zone.estimated_time && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Time:</span>
                    <span className="font-medium">{zone.estimated_time}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(zone)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(zone.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {zones.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No delivery zones yet. Create your first zone!</p>
        </div>
      )}

      {/* Zone Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Zone' : 'Add Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zone Name (English)</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Salmiya"
                />
              </div>
              <div className="space-y-2">
                <Label>Zone Name (Arabic)</Label>
                <Input
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                  placeholder="السالمية"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delivery Fee (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.delivery_fee}
                  onChange={(e) => setForm({ ...form, delivery_fee: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Min Order (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estimated Time</Label>
                <Input
                  value={form.estimated_time}
                  onChange={(e) => setForm({ ...form, estimated_time: e.target.value })}
                  placeholder="e.g. 30-45 min"
                />
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

export default AdminZones;
