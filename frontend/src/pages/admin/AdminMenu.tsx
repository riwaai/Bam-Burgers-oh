import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  status: string;
  sort_order: number;
}

interface MenuItem {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  base_price: number;
  image_url: string | null;
  status: string;
  sort_order: number;
}

const AdminMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [categoryForm, setCategoryForm] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    status: 'active',
    sort_order: 0,
  });

  const [itemForm, setItemForm] = useState({
    category_id: '',
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    base_price: 0,
    image_url: '',
    status: 'active',
    sort_order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        supabase.from('categories').select('*').eq('tenant_id', TENANT_ID).order('sort_order'),
        supabase.from('items').select('*').eq('tenant_id', TENANT_ID).order('sort_order'),
      ]);

      if (catRes.error) throw catRes.error;
      if (itemRes.error) throw itemRes.error;

      setCategories(catRes.data || []);
      setItems(itemRes.data || []);
    } catch (err) {
      console.error('Error fetching menu:', err);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  // Category handlers
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ ...categoryForm, updated_at: new Date().toISOString() })
          .eq('id', editingCategory.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert({
          ...categoryForm,
          tenant_id: TENANT_ID,
        });
        if (error) throw error;
        toast.success('Category created');
      }
      setShowCategoryDialog(false);
      setEditingCategory(null);
      resetCategoryForm();
      fetchData();
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Items in this category will not be deleted.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete category');
    }
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      description_en: cat.description_en || '',
      description_ar: cat.description_ar || '',
      status: cat.status,
      sort_order: cat.sort_order,
    });
    setShowCategoryDialog(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      status: 'active',
      sort_order: categories.length,
    });
  };

  // Item handlers
  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update({ ...itemForm, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Item updated');
      } else {
        const { error } = await supabase.from('items').insert({
          ...itemForm,
          tenant_id: TENANT_ID,
        });
        if (error) throw error;
        toast.success('Item created');
      }
      setShowItemDialog(false);
      setEditingItem(null);
      resetItemForm();
      fetchData();
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error('Failed to save item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
    }
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name_en: item.name_en,
      name_ar: item.name_ar,
      description_en: item.description_en || '',
      description_ar: item.description_ar || '',
      base_price: item.base_price,
      image_url: item.image_url || '',
      status: item.status,
      sort_order: item.sort_order,
    });
    setShowItemDialog(true);
  };

  const resetItemForm = () => {
    setItemForm({
      category_id: categories[0]?.id || '',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      base_price: 0,
      image_url: '',
      status: 'active',
      sort_order: items.length,
    });
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((item) => item.category_id === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Menu Management</h1>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { resetItemForm(); setShowItemDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name_en}
                      className="w-full h-32 object-cover rounded mb-3"
                    />
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name_en}</h3>
                      <p className="text-sm text-muted-foreground">{item.name_ar}</p>
                      <p className="text-lg font-bold text-primary mt-1">
                        {item.base_price.toFixed(3)} KWD
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetCategoryForm(); setShowCategoryDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{cat.name_en}</h3>
                      <p className="text-sm text-muted-foreground">{cat.name_ar}</p>
                      <p className="text-xs mt-1">
                        {items.filter((i) => i.category_id === cat.id).length} items
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditCategory(cat)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name (English)</Label>
                <Input
                  value={categoryForm.name_en}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                />
              </div>
              <div>
                <Label>Name (Arabic)</Label>
                <Input
                  value={categoryForm.name_ar}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={categoryForm.sort_order}
                onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={categoryForm.status === 'active'}
                onCheckedChange={(checked) =>
                  setCategoryForm({ ...categoryForm, status: checked ? 'active' : 'inactive' })
                }
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCategory}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <Label>Category</Label>
              <Select
                value={itemForm.category_id}
                onValueChange={(v) => setItemForm({ ...itemForm, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name (English)</Label>
                <Input
                  value={itemForm.name_en}
                  onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })}
                />
              </div>
              <div>
                <Label>Name (Arabic)</Label>
                <Input
                  value={itemForm.name_ar}
                  onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Description (English)</Label>
                <Textarea
                  value={itemForm.description_en}
                  onChange={(e) => setItemForm({ ...itemForm, description_en: e.target.value })}
                />
              </div>
              <div>
                <Label>Description (Arabic)</Label>
                <Textarea
                  value={itemForm.description_ar}
                  onChange={(e) => setItemForm({ ...itemForm, description_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={itemForm.base_price}
                  onChange={(e) => setItemForm({ ...itemForm, base_price: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={itemForm.sort_order}
                  onChange={(e) => setItemForm({ ...itemForm, sort_order: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={itemForm.image_url}
                onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={itemForm.status === 'active'}
                onCheckedChange={(checked) =>
                  setItemForm({ ...itemForm, status: checked ? 'active' : 'inactive' })
                }
              />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveItem}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenu;
