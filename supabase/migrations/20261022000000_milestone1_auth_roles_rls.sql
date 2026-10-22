-- Migration: 20261022000000_milestone1_auth_roles_rls.sql
-- Description: Milestone 1 schema for NESTIQ
--   1. Profiles table linked to auth.users
--   2. User roles table (platform-level super_admin)
--   3. PG Properties table
--   4. PG Memberships table (property-scoped admin/tenant roles)
--   5. Security helper functions
--   6. Strict Row Level Security (RLS) policies
--   7. Automatic profile creation trigger on signup

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create user_roles table for platform-level roles (super_admin)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, role)
);

-- 3. Create pg_properties table
CREATE TABLE IF NOT EXISTS public.pg_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    contact_phone TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Create pg_memberships table (property-scoped roles: admin, tenant)
CREATE TABLE IF NOT EXISTS public.pg_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.pg_properties(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tenant')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, property_id, role)
);

-- 5. Helper Functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role = 'super_admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_property_admin(p_property_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_super_admin(p_user_id) OR EXISTS (
        SELECT 1 FROM public.pg_memberships
        WHERE user_id = p_user_id
          AND property_id = p_property_id
          AND role = 'admin'
          AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_property_member(p_property_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_super_admin(p_user_id) OR EXISTS (
        SELECT 1 FROM public.pg_memberships
        WHERE user_id = p_user_id
          AND property_id = p_property_id
          AND status = 'active'
    );
$$;

-- Function to get a user's primary role and property memberships
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_super BOOLEAN;
    v_memberships JSONB;
    v_profile JSONB;
BEGIN
    SELECT public.is_super_admin(p_user_id) INTO v_is_super;

    SELECT to_jsonb(p) INTO v_profile
    FROM public.profiles p
    WHERE p.id = p_user_id;

    SELECT jsonb_agg(
        jsonb_build_object(
            'membership_id', m.id,
            'property_id', m.property_id,
            'property_name', prop.name,
            'role', m.role,
            'status', m.status
        )
    )
    INTO v_memberships
    FROM public.pg_memberships m
    JOIN public.pg_properties prop ON prop.id = m.property_id
    WHERE m.user_id = p_user_id AND m.status = 'active';

    RETURN jsonb_build_object(
        'user_id', p_user_id,
        'profile', COALESCE(v_profile, '{}'::jsonb),
        'is_super_admin', COALESCE(v_is_super, false),
        'memberships', COALESCE(v_memberships, '[]'::jsonb)
    );
END;
$$;

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_memberships ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
    OR public.is_super_admin(auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.pg_memberships admin_m
        JOIN public.pg_memberships member_m ON admin_m.property_id = member_m.property_id
        WHERE admin_m.user_id = auth.uid()
          AND admin_m.role = 'admin'
          AND admin_m.status = 'active'
          AND member_m.user_id = profiles.id
    )
);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id
) WITH CHECK (
    auth.uid() = id
);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (
    auth.uid() = id
);

-- User Roles Policies
DROP POLICY IF EXISTS "user_roles_select_own_or_super" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_super" ON public.user_roles
FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_super_admin(auth.uid())
);

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
FOR ALL USING (
    public.is_super_admin(auth.uid())
) WITH CHECK (
    public.is_super_admin(auth.uid())
);

-- PG Properties Policies
DROP POLICY IF EXISTS "properties_select_policy" ON public.pg_properties;
CREATE POLICY "properties_select_policy" ON public.pg_properties
FOR SELECT USING (
    public.is_super_admin(auth.uid())
    OR public.is_property_member(id, auth.uid())
);

DROP POLICY IF EXISTS "properties_insert_policy" ON public.pg_properties;
CREATE POLICY "properties_insert_policy" ON public.pg_properties
FOR INSERT WITH CHECK (
    public.is_super_admin(auth.uid())
    OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "properties_update_policy" ON public.pg_properties;
CREATE POLICY "properties_update_policy" ON public.pg_properties
FOR UPDATE USING (
    public.is_property_admin(id, auth.uid())
) WITH CHECK (
    public.is_property_admin(id, auth.uid())
);

DROP POLICY IF EXISTS "properties_delete_policy" ON public.pg_properties;
CREATE POLICY "properties_delete_policy" ON public.pg_properties
FOR DELETE USING (
    public.is_super_admin(auth.uid())
);

-- PG Memberships Policies
DROP POLICY IF EXISTS "memberships_select_policy" ON public.pg_memberships;
CREATE POLICY "memberships_select_policy" ON public.pg_memberships
FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_super_admin(auth.uid())
    OR public.is_property_admin(property_id, auth.uid())
);

DROP POLICY IF EXISTS "memberships_manage_policy" ON public.pg_memberships;
CREATE POLICY "memberships_manage_policy" ON public.pg_memberships
FOR ALL USING (
    public.is_super_admin(auth.uid())
    OR public.is_property_admin(property_id, auth.uid())
) WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.is_property_admin(property_id, auth.uid())
);

-- 7. Trigger to automatically create profile on auth.users sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, preferred_language)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        new.raw_user_meta_data->>'phone',
        COALESCE(new.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        preferred_language = EXCLUDED.preferred_language,
        updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
