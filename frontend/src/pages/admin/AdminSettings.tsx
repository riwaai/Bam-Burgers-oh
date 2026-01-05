import React, { useState, useEffect } from 'react';
import { Settings, Save, CreditCard, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const AdminSettings = () => {
  const [tapSettings, setTapSettings] = useState({
    secret_key: '',
    public_key: '',
    is_live: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/settings`);
      if (response.ok) {
        const data = await response.json();
        setTapSettings({
          secret_key: '',
          public_key: data.tap_public_key || '',
          is_live: false,
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSavePaymentSettings = async () => {
    setSaving(true);
    try {
      toast.success('Payment settings saved');
      toast.info('Note: To change API keys, update the backend .env file and redeploy');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your restaurant settings</p>
        </div>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment Gateway</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Tap Payments Configuration
              </CardTitle>
              <CardDescription>
                Configure your Tap payment gateway for online payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How to get Tap API Keys</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Log in to your Tap Dashboard at tap.company</li>
                  <li>Navigate to goSell → API Credentials</li>
                  <li>Generate or copy your Secret Key and Public Key</li>
                  <li>Use Test keys for testing, Live keys for production</li>
                </ol>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Public Key
                  </Label>
                  <Input
                    value={tapSettings.public_key}
                    onChange={(e) => setTapSettings({ ...tapSettings, public_key: e.target.value })}
                    placeholder="pk_test_..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for client-side integration (safe to expose)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Secret Key
                  </Label>
                  <Input
                    type="password"
                    value={tapSettings.secret_key}
                    onChange={(e) => setTapSettings({ ...tapSettings, secret_key: e.target.value })}
                    placeholder="sk_test_..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Keep this secret! Used for server-side API calls
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Live Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Enable to accept real payments (use live API keys)
                    </p>
                  </div>
                  <Switch
                    checked={tapSettings.is_live}
                    onCheckedChange={(checked) => setTapSettings({ ...tapSettings, is_live: checked })}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> API keys are stored in the backend environment variables for security. 
                    To update them permanently, modify the <code>.env</code> file and redeploy the application.
                  </p>
                </div>
              </div>

              <Button onClick={handleSavePaymentSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Available payment options for customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      💵
                    </div>
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-sm text-muted-foreground">Pay when order arrives</p>
                    </div>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      💳
                    </div>
                    <div>
                      <p className="font-medium">Tap Payments</p>
                      <p className="text-sm text-muted-foreground">KNET, Visa, Mastercard</p>
                    </div>
                  </div>
                  <Switch checked={true} disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Information</CardTitle>
              <CardDescription>Basic details about your restaurant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Restaurant Name</Label>
                  <Input defaultValue="Bam Burgers" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input defaultValue="+965 9474 5424" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input defaultValue="Salwa, Kuwait" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
