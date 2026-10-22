# NESTIQ — Database Migration Security Review & Hardening Report

**Document Version:** 1.0.0  
**Target Migration:** `supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql`  
**Hardened Migration Proposal:** `supabase/migrations/20261022000001_milestone1_security_hardened.sql`  
**Review Date:** 2026-10-22  
**Status:** Awaiting Approval (Read-only review; no database modifications performed)

---

## 1. Executive Summary

A comprehensive, zero-trust security audit of the initial Milestone 1 database migration was performed. The original migration establishes a strong foundation by enabling Row Level Security (RLS) on all four core tables (`profiles`, `user_roles`, `pg_properties`, `pg_memberships`) and integrating with `auth.users`. 

However, eight (8) specific security, authorization, and data-integrity vulnerabilities were identified that would introduce cross-user information leakage, an authorization deadlock during property creation, or privilege escalation risks if applied unmodified to a live Supabase production database.

A hardened, drop-in replacement migration has been drafted in a separate file:  
[`supabase/migrations/20261022000001_milestone1_security_hardened.sql`](file:///e:/pg%20app/supabase/migrations/20261022000001_milestone1_security_hardened.sql).

---

## 2. Detailed Findings & Proposed Remediation

### Finding 1: Cross-User Information Disclosure via `get_user_context()` (Critical)
- **Severity:** 🔴 Critical
- **Evidence:**
  ```sql
  CREATE OR REPLACE FUNCTION public.get_user_context(p_user_id UUID DEFAULT auth.uid())
  RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
  ...
  SELECT to_jsonb(p) INTO v_profile FROM public.profiles p WHERE p.id = p_user_id;
  ...
  SELECT jsonb_agg(...) INTO v_memberships FROM public.pg_memberships m ... WHERE m.user_id = p_user_id;
  ```
- **Vulnerability:**
  Because the function runs with `SECURITY DEFINER` (database owner privileges) and accepts any caller-supplied `p_user_id`, any authenticated user could invoke `supabase.rpc('get_user_context', { p_user_id: '<victim_uuid>' })` to bypass RLS and retrieve another user's full name, phone number, language preference, super admin status, and all active property memberships/names.
- **Remediation:**
  Enforce caller identity verification inside the function body. If `p_user_id <> auth.uid()`, strictly require `public.is_super_admin(auth.uid()) = true`, otherwise throw an `Access Denied` exception. Revoke `EXECUTE` from `PUBLIC` and `anon`.

---

### Finding 2: Property Creation Authorization Deadlock & Orphaned Properties (High)
- **Severity:** 🟠 High
- **Evidence:**
  In `pg_properties`, the INSERT policy allows: `auth.uid() = created_by`.  
  In `pg_memberships`, the INSERT policy allows: `public.is_super_admin(auth.uid()) OR public.is_property_admin(property_id, auth.uid())`.
- **Vulnerability:**
  When a user creates a new property, no membership row exists yet for `(auth.uid(), property_id)`. Therefore, `is_property_admin(property_id, auth.uid())` returns `false`. When the client attempts to insert their admin membership in a subsequent step, PostgreSQL RLS **rejects** the insert! This creates an authorization deadlock, leaving the new property orphaned without an active admin membership.
- **Remediation:**
  Provide an atomic, secure stored procedure `public.create_pg_property(...)` running with `SECURITY DEFINER`. It inserts into `pg_properties` and immediately provisions the creator's `admin` membership in `pg_memberships` inside a single atomic transaction. Also update the RLS INSERT policy on `pg_memberships` to allow creators to claim their initial admin membership.

---

### Finding 3: Absence of a Secure First Super Admin Bootstrap Mechanism (High)
- **Severity:** 🟠 High
- **Evidence:**
  `user_roles` policy allows INSERT only if `public.is_super_admin(auth.uid()) = true`.
- **Vulnerability:**
  In a fresh database, zero `super_admin` rows exist. As a result, no Super Admin can ever be appointed via standard client APIs. If this policy were relaxed to allow client-side creation, any user could grant themselves platform administrative privileges.
- **Remediation:**
  Provide a dedicated, secure bootstrap procedure. The recommended approach is an explicit, administrative SQL script to be executed solely via the Supabase Dashboard SQL Editor (or Supabase CLI via service role) that assigns the initial Super Admin by email. In addition, provide a guarded bootstrap function `public.bootstrap_initial_super_admin(p_user_id UUID)` that can only be invoked **once** (fails if `COUNT(*) FROM user_roles WHERE role = 'super_admin' > 0`).

---

### Finding 4: Profile Exposure of Inactive/Historical Members (Medium)
- **Severity:** 🟡 Medium
- **Evidence:**
  ```sql
  EXISTS (
      SELECT 1 FROM public.pg_memberships admin_m
      JOIN public.pg_memberships member_m ON admin_m.property_id = member_m.property_id
      WHERE admin_m.user_id = auth.uid()
        AND admin_m.role = 'admin'
        AND admin_m.status = 'active'
        AND member_m.user_id = profiles.id
  )
  ```
- **Vulnerability:**
  `member_m.status = 'active'` was missing. A PG Admin could query profiles of individuals whose memberships had been terminated, suspended, or moved out decades prior, violating tenant privacy principles.
- **Remediation:**
  Add `AND member_m.status = 'active'` to the subquery condition in `profiles_select_policy`.

---

### Finding 5: Lack of Role Boundaries on Membership Assignment by PG Admins (Medium)
- **Severity:** 🟡 Medium
- **Evidence:**
  `memberships_manage_policy` permits property admins to execute `ALL` operations (INSERT, UPDATE, DELETE) with no restriction on the assigned `role`.
- **Vulnerability:**
  A PG Admin could potentially appoint another user as `admin` on the property without platform authorization, or alter platform-level membership records if table conditions are ambiguous.
- **Remediation:**
  Split `pg_memberships` management policies:
  - PG Admins may only insert/update/delete memberships where `role = 'tenant'` on properties they administer.
  - Appointing co-admins or transferring property ownership (`role = 'admin'`) is restricted to Super Admins (or creator admins through an explicit approval procedure).

---

### Finding 6: Missing Automatic `updated_at` Timestamp Maintenance (Medium)
- **Severity:** 🟡 Medium
- **Evidence:**
  `profiles`, `pg_properties`, and `pg_memberships` define `updated_at TIMESTAMPTZ`, but have no `BEFORE UPDATE` triggers.
- **Vulnerability:**
  Updates through the client or direct queries will leave `updated_at` stale unless explicitly supplied by the caller, which leads to untrustworthy audit trails and sync cache bugs.
- **Remediation:**
  Create a standardized trigger function `public.handle_updated_at()` and attach it as `BEFORE UPDATE ON profiles`, `BEFORE UPDATE ON pg_properties`, and `BEFORE UPDATE ON pg_memberships`.

---

### Finding 7: Unrestricted Function Execution Grants (`EXECUTE` to `PUBLIC`) (Low)
- **Severity:** 🔵 Low
- **Evidence:**
  By default in PostgreSQL, all newly created functions grant `EXECUTE` to `PUBLIC` (including unauthenticated `anon` connections).
- **Vulnerability:**
  Anonymous users could query functions like `get_user_context` or `is_property_admin`. While they return empty or false, running complex queries unauthenticated consumes server CPU and exposes query metadata.
- **Remediation:**
  Explicitly execute `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon;` and `GRANT EXECUTE ... TO authenticated;` for all functions. Furthermore, set `SET search_path = public, pg_temp;` on all `SECURITY DEFINER` functions to protect against schema path hijacking.

---

### Finding 8: Schema Drift and Constraint Validation (Low)
- **Severity:** 🔵 Low
- **Evidence:**
  `CREATE TABLE IF NOT EXISTS` quietly passes if a table exists with an outdated schema, without verifying that expected columns, foreign keys, and constraints are present.
- **Remediation:**
  Add table comment metadata and explicit `ALTER TABLE` constraint checks where necessary to verify schema consistency.

---

## 3. Design Decisions Requiring Project Approval

Before applying the hardened migration to production, please confirm:

1. **Co-Admin Policy:**  
   *Current Proposal:* PG Admins can onboard and manage `tenant` memberships only. Appointing additional PG Admins on a property requires Super Admin action.  
   *Alternative:* Allow existing PG Admins to invite co-admins on their own property.
2. **Initial Super Admin Email:**  
   Confirm the designated initial Super Admin account email (e.g., `siddhantdandavate@gmail.com`) to be used in the bootstrap seed script.
3. **Tenant Profile Updates:**  
   Confirm whether tenants can edit only their `phone` and `preferred_language`, or also their `full_name`. (Current proposal allows self-editing `full_name`, `phone`, `preferred_language`, and `avatar_url`).

---

## 4. Verification Test Cases (Executable SQL Matrix)

The following test suite validates the security model when executed against a live Supabase SQL environment with test roles:

```sql
-- ====================================================================
-- NESTIQ RLS & FUNCTION SECURITY VERIFICATION SUITE
-- ====================================================================

-- 1. Unauthenticated (anon) Access Test
-- Expected: All queries return 0 rows or permission denied.
SET ROLE anon;
SELECT * FROM public.profiles;              -- MUST return 0 rows
SELECT * FROM public.pg_properties;         -- MUST return 0 rows
SELECT * FROM public.pg_memberships;        -- MUST return 0 rows
SELECT public.get_user_context();           -- MUST throw permission denied error
RESET ROLE;

-- 2. Ordinary Authenticated User (No Role / Non-member)
-- Setup: User A (uuid: 11111111-1111-1111-1111-111111111111)
-- Expected: Can only see own profile. Cannot see Property X or Tenant B.
SET LOCAL request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SET LOCAL ROLE authenticated;

SELECT * FROM public.profiles;              -- MUST return ONLY User A profile
SELECT * FROM public.pg_properties;         -- MUST return 0 rows
-- Attempt cross-user disclosure via get_user_context:
SELECT public.get_user_context('22222222-2222-2222-2222-222222222222'); 
-- MUST RAISE EXCEPTION: 'Access denied: cannot inspect another user context'

-- 3. Tenant User Isolation
-- Setup: Tenant B (assigned to Property 1)
-- Expected: Sees own profile and Property 1. CANNOT see Property 2 or Tenant C.
SET LOCAL request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
SET LOCAL ROLE authenticated;

SELECT * FROM public.pg_properties;         -- MUST return ONLY Property 1
SELECT * FROM public.profiles;              -- MUST return ONLY Tenant B profile
SELECT * FROM public.pg_memberships;        -- MUST return ONLY Tenant B membership row
-- Attempt unauthorized insert into rent/rooms:
INSERT INTO public.user_roles (user_id, role) VALUES ('22222222-2222-2222-2222-222222222222', 'super_admin');
-- MUST FAIL with RLS violation

-- 4. Cross-Property Admin Isolation
-- Setup: Admin A (Property 1), Admin B (Property 2)
-- Expected: Admin A CANNOT query or update Property 2 or Tenant C in Property 2.
SET LOCAL request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333'; -- Admin A
SET LOCAL ROLE authenticated;

SELECT * FROM public.pg_properties;         -- MUST return ONLY Property 1
UPDATE public.pg_properties SET name = 'Hacked' WHERE id = '99999999-9999-9999-9999-999999999999'; -- Property 2
-- MUST update 0 rows (silent RLS rejection)

-- 5. Super Admin Platform Oversight
-- Setup: Super Admin S
-- Expected: Can inspect all profiles, properties, and memberships across the platform.
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000'; -- Super Admin
SET LOCAL ROLE authenticated;

SELECT COUNT(*) FROM public.profiles;       -- Returns total platform count
SELECT COUNT(*) FROM public.pg_properties;  -- Returns total platform properties
SELECT public.get_user_context('22222222-2222-2222-2222-222222222222');
-- MUST succeed and return Tenant B's context for platform support

RESET ROLE;
```
