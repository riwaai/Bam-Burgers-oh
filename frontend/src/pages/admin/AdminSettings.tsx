import React, { useState } from 'react';
import { Save, Store, Clock, Phone, MapPin, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { RESTAURANT_NAME, RESTAURANT_ADDRESS, RESTAURANT_PHONE } from '@/integrations/supabase/client';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // Restaurant Info
    name: RESTAURANT_NAME,
    name_ar: 'بام برجر',
    phone: RESTAURANT_PHONE,
    email: 'orders@bamburgers.com',
    address: RESTAURANT_ADDRESS,
    address_ar: 'مطبخ بارك سلوى - 834C+HH الرميثية، الكويت',
    
    // Operating Hours
    opening_time: '11:00',
    closing_time: '23:00',
    is_open: true,
    
    // Order Settings
    min_order_amount: 3.000,
    max_delivery_distance: 15,
    accept_online_orders: true,
    accept_pickup_orders: true,
    
    // Tax & Service
    tax_rate: 0,
    service_charge: 0,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // In a real implementation, this would save to the database
    setTimeout(() => {
      toast.success('Settings saved successfully');
      setSaving(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your restaurant settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Restaurant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Restaurant Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Restaurant Name (English)</Label>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Restaurant Name (Arabic)</Label>
              <Input
                value={settings.name_ar}
                onChange={(e) => setSettings({ ...settings, name_ar: e.target.value })}
                dir="rtl"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address (English)</Label>
            <Textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Address (Arabic)</Label>
            <Textarea
              value={settings.address_ar}
              onChange={(e) => setSettings({ ...settings, address_ar: e.target.value })}
              rows={2}
              dir="rtl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Restaurant Open</p>
              <p className="text-sm text-muted-foreground">Toggle to open/close the restaurant</p>
            </div>
            <Switch
              checked={settings.is_open}
              onCheckedChange={(checked) => setSettings({ ...settings, is_open: checked })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Opening Time</Label>
              <Input
                type="time"
                value={settings.opening_time}
                onChange={(e) => setSettings({ ...settings, opening_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Closing Time</Label>
              <Input
                type="time"
                value={settings.closing_time}
                onChange={(e) => setSettings({ ...settings, closing_time: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Order Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Accept Online Orders</p>
              <p className="text-sm text-muted-foreground">Allow customers to order through the website</p>
            </div>
            <Switch
              checked={settings.accept_online_orders}
              onCheckedChange={(checked) => setSettings({ ...settings, accept_online_orders: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Accept Pickup Orders</p>
              <p className="text-sm text-muted-foreground">Allow customers to place pickup orders</p>
            </div>
            <Switch
              checked={settings.accept_pickup_orders}
              onCheckedChange={(checked) => setSettings({ ...settings, accept_pickup_orders: checked })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum Order Amount (KWD)</Label>
              <Input
                type="number"
                step="0.001"
                value={settings.min_order_amount}
                onChange={(e) => setSettings({ ...settings, min_order_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Delivery Distance (km)</Label>
              <Input
                type="number"
                value={settings.max_delivery_distance}
                onChange={(e) => setSettings({ ...settings, max_delivery_distance: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax & Service */}
      <Card>
        <CardHeader>
          <CardTitle>Tax & Service Charges</CardTitle>
          <CardDescription>Configure tax and service charge rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.tax_rate}
                onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Charge (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.service_charge}
                onChange={(e) => setSettings({ ...settings, service_charge: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
