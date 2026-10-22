-- Migration: 20261022000001_milestone1_security_hardened.sql
-- Description: Hardened Milestone 1 schema for NESTIQ with Zero-Trust RLS,
--              atomic property creation, caller-restricted context retrieval,
--              automated updated_at triggers, and least-privilege function execution grants.

-- ====================================================================
-- 1. BASE TABLES
-- ====================================================================

-- 1.1 Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.2 User Roles Table (Global platform roles such as super_admin)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, role)
);

-- 1.3 PG Properties Table
CREATE TABLE IF NOT EXISTS public.pg_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    contact_phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.4 PG Memberships Table (Property-scoped roles: admin, tenant)
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

-- ====================================================================
-- 2. AUTOMATIC TIMESTAMP MAINTENANCE TRIGGERS
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_pg_properties_updated_at ON public.pg_properties;
CREATE TRIGGER tr_pg_properties_updated_at
    BEFORE UPDATE ON public.pg_properties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_pg_memberships_updated_at ON public.pg_memberships;
CREATE TRIGGER tr_pg_memberships_updated_at
    BEFORE UPDATE ON public.pg_memberships
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 3. SECURITY HELPER FUNCTIONS (Strict Search Paths)
-- ====================================================================

-- 3.1 Check if user has global super_admin role
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role = 'super_admin'
    );
$$;

