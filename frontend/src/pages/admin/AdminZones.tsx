import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Save, Loader2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Circle, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DeliveryZone {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  delivery_fee: number;
  min_order_amount: number;
  estimated_time_minutes: number;
  is_active: boolean;
}

// Component to handle map clicks
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AdminZones = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);

  // Kuwait City center coordinates
  const kuwaitCenter = { lat: 29.3759, lng: 47.9774 };

  const [form, setForm] = useState({
    name: '',
    center_lat: kuwaitCenter.lat,
    center_lng: kuwaitCenter.lng,
    radius_km: 5,
    delivery_fee: 0.5,
    min_order_amount: 3,
    estimated_time_minutes: 30,
    is_active: true,
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
        .order('name');

      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error('Error fetching zones:', err);
      toast.error('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        const { error } = await supabase
          .from('delivery_zones')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Zone updated');
      } else {
        const { error } = await supabase.from('delivery_zones').insert({
          ...form,
          tenant_id: TENANT_ID,
        });
        if (error) throw error;
        toast.success('Zone created');
      }

      setShowDialog(false);
      setEditing(null);
      resetForm();
      fetchZones();
    } catch (err: any) {
      console.error('Error saving zone:', err);
      toast.error(err.message || 'Failed to save zone');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delivery zone?')) return;
    try {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
      if (error) throw error;
      toast.success('Zone deleted');
      fetchZones();
    } catch (err) {
      console.error('Error deleting zone:', err);
      toast.error('Failed to delete zone');
    }
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone);
    setForm({
      name: zone.name,
      center_lat: zone.center_lat,
      center_lng: zone.center_lng,
      radius_km: zone.radius_km,
      delivery_fee: zone.delivery_fee,
      min_order_amount: zone.min_order_amount,
      estimated_time_minutes: zone.estimated_time_minutes,
      is_active: zone.is_active,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      center_lat: kuwaitCenter.lat,
      center_lng: kuwaitCenter.lng,
      radius_km: 5,
      delivery_fee: 0.5,
      min_order_amount: 3,
      estimated_time_minutes: 30,
      is_active: true,
    });
  };

  const handleMapClick = (lat: number, lng: number) => {
    setForm({ ...form, center_lat: lat, center_lng: lng });
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
        <h1 className="text-2xl font-bold">Delivery Zones</h1>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Zone
        </Button>
      </div>

      {/* Map showing all zones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Coverage Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden">
            <MapContainer
              center={[kuwaitCenter.lat, kuwaitCenter.lng]}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {zones.map((zone) => (
                <Circle
                  key={zone.id}
                  center={[zone.center_lat, zone.center_lng]}
                  radius={zone.radius_km * 1000}
                  pathOptions={{
                    color: zone.is_active ? '#c31c1c' : '#999',
                    fillColor: zone.is_active ? '#c31c1c' : '#999',
                    fillOpacity: 0.2,
                  }}
                >
                  <Popup>
                    <strong>{zone.name}</strong><br />
                    Fee: {zone.delivery_fee.toFixed(3)} KWD<br />
                    Min Order: {zone.min_order_amount.toFixed(3)} KWD<br />
                    Time: {zone.estimated_time_minutes} mins
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Zones List */}
      {zones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No delivery zones defined yet. Add your first zone!
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <Card key={zone.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{zone.name}</CardTitle>
                  <Badge variant={zone.is_active ? 'default' : 'secondary'}>
                    {zone.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Delivery Fee:</span>
                    <p className="font-medium">{zone.delivery_fee.toFixed(3)} KWD</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Order:</span>
                    <p className="font-medium">{zone.min_order_amount.toFixed(3)} KWD</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Radius:</span>
                    <p className="font-medium">{zone.radius_km} km</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Time:</span>
                    <p className="font-medium">{zone.estimated_time_minutes} mins</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(zone)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(zone.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Zone Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Zone' : 'Add Delivery Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Zone Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Salmiya Area"
              />
            </div>

            {/* Map for selecting center */}
            <div>
              <Label>Zone Center (click on map to set)</Label>
              <div className="h-[250px] rounded-lg overflow-hidden mt-2">
                <MapContainer
                  center={[form.center_lat, form.center_lng]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  <Marker position={[form.center_lat, form.center_lng]} />
                  <Circle
                    center={[form.center_lat, form.center_lng]}
                    radius={form.radius_km * 1000}
                    pathOptions={{ color: '#c31c1c', fillColor: '#c31c1c', fillOpacity: 0.2 }}
                  />
                </MapContainer>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Center: {form.center_lat.toFixed(4)}, {form.center_lng.toFixed(4)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Radius (km)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={form.radius_km}
                  onChange={(e) => setForm({ ...form, radius_km: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Delivery Fee (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.delivery_fee}
                  onChange={(e) => setForm({ ...form, delivery_fee: parseFloat(e.target.value) })}
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
                <Label>Estimated Time (minutes)</Label>
                <Input
                  type="number"
                  value={form.estimated_time_minutes}
                  onChange={(e) => setForm({ ...form, estimated_time_minutes: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
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

export default AdminZones;
