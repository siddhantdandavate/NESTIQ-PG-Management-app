import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Profile, PGMembership, UserRole, UserContextData } from '../../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isSuperAdmin: boolean;
  memberships: PGMembership[];
  activeRole: UserRole;
  activeProperty: PGMembership | null;
  isLoading: boolean;
  isConfigured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshContext: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  switchProperty: (propertyId: string) => void;
  // Local development / mock switch for testing UI when Supabase is not linked
  setDevRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [memberships, setMemberships] = useState<PGMembership[]>([]);
  const [activeRole, setActiveRole] = useState<UserRole>('none');
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile and memberships from Supabase
  const loadUserContext = useCallback(async (userId: string) => {
    try {
      setError(null);

      // Attempt 1: Call secure RPC function get_user_context
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_context', {
        p_user_id: userId,
      });

      if (!rpcError && rpcData) {
        const ctx = rpcData as UserContextData;
        setProfile(ctx.profile);
        setIsSuperAdmin(ctx.is_super_admin);
        const activeMemberships = (ctx.memberships || []).filter(m => m.status === 'active');
        setMemberships(activeMemberships);

        // Determine primary active role
        if (ctx.is_super_admin) {
          setActiveRole('super_admin');
        } else if (activeMemberships.some(m => m.role === 'admin')) {
          setActiveRole('admin');
          const adminM = activeMemberships.find(m => m.role === 'admin');
          setActivePropertyId(adminM?.property_id || null);
        } else if (activeMemberships.some(m => m.role === 'tenant')) {
          setActiveRole('tenant');
          const tenantM = activeMemberships.find(m => m.role === 'tenant');
          setActivePropertyId(tenantM?.property_id || null);
        } else {
          setActiveRole('none');
        }
        return;
      }

      // Attempt 2: Direct table queries with RLS
      const [profileRes, rolesRes, membershipsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('*').eq('user_id', userId),
        supabase.from('pg_memberships').select('*, pg_properties(name)').eq('user_id', userId).eq('status', 'active'),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data as Profile);
      }

      const isSuper = (rolesRes.data || []).some((r: { role: string }) => r.role === 'super_admin');
      setIsSuperAdmin(isSuper);

      const mappedMemberships: PGMembership[] = (membershipsRes.data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        property_id: m.property_id,
        role: m.role,
        status: m.status,
        created_at: m.created_at,
        updated_at: m.updated_at,
        property_name: m.pg_properties?.name || 'Assigned PG',
      }));
      setMemberships(mappedMemberships);

      if (isSuper) {
        setActiveRole('super_admin');
      } else if (mappedMemberships.some(m => m.role === 'admin')) {
        setActiveRole('admin');
        const adminM = mappedMemberships.find(m => m.role === 'admin');
        setActivePropertyId(adminM?.property_id || null);
      } else if (mappedMemberships.some(m => m.role === 'tenant')) {
        setActiveRole('tenant');
        const tenantM = mappedMemberships.find(m => m.role === 'tenant');
        setActivePropertyId(tenantM?.property_id || null);
      } else {
        setActiveRole('none');
      }
    } catch (err: any) {
      console.warn('Failed to load user context from Supabase:', err.message);
      setError(err.message || 'Failed to load user profile');
    }
  }, []);

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          setIsLoading(false);
          return;
        }

        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await loadUserContext(initialSession.user.id);
          }
        }
      } catch (err: any) {
        console.warn('Supabase auth initialization error:', err.message);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setIsLoading(true);
        await loadUserContext(newSession.user.id);
        setIsLoading(false);
      } else {
        setProfile(null);
        setIsSuperAdmin(false);
        setMemberships([]);
        setActiveRole('none');
        setActivePropertyId(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserContext]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      return { error: null };
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone?.trim() || null,
            preferred_language: 'en',
          },
        },
      });
      if (signUpError) throw signUpError;
      return { error: null };
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsSuperAdmin(false);
      setMemberships([]);
      setActiveRole('none');
      setActivePropertyId(null);
    } catch (err: any) {
      console.warn('Sign out error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContext = async () => {
    if (user) {
      await loadUserContext(user.id);
    }
  };

  const switchRole = (role: UserRole) => {
    if (role === 'super_admin' && !isSuperAdmin) {
      setError('Unauthorized role switch');
      return;
    }
    if (role === 'admin' && !memberships.some(m => m.role === 'admin') && !isSuperAdmin) {
      setError('No admin property assigned');
      return;
    }
    if (role === 'tenant' && !memberships.some(m => m.role === 'tenant') && !isSuperAdmin) {
      setError('No tenant property assigned');
      return;
    }
    setActiveRole(role);
  };

  const switchProperty = (propertyId: string) => {
    const valid = memberships.some(m => m.property_id === propertyId) || isSuperAdmin;
    if (valid) {
      setActivePropertyId(propertyId);
    }
  };

  // Development helper for testing role navigation before backend linking
  const setDevRole = (role: UserRole) => {
    setActiveRole(role);
    if (role === 'super_admin') {
      setIsSuperAdmin(true);
      setProfile({
        id: 'dev-super-admin',
        full_name: 'Super Admin (Demo)',
        phone: '+91 98765 43210',
        preferred_language: 'en',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else if (role === 'admin') {
      setProfile({
        id: 'dev-pg-admin',
        full_name: 'PG Admin (Demo)',
        phone: '+91 98765 43211',
        preferred_language: 'en',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setMemberships([
        {
          id: 'dev-mem-1',
          user_id: 'dev-pg-admin',
          property_id: 'prop-1',
          role: 'admin',
          status: 'active',
          property_name: 'Sunrise Luxury PG',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setActivePropertyId('prop-1');
    } else if (role === 'tenant') {
      setProfile({
        id: 'dev-tenant',
        full_name: 'Rahul Sharma (Demo)',
        phone: '+91 98765 43212',
        preferred_language: 'en',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setMemberships([
        {
          id: 'dev-mem-2',
          user_id: 'dev-tenant',
          property_id: 'prop-1',
          role: 'tenant',
          status: 'active',
          property_name: 'Sunrise Luxury PG',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setActivePropertyId('prop-1');
    } else {
      setProfile(null);
      setIsSuperAdmin(false);
      setMemberships([]);
      setActivePropertyId(null);
    }
  };

  const activeProperty = memberships.find(m => m.property_id === activePropertyId) || memberships[0] || null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isSuperAdmin,
        memberships,
        activeRole,
        activeProperty,
        isLoading,
        isConfigured: isSupabaseConfigured,
        error,
        signIn,
        signUp,
        signOut,
        refreshContext,
        switchRole,
        switchProperty,
        setDevRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
