import React, { useState, useEffect } from 'react';
import { Save, Loader2, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LoyaltyRule {
  id: string;
  points_per_kwd: number;
  redemption_rate: number; // KWD per point
  min_points_redeem: number;
  max_points_redeem: number | null;
  is_active: boolean;
}

const AdminLoyalty = () => {
  const [rule, setRule] = useState<LoyaltyRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    points_per_kwd: 1,
    redemption_rate: 0.01,
    min_points_redeem: 100,
    max_points_redeem: '',
    is_active: true,
  });

  useEffect(() => {
    fetchRule();
  }, []);

  const fetchRule = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rules')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setRule(data);
        setForm({
          points_per_kwd: data.points_per_kwd,
          redemption_rate: data.redemption_rate,
          min_points_redeem: data.min_points_redeem,
          max_points_redeem: data.max_points_redeem?.toString() || '',
          is_active: data.is_active,
        });
      }
    } catch (err) {
      console.error('Error fetching loyalty rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ruleData = {
        points_per_kwd: form.points_per_kwd,
        redemption_rate: form.redemption_rate,
        min_points_redeem: form.min_points_redeem,
        max_points_redeem: form.max_points_redeem ? parseInt(form.max_points_redeem) : null,
        is_active: form.is_active,
      };

      if (rule) {
        const { error } = await supabase
          .from('loyalty_rules')
          .update({ ...ruleData, updated_at: new Date().toISOString() })
          .eq('id', rule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('loyalty_rules').insert({
          ...ruleData,
          tenant_id: TENANT_ID,
        });
        if (error) throw error;
      }

      toast.success('Loyalty rules saved');
      fetchRule();
    } catch (err: any) {
      console.error('Error saving loyalty rules:', err);
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
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
      <h1 className="text-2xl font-bold">Loyalty Program</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Points Settings
            </CardTitle>
            <CardDescription>
              Configure how customers earn and redeem loyalty points
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Program Status</p>
                <p className="text-sm text-muted-foreground">Enable or disable loyalty program</p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>

            <div>
              <Label>Points per 1 KWD spent</Label>
              <Input
                type="number"
                value={form.points_per_kwd}
                onChange={(e) => setForm({ ...form, points_per_kwd: parseInt(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Customer earns {form.points_per_kwd} point(s) for every 1 KWD spent
              </p>
            </div>

            <div>
              <Label>Redemption Rate (KWD per point)</Label>
              <Input
                type="number"
                step="0.001"
                value={form.redemption_rate}
                onChange={(e) => setForm({ ...form, redemption_rate: parseFloat(e.target.value) })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Each point is worth {form.redemption_rate} KWD when redeemed
              </p>
            </div>

            <div>
              <Label>Minimum Points to Redeem</Label>
              <Input
                type="number"
                value={form.min_points_redeem}
                onChange={(e) => setForm({ ...form, min_points_redeem: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Maximum Points per Order</Label>
              <Input
                type="number"
                value={form.max_points_redeem}
                onChange={(e) => setForm({ ...form, max_points_redeem: e.target.value })}
                placeholder="No limit"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>How customers will see the loyalty program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Bam Rewards</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🎁</span>
                  <span>Earn {form.points_per_kwd} point for every 1 KWD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span>Redeem {form.min_points_redeem} points = {(form.min_points_redeem * form.redemption_rate).toFixed(3)} KWD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span>Min {form.min_points_redeem} points to redeem</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Example:</h4>
              <p className="text-sm text-muted-foreground">
                A customer spends <strong>10 KWD</strong> → Earns <strong>{10 * form.points_per_kwd} points</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                With <strong>{form.min_points_redeem} points</strong> → Gets <strong>{(form.min_points_redeem * form.redemption_rate).toFixed(3)} KWD</strong> discount
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoyalty;
