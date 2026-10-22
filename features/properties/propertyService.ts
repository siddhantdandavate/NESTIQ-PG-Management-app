import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { PGProperty, PGMembership } from '../../types/database';

const DEV_PROPERTIES_KEY = '@nestiq_dev_properties';
const DEV_MEMBERSHIPS_KEY = '@nestiq_dev_memberships';

// Default initial demo property for local/unlinked development
const DEFAULT_DEV_PROPERTY: PGProperty = {
  id: 'prop-1',
  name: 'Sunrise Luxury PG',
  address: '124, 4th Cross, Electronic City Phase 1',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560100',
  contact_phone: '+91 98765 43210',
  is_active: true,
  created_by: 'dev-pg-admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const propertyService = {
  /**
   * Fetch all properties where the user has an active membership or platform admin access
   */
  async fetchUserProperties(userId: string): Promise<PGProperty[]> {
    if (!isSupabaseConfigured) {
      try {
        const stored = await AsyncStorage.getItem(DEV_PROPERTIES_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
        await AsyncStorage.setItem(DEV_PROPERTIES_KEY, JSON.stringify([DEFAULT_DEV_PROPERTY]));
        return [DEFAULT_DEV_PROPERTY];
      } catch {
        return [DEFAULT_DEV_PROPERTY];
      }
    }

    try {
      const { data, error } = await supabase
        .from('pg_properties')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as PGProperty[];
    } catch (err: any) {
      console.warn('Supabase fetch properties error:', err.message);
      // In live Supabase mode, do NOT inject mock dev properties
      return [];
    }
  },

  /**
   * Create a new PG Property and establish the creator as property Admin atomically
   */
  async createProperty(
    propertyData: {
      name: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      contact_phone?: string;
    },
    userId: string
  ): Promise<{ property: PGProperty; membership: PGMembership }> {
    if (!propertyData.name.trim()) {
      throw new Error('Property name is required');
    }

    if (!isSupabaseConfigured) {
      const newProp: PGProperty = {
        id: `prop-${Date.now()}`,
        name: propertyData.name.trim(),
        address: propertyData.address?.trim() || null,
        city: propertyData.city?.trim() || 'Bengaluru',
        state: propertyData.state?.trim() || 'Karnataka',
        pincode: propertyData.pincode?.trim() || null,
        contact_phone: propertyData.contact_phone?.trim() || null,
        is_active: true,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newMembership: PGMembership = {
        id: `mem-${Date.now()}`,
        user_id: userId,
        property_id: newProp.id,
        role: 'admin',
        status: 'active',
        property_name: newProp.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const storedProps = await AsyncStorage.getItem(DEV_PROPERTIES_KEY);
        const list: PGProperty[] = storedProps ? JSON.parse(storedProps) : [DEFAULT_DEV_PROPERTY];
        list.push(newProp);
        await AsyncStorage.setItem(DEV_PROPERTIES_KEY, JSON.stringify(list));
      } catch (e) {
        console.warn('Dev property storage error:', e);
      }

      return { property: newProp, membership: newMembership };
    }

    // 1. Attempt atomic creation via hardened RPC create_pg_property
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_pg_property', {
        p_name: propertyData.name.trim(),
        p_address: propertyData.address?.trim() || null,
        p_city: propertyData.city?.trim() || null,
        p_state: propertyData.state?.trim() || null,
        p_pincode: propertyData.pincode?.trim() || null,
        p_contact_phone: propertyData.contact_phone?.trim() || null,
      });

      if (!rpcError && rpcData) {
        const result = rpcData as { property: PGProperty; membership: PGMembership };
        return {
          property: result.property,
          membership: result.membership,
        };
      }
      if (rpcError) {
        console.warn('RPC create_pg_property failed, trying direct insert fallback:', rpcError.message);
      }
    } catch (rpcEx: any) {
      console.warn('create_pg_property RPC error, proceeding to fallback:', rpcEx.message);
    }

    // 2. Fallback to direct table operations for backwards compatibility
    const { data: propData, error: propError } = await supabase
      .from('pg_properties')
      .insert({
        name: propertyData.name.trim(),
        address: propertyData.address?.trim() || null,
        city: propertyData.city?.trim() || null,
        state: propertyData.state?.trim() || null,
        pincode: propertyData.pincode?.trim() || null,
        contact_phone: propertyData.contact_phone?.trim() || null,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (propError) throw propError;

    const { data: memData, error: memError } = await supabase
      .from('pg_memberships')
      .insert({
        user_id: userId,
        property_id: propData.id,
        role: 'admin',
        status: 'active',
      })
      .select()
      .single();

    if (memError) throw memError;

    return {
      property: propData as PGProperty,
      membership: {
        ...(memData as PGMembership),
        property_name: propData.name,
      },
    };
  },

  /**
   * Update property details
   */
  async updateProperty(
    propertyId: string,
    updates: Partial<PGProperty>
  ): Promise<PGProperty> {
    if (!isSupabaseConfigured) {
      const stored = await AsyncStorage.getItem(DEV_PROPERTIES_KEY);
      let list: PGProperty[] = stored ? JSON.parse(stored) : [DEFAULT_DEV_PROPERTY];
      list = list.map(p => (p.id === propertyId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
      await AsyncStorage.setItem(DEV_PROPERTIES_KEY, JSON.stringify(list));
      return list.find(p => p.id === propertyId)!;
    }

    const { data, error } = await supabase
      .from('pg_properties')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId)
      .select()
      .single();

    if (error) throw error;
    return data as PGProperty;
  },
};
