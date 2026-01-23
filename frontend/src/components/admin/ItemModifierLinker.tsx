import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ModifierGroup {
  id: string;
  name_en: string;
  name_ar?: string;
}

interface ItemModifierLinkerProps {
  itemId: string;
  tenantId: string;
}

const ItemModifierLinker: React.FC<ItemModifierLinkerProps> = ({ itemId, tenantId }) => {
  const [allModifierGroups, setAllModifierGroups] = useState<ModifierGroup[]>([]);
  const [linkedGroupIds, setLinkedGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [itemId]);

  const fetchData = async () => {
    try {
      // Fetch all modifier groups
      const { data: groups, error: groupsError } = await supabase
        .from('modifier_groups')
        .select('id, name_en, name_ar')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('sort_order');
      
      if (groupsError) throw groupsError;
      setAllModifierGroups(groups || []);

      // Fetch currently linked groups for this item
      const { data: linked, error: linkedError } = await supabase
        .from('item_modifier_groups')
        .select('modifier_group_id')
        .eq('item_id', itemId);
      
      if (linkedError) throw linkedError;
      const linkedIds = new Set((linked || []).map(l => l.modifier_group_id));
      setLinkedGroupIds(linkedIds);
    } catch (err) {
      console.error('Error fetching modifier groups:', err);
      toast.error('Failed to load modifier groups');
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newLinked = new Set(linkedGroupIds);
    if (newLinked.has(groupId)) {
      newLinked.delete(groupId);
    } else {
      newLinked.add(groupId);
    }
    setLinkedGroupIds(newLinked);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing links
      const { error: deleteError } = await supabase
        .from('item_modifier_groups')
        .delete()
        .eq('item_id', itemId);
      
      if (deleteError) throw deleteError;

      // Insert new links
      if (linkedGroupIds.size > 0) {
        const linksToInsert = Array.from(linkedGroupIds).map((groupId, index) => ({
          item_id: itemId,
          modifier_group_id: groupId,
          sort_order: index,
        }));

        const { error: insertError } = await supabase
          .from('item_modifier_groups')
          .insert(linksToInsert);
        
        if (insertError) throw insertError;
      }

      toast.success('Modifier groups saved successfully');
    } catch (err: any) {
      console.error('Error saving modifier groups:', err);
      toast.error(err.message || 'Failed to save modifier groups');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link Modifier Groups</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select which modifier groups apply to this item
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {allModifierGroups.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No modifier groups available. Create modifier groups first.
          </p>
        ) : (
          <div className="space-y-3">
            {allModifierGroups.map((group) => (
              <div key={group.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={linkedGroupIds.has(group.id)}
                  onCheckedChange={() => toggleGroup(group.id)}
                />
                <Label htmlFor={`group-${group.id}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{group.name_en}</span>
                  {group.name_ar && (
                    <span className="text-sm text-muted-foreground ml-2">({group.name_ar})</span>
                  )}
                </Label>
                {linkedGroupIds.has(group.id) && (
                  <Check className="h-5 w-5 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Modifier Groups'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemModifierLinker;
