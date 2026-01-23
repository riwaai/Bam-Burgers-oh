import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Variant {
  id: string;
  name_en: string;
  name_ar: string;
  price_adjustment: number;
  sku: string;
  sort_order: number;
  status: string;
}

interface ItemVariantsManagerProps {
  itemId: string;
  onUpdate: () => void;
}

const ItemVariantsManager: React.FC<ItemVariantsManagerProps> = ({ itemId, onUpdate }) => {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariant, setEditingVariant] = useState<Partial<Variant> | null>(null);

  useEffect(() => {
    fetchVariants();
  }, [itemId]);

  const fetchVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('item_variants')
        .select('*')
        .eq('item_id', itemId)
        .order('sort_order');
      
      if (error) throw error;
      setVariants(data || []);
    } catch (err) {
      console.error('Error fetching variants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingVariant || !editingVariant.name_en) {
      toast.error('Variant name is required');
      return;
    }

    try {
      const variantData = {
        item_id: itemId,
        name_en: editingVariant.name_en,
        name_ar: editingVariant.name_ar || '',
        price_adjustment: editingVariant.price_adjustment || 0,
        sku: editingVariant.sku || '',
        sort_order: editingVariant.sort_order || 0,
        status: editingVariant.status || 'active',
      };

      if (editingVariant.id) {
        const { error } = await supabase
          .from('item_variants')
          .update(variantData)
          .eq('id', editingVariant.id);
        
        if (error) throw error;
        toast.success('Variant updated');
      } else {
        const { error } = await supabase
          .from('item_variants')
          .insert([variantData]);
        
        if (error) throw error;
        toast.success('Variant created');
      }

      setEditingVariant(null);
      fetchVariants();
      onUpdate();
    } catch (err: any) {
      console.error('Error saving variant:', err);
      toast.error(err.message || 'Failed to save variant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this variant?')) return;

    try {
      const { error } = await supabase
        .from('item_variants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Variant deleted');
      fetchVariants();
      onUpdate();
    } catch (err: any) {
      console.error('Error deleting variant:', err);
      toast.error(err.message || 'Failed to delete variant');
    }
  };

  if (loading) return <div>Loading variants...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Item Variants</h3>
        <Button
          size="sm"
          onClick={() => setEditingVariant({ name_en: '', name_ar: '', price_adjustment: 0, sku: '', sort_order: variants.length, status: 'active' })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Variant
        </Button>
      </div>

      {/* Existing Variants */}
      <div className="space-y-2">
        {variants.map((variant) => (
          <Card key={variant.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{variant.name_en}</p>
                  <p className="text-sm text-muted-foreground">
                    {variant.price_adjustment >= 0 ? '+' : ''}{variant.price_adjustment.toFixed(3)} KWD
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingVariant(variant)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(variant.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      {editingVariant && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingVariant.id ? 'Edit' : 'Add'} Variant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English)*</Label>
                <Input
                  value={editingVariant.name_en || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, name_en: e.target.value })}
                  placeholder="e.g., Small, Medium, Large"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={editingVariant.name_ar || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, name_ar: e.target.value })}
                  placeholder="صغير، متوسط، كبير"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Adjustment (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={editingVariant.price_adjustment || 0}
                  onChange={(e) => setEditingVariant({ ...editingVariant, price_adjustment: parseFloat(e.target.value) })}
                  placeholder="0.000"
                />
                <p className="text-xs text-muted-foreground">Use negative for discount, positive for extra charge</p>
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={editingVariant.sku || ''}
                  onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingVariant(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItemVariantsManager;
