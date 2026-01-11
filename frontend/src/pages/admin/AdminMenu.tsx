import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MoreHorizontal, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  status: string;
  sort_order: number;
  image_url?: string;
}

interface MenuItem {
  id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  base_price: number;
  image_url?: string;
  status: string;
  sort_order: number;
  is_popular?: boolean;
}

const AdminMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Dialog states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name_en: '',
    name_ar: '',
    status: 'active',
    sort_order: 0,
    image_url: '',
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
    is_popular: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('sort_order', { ascending: true });

      if (catError) throw catError;

      // Fetch items
      const { data: itemsData, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .order('sort_order', { ascending: true });

      if (itemError) throw itemError;

      setCategories(categoriesData || []);
      setItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  // Category CRUD
  const handleSaveCategory = async () => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({
            name_en: categoryForm.name_en,
            name_ar: categoryForm.name_ar,
            status: categoryForm.status,
            sort_order: categoryForm.sort_order,
            image_url: categoryForm.image_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            tenant_id: TENANT_ID,
            name_en: categoryForm.name_en,
            name_ar: categoryForm.name_ar,
            status: categoryForm.status,
            sort_order: categoryForm.sort_order || categories.length + 1,
            image_url: categoryForm.image_url || null,
          });

        if (error) throw error;
        toast.success('Category created');
      }

      setShowCategoryDialog(false);
      resetCategoryForm();
      fetchData();
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete category');
    }
  };

  // Item CRUD
  const handleSaveItem = async () => {
    try {
      if (!itemForm.category_id) {
        toast.error('Please select a category');
        return;
      }

      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update({
            category_id: itemForm.category_id,
            name_en: itemForm.name_en,
            name_ar: itemForm.name_ar,
            description_en: itemForm.description_en || null,
            description_ar: itemForm.description_ar || null,
            base_price: itemForm.base_price,
            image_url: itemForm.image_url || null,
            status: itemForm.status,
            sort_order: itemForm.sort_order,
            is_popular: itemForm.is_popular,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Item updated');
      } else {
        const { error } = await supabase
          .from('items')
          .insert({
            tenant_id: TENANT_ID,
            category_id: itemForm.category_id,
            name_en: itemForm.name_en,
            name_ar: itemForm.name_ar,
            description_en: itemForm.description_en || null,
            description_ar: itemForm.description_ar || null,
            base_price: itemForm.base_price,
            image_url: itemForm.image_url || null,
            status: itemForm.status,
            sort_order: itemForm.sort_order || items.length + 1,
            is_popular: itemForm.is_popular,
          });

        if (error) throw error;
        toast.success('Item created');
      }

      setShowItemDialog(false);
      resetItemForm();
      fetchData();
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error('Failed to save item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Item deleted');
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Failed to delete item');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name_en: '',
      name_ar: '',
      status: 'active',
      sort_order: 0,
      image_url: '',
    });
    setEditingCategory(null);
  };

  const resetItemForm = () => {
    setItemForm({
      category_id: '',
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      price: 0,
      image_url: '',
      status: 'active',
      sort_order: 0,
      is_popular: false,
    });
    setEditingItem(null);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name_en: category.name_en,
      name_ar: category.name_ar,
      status: category.status,
      sort_order: category.sort_order,
      image_url: category.image_url || '',
    });
    setShowCategoryDialog(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name_en: item.name_en,
      name_ar: item.name_ar,
      description_en: item.description_en || '',
      description_ar: item.description_ar || '',
      price: item.price,
      image_url: item.image_url || '',
      status: item.status,
      sort_order: item.sort_order,
      is_popular: item.is_popular || false,
    });
    setShowItemDialog(true);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.name_ar.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name_en || 'Unknown';
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
          <h1 className="text-2xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage your menu categories and items</p>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Menu Items ({items.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => { resetItemForm(); setShowItemDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                {item.image_url && (
                  <div className="h-32 bg-gray-100">
                    <img 
                      src={item.image_url} 
                      alt={item.name_en} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name_en}</h3>
                      <p className="text-sm text-muted-foreground">{item.name_ar}</p>
                      <p className="text-primary font-bold mt-1">{(item.price || 0).toFixed(3)} KWD</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{getCategoryName(item.category_id)}</Badge>
                        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                        {item.is_popular && <Badge className="bg-yellow-500">Popular</Badge>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditItem(item)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No items found
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetCategoryForm(); setShowCategoryDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name_en}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{category.name_en}</h3>
                        <p className="text-sm text-muted-foreground">{category.name_ar}</p>
                        <p className="text-xs text-muted-foreground">
                          {items.filter(i => i.category_id === category.id).length} items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                        {category.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditCategory(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input
                  value={categoryForm.name_en}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_en: e.target.value })}
                  placeholder="Category name"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={categoryForm.name_ar}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name_ar: e.target.value })}
                  placeholder="اسم الفئة"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={categoryForm.image_url}
                onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={categoryForm.status} 
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, status: value })}
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
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select 
                value={itemForm.category_id} 
                onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input
                  value={itemForm.name_en}
                  onChange={(e) => setItemForm({ ...itemForm, name_en: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={itemForm.name_ar}
                  onChange={(e) => setItemForm({ ...itemForm, name_ar: e.target.value })}
                  placeholder="اسم الصنف"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description (English)</Label>
                <Textarea
                  value={itemForm.description_en}
                  onChange={(e) => setItemForm({ ...itemForm, description_en: e.target.value })}
                  placeholder="Item description"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Description (Arabic)</Label>
                <Textarea
                  value={itemForm.description_ar}
                  onChange={(e) => setItemForm({ ...itemForm, description_ar: e.target.value })}
                  placeholder="وصف الصنف"
                  dir="rtl"
                  rows={2}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (KWD)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={itemForm.sort_order}
                  onChange={(e) => setItemForm({ ...itemForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={itemForm.image_url}
                onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={itemForm.status} 
                  onValueChange={(value) => setItemForm({ ...itemForm, status: value })}
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
              <div className="space-y-2 flex items-center gap-2 pt-7">
                <Switch
                  checked={itemForm.is_popular}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, is_popular: checked })}
                />
                <Label>Mark as Popular</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMenu;
