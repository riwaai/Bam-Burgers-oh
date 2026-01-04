import React, { useState, useEffect } from 'react';
import { Gift, Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface LoyaltySettings {
  id?: string;
  points_per_kwd: number;
  kwd_per_point: number;
  min_points_redeem: number;
  signup_bonus: number;
  referral_bonus: number;
  birthday_bonus: number;
  is_active: boolean;
}

const defaultSettings: LoyaltySettings = {
  points_per_kwd: 10,
  kwd_per_point: 0.01,
  min_points_redeem: 100,
  signup_bonus: 50,
  referral_bonus: 100,
  birthday_bonus: 200,
  is_active: true,
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
      const response = await fetch(`${BACKEND_URL}/api/loyalty/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
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
      const response = await fetch(`${BACKEND_URL}/api/loyalty/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points_per_kwd: settings.points_per_kwd,
          kwd_per_point: settings.kwd_per_point,
          min_points_redeem: settings.min_points_redeem,
          signup_bonus: settings.signup_bonus,
          referral_bonus: settings.referral_bonus,
          birthday_bonus: settings.birthday_bonus,
          is_active: settings.is_active,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('Loyalty settings saved');
      fetchSettings();
    } catch (err) {
      console.error('Error saving loyalty settings:', err);
      toast.error('Failed to save settings');
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

      {/* Program Status */}
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
              checked={settings.is_active}
              onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Points Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Points Configuration</CardTitle>
          <CardDescription>Set how customers earn and redeem points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Points per 1 KWD spent</Label>
              <Input
                type="number"
                value={settings.points_per_kwd}
                onChange={(e) => setSettings({ ...settings, points_per_kwd: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Customer earns {settings.points_per_kwd} points for every 1 KWD spent
              </p>
            </div>
            <div className="space-y-2">
              <Label>KWD value per point</Label>
              <Input
                type="number"
                step="0.001"
                value={settings.kwd_per_point}
                onChange={(e) => setSettings({ ...settings, kwd_per_point: parseFloat(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(1 / settings.kwd_per_point)} points = 1 KWD discount
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Minimum points to redeem</Label>
            <Input
              type="number"
              value={settings.min_points_redeem}
              onChange={(e) => setSettings({ ...settings, min_points_redeem: parseInt(e.target.value) || 0 })}
            />
            <p className="text-xs text-muted-foreground">
              Customers need at least {settings.min_points_redeem} points to redeem
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bonus Points */}
      <Card>
        <CardHeader>
          <CardTitle>Bonus Points</CardTitle>
          <CardDescription>Configure bonus points for special actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Sign-up Bonus</Label>
              <Input
                type="number"
                value={settings.signup_bonus}
                onChange={(e) => setSettings({ ...settings, signup_bonus: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Points for new customers</p>
            </div>
            <div className="space-y-2">
              <Label>Referral Bonus</Label>
              <Input
                type="number"
                value={settings.referral_bonus}
                onChange={(e) => setSettings({ ...settings, referral_bonus: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Points for successful referrals</p>
            </div>
            <div className="space-y-2">
              <Label>Birthday Bonus</Label>
              <Input
                type="number"
                value={settings.birthday_bonus}
                onChange={(e) => setSettings({ ...settings, birthday_bonus: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Points on customer's birthday</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">How the loyalty program works</p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Customers earn {settings.points_per_kwd} points for every 1 KWD spent</li>
                <li>• {Math.round(1 / settings.kwd_per_point)} points can be redeemed for 1 KWD discount</li>
                <li>• Minimum {settings.min_points_redeem} points required to redeem</li>
                <li>• New customers get {settings.signup_bonus} bonus points</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoyalty;