-- 3.2 Check if user is an active admin of a specific property (or platform super_admin)
CREATE OR REPLACE FUNCTION public.is_property_admin(p_property_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.is_super_admin(p_user_id) OR EXISTS (
        SELECT 1 FROM public.pg_memberships
        WHERE user_id = p_user_id
          AND property_id = p_property_id
          AND role = 'admin'
          AND status = 'active'
    );
$$;

-- 3.3 Check if user is an active member (admin or tenant) of a property
CREATE OR REPLACE FUNCTION public.is_property_member(p_property_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.is_super_admin(p_user_id) OR EXISTS (
        SELECT 1 FROM public.pg_memberships
        WHERE user_id = p_user_id
          AND property_id = p_property_id
          AND status = 'active'
    );
$$;

-- ====================================================================
-- 4. HARDENED USER CONTEXT & ATOMIC OPERATIONS
-- ====================================================================

-- 4.1 Secure User Context Retrieval (Prevents cross-user disclosure)
CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_caller_id UUID;
    v_target_id UUID;
    v_is_super BOOLEAN;
    v_memberships JSONB;
    v_profile JSONB;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;

    v_target_id := COALESCE(p_user_id, v_caller_id);

    -- Strict authorization check: Only Super Admin can inspect another user
    IF v_target_id <> v_caller_id AND NOT public.is_super_admin(v_caller_id) THEN
        RAISE EXCEPTION 'Access denied: cannot inspect another user context' USING ERRCODE = '42501';
    END IF;

    SELECT public.is_super_admin(v_target_id) INTO v_is_super;

    SELECT to_jsonb(p) INTO v_profile
    FROM public.profiles p
    WHERE p.id = v_target_id;

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
    WHERE m.user_id = v_target_id AND m.status = 'active';

    RETURN jsonb_build_object(
        'user_id', v_target_id,
        'profile', COALESCE(v_profile, '{}'::jsonb),
        'is_super_admin', COALESCE(v_is_super, false),
        'memberships', COALESCE(v_memberships, '[]'::jsonb)
    );
END;
$$;

-- 4.2 Atomic Property Creation with Initial Admin Membership
CREATE OR REPLACE FUNCTION public.create_pg_property(
    p_name TEXT,
    p_address TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_pincode TEXT DEFAULT NULL,
    p_contact_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_property_id UUID;
    v_property_record RECORD;
    v_membership_record RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
    END IF;

    IF p_name IS NULL OR trim(p_name) = '' THEN
        RAISE EXCEPTION 'Property name is required' USING ERRCODE = '22023';
    END IF;

    -- 1. Insert property
    INSERT INTO public.pg_properties (
        name,
        address,
        city,
        state,
        pincode,
        contact_phone,
        created_by
    )
    VALUES (
        trim(p_name),
        nullif(trim(p_address), ''),
        nullif(trim(p_city), ''),
        nullif(trim(p_state), ''),
        nullif(trim(p_pincode), ''),
        nullif(trim(p_contact_phone), ''),
        v_user_id
    )
    RETURNING * INTO v_property_record;

    v_property_id := v_property_record.id;

    -- 2. Atomically grant creator the initial active admin membership
    INSERT INTO public.pg_memberships (
        user_id,
        property_id,
        role,
        status
    )
    VALUES (
        v_user_id,
        v_property_id,
        'admin',
        'active'
    )
    RETURNING * INTO v_membership_record;

    RETURN jsonb_build_object(
        'property', to_jsonb(v_property_record),
        'membership', jsonb_build_object(
            'id', v_membership_record.id,
            'user_id', v_membership_record.user_id,
            'property_id', v_membership_record.property_id,
            'role', v_membership_record.role,
            'status', v_membership_record.status,
            'property_name', v_property_record.name
        )
    );
END;
$$;

-- 4.3 Controlled Initial Super Admin Bootstrap (Run once only)
CREATE OR REPLACE FUNCTION public.bootstrap_initial_super_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only allow execution if ZERO super admins currently exist
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'super_admin') THEN
        RAISE EXCEPTION 'Super Admin already initialized. Use administrative management.' USING ERRCODE = '42501';
    END IF;

    -- Ensure target user exists in auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE EXCEPTION 'Target user not found in auth.users' USING ERRCODE = '02000';
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN true;
END;
$$;

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pg_memberships ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles Policies
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
          AND member_m.status = 'active'  -- Hardened: Only show active members of the same property
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

-- 5.2 User Roles Policies
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

-- 5.3 PG Properties Policies
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

-- 5.4 PG Memberships Policies
DROP POLICY IF EXISTS "memberships_select_policy" ON public.pg_memberships;
CREATE POLICY "memberships_select_policy" ON public.pg_memberships
FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_super_admin(auth.uid())
    OR public.is_property_admin(property_id, auth.uid())
);

-- Separate INSERT / UPDATE / DELETE to enforce role boundaries
DROP POLICY IF EXISTS "memberships_insert_policy" ON public.pg_memberships;
CREATE POLICY "memberships_insert_policy" ON public.pg_memberships
FOR INSERT WITH CHECK (
    -- Super Admin can assign any role
    public.is_super_admin(auth.uid())
    -- Property Admin can invite/assign tenants only
    OR (public.is_property_admin(property_id, auth.uid()) AND role = 'tenant')
    -- Property Creator can claim their initial admin membership
    OR (
        auth.uid() = user_id 
        AND role = 'admin' 
        AND EXISTS (
            SELECT 1 FROM public.pg_properties 
            WHERE id = property_id AND created_by = auth.uid()
        )
    )
);

DROP POLICY IF EXISTS "memberships_update_policy" ON public.pg_memberships;
CREATE POLICY "memberships_update_policy" ON public.pg_memberships
FOR UPDATE USING (
    public.is_super_admin(auth.uid())
    OR (public.is_property_admin(property_id, auth.uid()) AND role = 'tenant')
) WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (public.is_property_admin(property_id, auth.uid()) AND role = 'tenant')
);

DROP POLICY IF EXISTS "memberships_delete_policy" ON public.pg_memberships;
CREATE POLICY "memberships_delete_policy" ON public.pg_memberships
FOR DELETE USING (
    public.is_super_admin(auth.uid())
    OR (public.is_property_admin(property_id, auth.uid()) AND role = 'tenant')
);

-- ====================================================================
-- 6. AUTOMATIC PROFILE CREATION TRIGGER
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        preferred_language = EXCLUDED.preferred_language,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 7. LEAST PRIVILEGE FUNCTION GRANTS & PERMISSIONS
-- ====================================================================

-- Revoke default public execution
REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_property_admin(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_property_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_context(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_pg_property(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bootstrap_initial_super_admin(UUID) FROM PUBLIC, anon;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_property_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_property_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pg_property(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
-- bootstrap_initial_super_admin is restricted to service_role by default; authenticated execution only if explicit
GRANT EXECUTE ON FUNCTION public.bootstrap_initial_super_admin(UUID) TO service_role;
