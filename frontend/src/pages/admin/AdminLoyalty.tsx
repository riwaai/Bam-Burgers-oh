import React, { useState, useEffect } from 'react';
import { Gift, Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Match the actual Supabase loyalty_settings table schema
interface LoyaltySettings {
  id?: string;
  tenant_id?: string;
  enabled: boolean;
  points_per_kwd: number;
  min_order_amount: number;
  earn_on_tax: boolean;
  earn_on_delivery_fee: boolean;
  redemption_rate: number;
  min_points_to_redeem: number;
  max_redemption_percent: number;
  points_expiry_days?: number;
  expiry_type: string;
  notes?: string;
}

const defaultSettings: LoyaltySettings = {
  enabled: true,
  points_per_kwd: 1,
  min_order_amount: 0,
  earn_on_tax: false,
  earn_on_delivery_fee: false,
  redemption_rate: 0.01,
  min_points_to_redeem: 0,
  max_redemption_percent: 100,
  points_expiry_days: undefined,
  expiry_type: 'rolling',
  notes: '',
};

const AdminLoyalty = () => {
  const [settings, setSettings] = useState<LoyaltySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          ...defaultSettings,
          ...data,
        });
      }
    } catch (err) {
      console.error('Error fetching loyalty settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsData = {
        enabled: settings.enabled,
        points_per_kwd: settings.points_per_kwd,
        min_order_amount: settings.min_order_amount,
        earn_on_tax: settings.earn_on_tax,
        earn_on_delivery_fee: settings.earn_on_delivery_fee,
        redemption_rate: settings.redemption_rate,
        min_points_to_redeem: settings.min_points_to_redeem,
        max_redemption_percent: settings.max_redemption_percent,
        points_expiry_days: settings.points_expiry_days || null,
        expiry_type: settings.expiry_type,
        notes: settings.notes || null,
        updated_at: new Date().toISOString(),
      };

      // Check if settings exist
      const { data: existing } = await supabase
        .from('loyalty_settings')
        .select('id')
        .eq('tenant_id', TENANT_ID)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('loyalty_settings')
          .update(settingsData)
          .eq('tenant_id', TENANT_ID);
        
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('loyalty_settings')
          .insert({
            tenant_id: TENANT_ID,
            ...settingsData,
          });
        
        if (error) throw error;
      }

      toast.success('Loyalty settings saved');
      fetchSettings();
    } catch (err: any) {
      console.error('Error saving loyalty settings:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-2xl font-bold">Loyalty Program</h1>
          <p className="text-muted-foreground">Configure your customer loyalty program</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Program Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Loyalty Program</p>
              <p className="text-sm text-muted-foreground">Allow customers to earn and redeem points</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Earning Points</CardTitle>
          <CardDescription>Configure how customers earn points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Points per 1 KWD spent</Label>
              <Input
                type="number"
                step="0.1"
                value={settings.points_per_kwd}
                onChange={(e) => setSettings({ ...settings, points_per_kwd: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Customer earns {settings.points_per_kwd} points for every 1 KWD spent
              </p>
            </div>
            <div className="space-y-2">
              <Label>Minimum Order Amount (KWD)</Label>
              <Input
                type="number"
                step="0.001"
                value={settings.min_order_amount}
                onChange={(e) => setSettings({ ...settings, min_order_amount: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Minimum order amount to earn points
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Earn on Tax</p>
                <p className="text-xs text-muted-foreground">Include tax amount in points calculation</p>
              </div>
              <Switch
                checked={settings.earn_on_tax}
                onCheckedChange={(checked) => setSettings({ ...settings, earn_on_tax: checked })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Earn on Delivery Fee</p>
                <p className="text-xs text-muted-foreground">Include delivery fee in points calculation</p>
              </div>
              <Switch
                checked={settings.earn_on_delivery_fee}
                onCheckedChange={(checked) => setSettings({ ...settings, earn_on_delivery_fee: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redeeming Points</CardTitle>
          <CardDescription>Configure how customers can redeem their points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Redemption Rate (KWD per point)</Label>
              <Input
                type="number"
                step="0.001"
                value={settings.redemption_rate}
                onChange={(e) => setSettings({ ...settings, redemption_rate: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(1 / (settings.redemption_rate || 0.01))} points = 1 KWD discount
              </p>
            </div>
            <div className="space-y-2">
              <Label>Minimum Points to Redeem</Label>
              <Input
                type="number"
                value={settings.min_points_to_redeem}
                onChange={(e) => setSettings({ ...settings, min_points_to_redeem: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Customers need at least {settings.min_points_to_redeem} points to redeem
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Max Redemption per Order (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.max_redemption_percent}
              onChange={(e) => setSettings({ ...settings, max_redemption_percent: parseFloat(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              Maximum percentage of order that can be paid with points
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points Expiry</CardTitle>
          <CardDescription>Configure when points expire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expiry Type</Label>
              <Select
                value={settings.expiry_type}
                onValueChange={(value) => setSettings({ ...settings, expiry_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rolling">Rolling (from last activity)</SelectItem>
                  <SelectItem value="fixed">Fixed date</SelectItem>
                  <SelectItem value="never">Never expire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Days</Label>
              <Input
                type="number"
                value={settings.points_expiry_days || ''}
                onChange={(e) => setSettings({ ...settings, points_expiry_days: parseInt(e.target.value) || undefined })}
                placeholder="No expiry"
                disabled={settings.expiry_type === 'never'}
              />
              <p className="text-xs text-muted-foreground">
                {settings.expiry_type === 'never' ? 'Points never expire' : 
                 settings.points_expiry_days ? `Points expire after ${settings.points_expiry_days} days` : 'Set expiry days'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">How the loyalty program works</p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Customers earn {settings.points_per_kwd} points for every 1 KWD spent</li>
                <li>• {Math.round(1 / (settings.redemption_rate || 0.01))} points can be redeemed for 1 KWD discount</li>
                <li>• Minimum {settings.min_points_to_redeem} points required to redeem</li>
                <li>• Maximum {settings.max_redemption_percent}% of order can be paid with points</li>
                {settings.points_expiry_days && (
                  <li>• Points expire after {settings.points_expiry_days} days</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoyalty;
