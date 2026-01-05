import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Layers, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

interface ModifierGroup {
  id: string;
  name_en: string;
  name_ar: string;
  min_select: number;
  max_select: number;
  required: boolean;
  sort_order: number;
  status: string;
}

interface Modifier {
  id: string;
  modifier_group_id: string;
  name_en: string;
  name_ar: string;
  price: number;
  default_selected: boolean;
  sort_order: number;
  status: string;
}

const defaultGroup: ModifierGroup = {
  id: '',
  name_en: '',
  name_ar: '',
  min_select: 0,
  max_select: 1,
  required: false,
  sort_order: 0,
  status: 'active',
};

const defaultModifier: Modifier = {
  id: '',
  modifier_group_id: '',
  name_en: '',
  name_ar: '',
  price: 0,
  default_selected: false,
  sort_order: 0,
  status: 'active',
};

const AdminModifiers = () => {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup>(defaultGroup);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  
  const [showModifierDialog, setShowModifierDialog] = useState(false);
  const [editingModifier, setEditingModifier] = useState<Modifier>(defaultModifier);
  const [isEditingModifier, setIsEditingModifier] = useState(false);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchModifiers();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/modifier-groups`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Error fetching modifier groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModifiers = async (groupId?: string) => {
    try {
      const url = groupId 
        ? `${BACKEND_URL}/api/admin/modifiers?group_id=${groupId}`
        : `${BACKEND_URL}/api/admin/modifiers`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setModifiers(data);
      }
    } catch (err) {
      console.error('Error fetching modifiers:', err);
    }
  };

  const handleSaveGroup = async () => {
    if (!editingGroup.name_en) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    try {
      const method = isEditingGroup ? 'PATCH' : 'POST';
      const url = isEditingGroup 
        ? `${BACKEND_URL}/api/admin/modifier-groups/${editingGroup.id}`
        : `${BACKEND_URL}/api/admin/modifier-groups`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_en: editingGroup.name_en,
          name_ar: editingGroup.name_ar,
          min_select: editingGroup.min_select,
          max_select: editingGroup.max_select,
          required: editingGroup.required,
          sort_order: editingGroup.sort_order,
          status: editingGroup.status,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success(isEditingGroup ? 'Group updated' : 'Group created');
      setShowGroupDialog(false);
      setEditingGroup(defaultGroup);
      fetchGroups();
    } catch (err) {
      toast.error('Failed to save group');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Delete this modifier group? All modifiers in this group will also be deleted.')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/modifier-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Group deleted');
      fetchGroups();
      fetchModifiers();
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const handleSaveModifier = async () => {
    if (!editingModifier.name_en || !editingModifier.modifier_group_id) {
      toast.error('Name and group are required');
      return;
    }

    setSaving(true);
    try {
      const method = isEditingModifier ? 'PATCH' : 'POST';
      const url = isEditingModifier 
        ? `${BACKEND_URL}/api/admin/modifiers/${editingModifier.id}`
        : `${BACKEND_URL}/api/admin/modifiers`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modifier_group_id: editingModifier.modifier_group_id,
          name_en: editingModifier.name_en,
          name_ar: editingModifier.name_ar,
          price: editingModifier.price,
          default_selected: editingModifier.default_selected,
          sort_order: editingModifier.sort_order,
          status: editingModifier.status,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      toast.success(isEditingModifier ? 'Modifier updated' : 'Modifier created');
      setShowModifierDialog(false);
      setEditingModifier(defaultModifier);
      fetchModifiers();
    } catch (err) {
      toast.error('Failed to save modifier');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModifier = async (modifierId: string) => {
    if (!confirm('Delete this modifier?')) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/modifiers/${modifierId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Modifier deleted');
      fetchModifiers();
    } catch (err) {
      toast.error('Failed to delete modifier');
    }
  };

  const openEditGroupDialog = (group: ModifierGroup) => {
    setEditingGroup(group);
    setIsEditingGroup(true);
    setShowGroupDialog(true);
  };

  const openCreateGroupDialog = () => {
    setEditingGroup(defaultGroup);
    setIsEditingGroup(false);
    setShowGroupDialog(true);
  };

  const openEditModifierDialog = (modifier: Modifier) => {
    setEditingModifier(modifier);
    setIsEditingModifier(true);
    setShowModifierDialog(true);
  };

  const openCreateModifierDialog = (groupId?: string) => {
    setEditingModifier({ ...defaultModifier, modifier_group_id: groupId || '' });
    setIsEditingModifier(false);
    setShowModifierDialog(true);
  };

  const filteredModifiers = selectedGroup 
    ? modifiers.filter(m => m.modifier_group_id === selectedGroup)
    : modifiers;

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
          <h1 className="text-2xl font-bold">Modifiers Management</h1>
          <p className="text-muted-foreground">Manage customization options for menu items</p>
        </div>
      </div>

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Modifier Groups</TabsTrigger>
          <TabsTrigger value="modifiers">Modifiers</TabsTrigger>
        </TabsList>

        {/* Modifier Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateGroupDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Group
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      {group.name_en}
                    </CardTitle>
                    <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                      {group.status}
                    </Badge>
                  </div>
                  {group.name_ar && (
                    <p className="text-sm text-muted-foreground" dir="rtl">{group.name_ar}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p>Min select: {group.min_select} | Max select: {group.max_select}</p>
                    <p>Required: {group.required ? 'Yes' : 'No'}</p>
                    <p className="text-muted-foreground">
                      {modifiers.filter(m => m.modifier_group_id === group.id).length} modifiers
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => openEditGroupDialog(group)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openCreateModifierDialog(group.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No modifier groups found. Create one to start adding customization options.
            </div>
          )}
        </TabsContent>

        {/* Modifiers Tab */}
        <TabsContent value="modifiers" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Select value={selectedGroup || 'all'} onValueChange={(v) => setSelectedGroup(v === 'all' ? null : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>{group.name_en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={() => openCreateModifierDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Modifier
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredModifiers.map((modifier) => {
              const group = groups.find(g => g.id === modifier.modifier_group_id);
              return (
                <Card key={modifier.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{modifier.name_en}</p>
                        {modifier.name_ar && (
                          <p className="text-sm text-muted-foreground" dir="rtl">{modifier.name_ar}</p>
                        )}
                      </div>
                      <Badge variant={modifier.status === 'active' ? 'default' : 'secondary'}>
                        {modifier.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary font-bold flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {modifier.price.toFixed(3)} KWD
                      </span>
                      {modifier.default_selected && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Group: {group?.name_en || 'Unknown'}
                    </p>
                    
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="outline" onClick={() => openEditModifierDialog(modifier)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteModifier(modifier.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredModifiers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No modifiers found.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditingGroup ? 'Edit Modifier Group' : 'Create Modifier Group'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English) *</Label>
                <Input
                  value={editingGroup.name_en}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name_en: e.target.value })}
                  placeholder="e.g., Extra Toppings"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={editingGroup.name_ar}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name_ar: e.target.value })}
                  placeholder="إضافات"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Select</Label>
                <Input
                  type="number"
                  min="0"
                  value={editingGroup.min_select}
                  onChange={(e) => setEditingGroup({ ...editingGroup, min_select: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Select</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingGroup.max_select}
                  onChange={(e) => setEditingGroup({ ...editingGroup, max_select: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Required</Label>
              <Switch
                checked={editingGroup.required}
                onCheckedChange={(checked) => setEditingGroup({ ...editingGroup, required: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={editingGroup.status === 'active'}
                onCheckedChange={(checked) => setEditingGroup({ ...editingGroup, status: checked ? 'active' : 'inactive' })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveGroup} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier Dialog */}
      <Dialog open={showModifierDialog} onOpenChange={setShowModifierDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditingModifier ? 'Edit Modifier' : 'Create Modifier'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Modifier Group *</Label>
              <Select
                value={editingModifier.modifier_group_id}
                onValueChange={(v) => setEditingModifier({ ...editingModifier, modifier_group_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.name_en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name (English) *</Label>
                <Input
                  value={editingModifier.name_en}
                  onChange={(e) => setEditingModifier({ ...editingModifier, name_en: e.target.value })}
                  placeholder="e.g., Extra Cheese"
                />
              </div>
              <div className="space-y-2">
                <Label>Name (Arabic)</Label>
                <Input
                  value={editingModifier.name_ar}
                  onChange={(e) => setEditingModifier({ ...editingModifier, name_ar: e.target.value })}
                  placeholder="جبنة إضافية"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price (KWD)</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={editingModifier.price}
                onChange={(e) => setEditingModifier({ ...editingModifier, price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Default Selected</Label>
              <Switch
                checked={editingModifier.default_selected}
                onCheckedChange={(checked) => setEditingModifier({ ...editingModifier, default_selected: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={editingModifier.status === 'active'}
                onCheckedChange={(checked) => setEditingModifier({ ...editingModifier, status: checked ? 'active' : 'inactive' })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModifierDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveModifier} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModifiers;
