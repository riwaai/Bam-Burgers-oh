import { useState, useEffect } from 'react';
import { supabase, TENANT_ID } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types matching Supabase schema
export interface Category {
  id: string;
  tenant_id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  sort_order: number;
  status: string;
}

export interface MenuItem {
  id: string;
  tenant_id: string;
  category_id: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  base_price: number;
  calories: number | null;
  prep_time_minutes: number | null;
  sort_order: number;
  status: string;
  modifier_groups?: ModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  tenant_id: string;
  name_en: string;
  name_ar: string;
  min_select: number;
  max_select: number;
  required: boolean;
  sort_order: number;
  status: string;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  modifier_group_id: string;
  name_en: string;
  name_ar: string;
  price: number;
  default_selected: boolean;
  sort_order: number;
  status: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  delivery_fee: number;
  min_order_amount: number;
  status: string;
}

// Hook to fetch categories with realtime updates
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('status', 'active')
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setCategories(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();

    // Subscribe to realtime changes
    channel = supabase
      .channel('categories-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `tenant_id=eq.${TENANT_ID}` },
        () => { fetchCategories(); }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { categories, loading, error };
}

// Hook to fetch menu items with their modifier groups
export function useMenuItems(categoryId?: string) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function fetchItems() {
      try {
        let query = supabase
          .from('items')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('status', 'active')
          .order('sort_order', { ascending: true });

        if (categoryId && categoryId !== 'all') {
          query = query.eq('category_id', categoryId);
        }

        const { data: itemsData, error: itemsError } = await query;
        if (itemsError) throw itemsError;

        // Fetch modifier groups for all items
        const { data: itemModifierGroups, error: imgError } = await supabase
          .from('item_modifier_groups')
          .select('item_id, modifier_group_id')
          .in('item_id', (itemsData || []).map(i => i.id));

        if (imgError) throw imgError;

        // Fetch all modifier groups
        const { data: modifierGroupsData, error: mgError } = await supabase
          .from('modifier_groups')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('status', 'active');

        if (mgError) throw mgError;

        // Fetch all modifiers
        const { data: modifiersData, error: modError } = await supabase
          .from('modifiers')
          .select('*')
          .eq('status', 'active')
          .order('sort_order', { ascending: true });

        if (modError) throw modError;

        // Map modifier groups with their modifiers
        const groupsWithModifiers = (modifierGroupsData || []).map(group => ({
          ...group,
          modifiers: (modifiersData || []).filter(m => m.modifier_group_id === group.id)
        }));

        // Map items with their modifier groups
        const itemsWithModifiers = (itemsData || []).map(item => {
          const itemGroupIds = (itemModifierGroups || [])
            .filter(img => img.item_id === item.id)
            .map(img => img.modifier_group_id);
          
          const itemGroups = groupsWithModifiers.filter(g => itemGroupIds.includes(g.id));

          return {
            ...item,
            modifier_groups: itemGroups
          };
        });

        setItems(itemsWithModifiers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();

    // Subscribe to realtime changes
    channel = supabase
      .channel('items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `tenant_id=eq.${TENANT_ID}` },
        () => { fetchItems(); }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [categoryId]);

  return { items, loading, error };
}

// Hook to fetch popular items (first 4 items for homepage)
export function usePopularItems() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    async function fetchItems() {
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('status', 'active')
          .order('sort_order', { ascending: true })
          .limit(4);

        if (itemsError) throw itemsError;

        // Fetch modifier groups for these items
        const { data: itemModifierGroups, error: imgError } = await supabase
          .from('item_modifier_groups')
          .select('item_id, modifier_group_id')
          .in('item_id', (itemsData || []).map(i => i.id));

        if (imgError) throw imgError;

        // Fetch all modifier groups
        const { data: modifierGroupsData, error: mgError } = await supabase
          .from('modifier_groups')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('status', 'active');

        if (mgError) throw mgError;

        // Fetch all modifiers
        const { data: modifiersData, error: modError } = await supabase
          .from('modifiers')
          .select('*')
          .eq('status', 'active')
          .order('sort_order', { ascending: true });

        if (modError) throw modError;

        // Map modifier groups with their modifiers
        const groupsWithModifiers = (modifierGroupsData || []).map(group => ({
          ...group,
          modifiers: (modifiersData || []).filter(m => m.modifier_group_id === group.id)
        }));

        // Map items with their modifier groups
        const itemsWithModifiers = (itemsData || []).map(item => {
          const itemGroupIds = (itemModifierGroups || [])
            .filter(img => img.item_id === item.id)
            .map(img => img.modifier_group_id);
          
          const itemGroups = groupsWithModifiers.filter(g => itemGroupIds.includes(g.id));

          return {
            ...item,
            modifier_groups: itemGroups
          };
        });

        setItems(itemsWithModifiers);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchItems();

    channel = supabase
      .channel('popular-items-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `tenant_id=eq.${TENANT_ID}` },
        () => { fetchItems(); }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { items, loading, error };
}

// Hook to fetch a single item with its modifiers
export function useMenuItem(itemId: string | undefined) {
  const [item, setItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setLoading(false);
      return;
    }

    async function fetchItem() {
      try {
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .single();

        if (itemError) throw itemError;

        // Fetch modifier groups for this item
        const { data: itemModifierGroups, error: imgError } = await supabase
          .from('item_modifier_groups')
          .select('modifier_group_id')
          .eq('item_id', itemId);

        if (imgError) throw imgError;

        const groupIds = (itemModifierGroups || []).map(img => img.modifier_group_id);

        if (groupIds.length > 0) {
          // Fetch modifier groups
          const { data: modifierGroupsData, error: mgError } = await supabase
            .from('modifier_groups')
            .select('*')
            .in('id', groupIds)
            .eq('status', 'active');

          if (mgError) throw mgError;

          // Fetch modifiers for these groups
          const { data: modifiersData, error: modError } = await supabase
            .from('modifiers')
            .select('*')
            .in('modifier_group_id', groupIds)
            .eq('status', 'active')
            .order('sort_order', { ascending: true });

          if (modError) throw modError;

          // Map modifier groups with their modifiers
          const groupsWithModifiers = (modifierGroupsData || []).map(group => ({
            ...group,
            modifiers: (modifiersData || []).filter(m => m.modifier_group_id === group.id)
          }));

          setItem({
            ...itemData,
            modifier_groups: groupsWithModifiers
          });
        } else {
          setItem({
            ...itemData,
            modifier_groups: []
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [itemId]);

  return { item, loading, error };
}

// Hook to fetch branch info
export function useBranch() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBranch() {
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .eq('tenant_id', TENANT_ID)
          .eq('status', 'active')
          .single();

        if (error) throw error;
        setBranch(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBranch();
  }, []);

  return { branch, loading, error };
}

// Format price in KWD (3 decimal places)
export function formatPrice(price: number): string {
  return price.toFixed(3);
}
