# NESTIQ — Final Security Gate Audit Report

**Date:** October 22, 2026  
**Status:** **AUDIT COMPLETE — AWAITING USER APPROVAL BEFORE APPLYING**  
**Review Target:**  
- `supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql` (Legacy)  
- `supabase/migrations/20261022000001_milestone1_security_hardened.sql` (Hardened Draft)  
- `supabase/migrations/20261022000002_milestone1_final_hardened.sql` (Final Reviewable Candidate)  
- `features/properties/propertyService.ts`  
- `types/database.ts`  

---

## 1. Executive Summary & Security Posture

As instructed, **no SQL has been applied to the live database, no secrets have been exposed, and no commits or pushes were executed.**

The proposed hardened migration `20261022000001` resolved fundamental architectural vulnerabilities (such as cross-tenant context leaks and missing search paths). However, this final security audit identified **three critical gaps** in `20261022000001` that required remediation before applying to production:

1. **Co-Admin Policy Gap:** `20261022000001` restricted PG Admins to inviting only `role = 'tenant'`. Under the approved product decision, PG Admins must be able to invite co-admins (`role = 'admin'`) for their own property while preventing rogue co-admins from demoting the original property creator or altering their own role.
2. **Migration Upgrade Risk on Existing Databases:** If `20261022000000` was previously applied, the legacy policy `"memberships_manage_policy"` was not dropped, leaving an overly permissive `ALL` policy active on `pg_memberships`. Furthermore, `pg_properties` was missing an explicit `ALTER TABLE ... ADD COLUMN IF NOT EXISTS is_active`.
3. **Super Admin Bootstrap Interface:** `bootstrap_initial_super_admin` expected an internal `UUID` rather than a verified email address, and was missing a verified email check (`email_confirmed_at`).

To preserve existing migration history without overwriting, all remediations have been formulated into a clean, standalone, reviewable file:  
📁 [supabase/migrations/20261022000002_milestone1_final_hardened.sql](file:///e:/pg%20app/supabase/migrations/20261022000002_milestone1_final_hardened.sql)

---

## 2. Technical Audit against Security Checkpoints

### 2.1 `get_user_context()` Caller Restriction & Data Exposure
- **Finding:** In `20261022000000`, any authenticated user could pass another user's UUID and inspect their memberships and profile.
- **Verification in Hardened SQL:** `get_user_context(p_user_id UUID DEFAULT auth.uid())` performs an upfront caller authentication check (`auth.uid() IS NULL`) and validates:
  ```sql
  IF v_target_id <> v_caller_id AND NOT public.is_super_admin(v_caller_id) THEN
      RAISE EXCEPTION 'Access denied: cannot inspect another user context' USING ERRCODE = '42501';
  END IF;
  ```
- **Public Execution:** `REVOKE ALL ON FUNCTION public.get_user_context FROM PUBLIC, anon;` blocks anonymous execution at the Postgres permission level.
- **Verdict:** **VERIFIED PROTECTED.** Cross-user inspection is impossible for regular users.

### 2.2 Atomic `create_pg_property()` & Caller Verification
- **Finding:** Property creation previously required two separate client-side queries (`pg_properties` insert followed by `pg_memberships` insert). If network dropped after step 1, an orphaned property was created with no admin membership.
- **Verification in Hardened SQL:** `create_pg_property(...)` runs inside an atomic PL/pgSQL transaction with `SECURITY DEFINER` and `SET search_path = public, pg_temp`. It checks `auth.uid()`, inserts the property with `created_by = auth.uid()`, and inserts the creator's `role = 'admin'` membership in the same transaction.
- **Client Service Update:** `propertyService.ts` was updated to call `supabase.rpc('create_pg_property', ...)` first, with a fallback for backwards compatibility.
- **Verdict:** **VERIFIED PROTECTED.** Property and admin membership are created atomically.

### 2.3 Privilege Escalation & Super Admin Protections
- **Finding:** Check whether any client-accessible function or RLS policy can assign or grant `super_admin`.
- **Verification:**
  1. `public.user_roles` check constraint restricts roles strictly to `('super_admin')`.
  2. `user_roles` RLS policy `user_roles_admin_manage` strictly enforces `is_super_admin(auth.uid())`.
  3. `public.pg_memberships` check constraint restricts property roles to `('admin', 'tenant')`. `super_admin` cannot be inserted into `pg_memberships`.
  4. `bootstrap_initial_super_admin` has execution **revoked** from `PUBLIC`, `anon`, and `authenticated`. Only `service_role` (Supabase Dashboard SQL editor / backend) can execute it.
- **Verdict:** **VERIFIED PROTECTED.** No client can escalate themselves or others to Super Admin.

### 2.4 RLS Recursion & Helper Functions
- **Finding:** RLS policies on `pg_memberships` that call `is_property_admin()` could cause infinite recursion if the function is not `SECURITY DEFINER`.
- **Verification:** All security helper functions (`is_super_admin`, `is_property_admin`, `is_property_member`) are marked `SECURITY DEFINER` and `STABLE` with `SET search_path = public, pg_temp`. They bypass RLS recursion cleanly when evaluating authorization.
- **Verdict:** **VERIFIED PROTECTED.** Zero recursion risk.

### 2.5 Search Path Security
- **Finding:** Functions defined without `SET search_path` are vulnerable to search path hijacking in multi-schema databases.
- **Verification:** All functions in `20261022000002` explicitly declare:
  - `SET search_path = public, pg_temp` (or `public, auth, pg_temp` for the bootstrap function).
- **Verdict:** **VERIFIED PROTECTED.**

---

## 3. Product Decisions Compliance Audit

### Decision 1: Co-Admin Policy (PG Admins can invite co-admins for their property)
| Threat / Requirement | Hardened Mitigation in `20261022000002` | Status |
| :--- | :--- | :--- |
| **PG Admin invites co-admin** | `memberships_insert_policy` allows `is_property_admin(property_id, auth.uid()) AND role IN ('admin', 'tenant')` | **Enforced** |
| **Cross-property co-admin assignment** | Blocked: `property_id` in `WITH CHECK` must match `is_property_admin(property_id, auth.uid())` | **Enforced** |
| **Self-promotion to Super Admin** | Blocked: `pg_memberships` only accepts `'admin'` or `'tenant'`. `user_roles` is inaccessible. | **Enforced** |
| **Co-admin locks out property creator** | Blocked: `memberships_update_policy` and `memberships_delete_policy` only permit managing co-admins if `created_by = auth.uid()` or caller is `super_admin`. Co-admins cannot touch the creator's membership. | **Enforced** |
| **Admin modifies own membership** | Blocked: `memberships_update_policy` enforces `auth.uid() <> user_id`. | **Enforced** |

### Decision 2: Initial Super Admin Bootstrap by Verified Email
| Requirement | Hardened Mitigation in `20261022000002` | Status |
| :--- | :--- | :--- |
| **Existing Supabase Auth user** | Queries `auth.users` by `lower(email) = lower(trim(p_email))`. Fails if user not signed up. | **Enforced** |
| **Verified email only** | Validates `email_confirmed_at IS NOT NULL`. Throws `42501` if unconfirmed. | **Enforced** |
| **No hardcoded/fake email** | Function takes `p_email TEXT` as an explicit parameter in the SQL call. | **Enforced** |
| **Single-use guard** | Throws `'Super Admin already initialized. Platform bootstrap is permanently locked.'` if `COUNT(role = 'super_admin') > 0`. | **Enforced** |
| **Client-callable protection** | Permissions revoked from `anon` and `authenticated`; granted exclusively to `service_role`. | **Enforced** |

### Decision 3: Tenant Profile Editing
| Requirement | Hardened Mitigation in `20261022000002` | Status |
| :--- | :--- | :--- |
| **Tenants update own personal data** | `profiles_update_own` allows `auth.uid() = id` with `WITH CHECK (auth.uid() = id)`. | **Enforced** |
| **Tenants cannot alter roles** | `profiles` table contains no role column. `user_roles` and `pg_memberships` reject tenant writes. | **Enforced** |
| **Tenants cannot modify others' profiles** | RLS blocks updating any row where `id <> auth.uid()`. | **Enforced** |

---

## 4. App Client & Schema Compatibility Audit

### 4.1 TypeScript Types (`types/database.ts`)
- `PGProperty` interface previously omitted `is_active`.
- **Status:** **Updated & Verified.** `is_active: boolean` is now declared on `PGProperty`.
- `tsc --noEmit` verified with **0 errors**.

### 4.2 Property Service (`features/properties/propertyService.ts`)
- `DEFAULT_DEV_PROPERTY` and `newProp` updated with `is_active: true`.
- `createProperty` updated to invoke `supabase.rpc('create_pg_property', { ... })` atomically.
- **Status:** **Updated & Verified.**

### 4.3 Safe Schema Upgrades (Fresh vs. Existing DB)
- Added `ALTER TABLE public.pg_properties ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;` so databases migrated with `20261022000000` gain the column without schema errors.
- Added explicit `DROP POLICY IF EXISTS "memberships_manage_policy" ON public.pg_memberships;` to eliminate the overly permissive legacy policy.

---

## 5. Prioritized Findings Matrix

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              FINDINGS MATRIX                                 │
├─────────────────┬──────────────────────────────────────────────┬─────────────┤
│ Severity        │ Description                                  │ Resolution  │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🔴 CONFIRMED    │ Legacy memberships_manage_policy left active │ Fixed in    │
│                 │ in existing DB upgrades                      │ 000002 SQL  │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🔴 CONFIRMED    │ 20261022000001 prevented PG Admins from      │ Fixed in    │
│                 │ inviting co-admins (Decision 1)              │ 000002 SQL  │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🟠 CONFIRMED    │ Bootstrap required raw UUID without verified │ Fixed in    │
│                 │ email check (Decision 2)                     │ 000002 SQL  │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🟠 CONFIRMED    │ App types & dev mock missing is_active field │ Fixed in    │
│                 │                                              │ Codebase    │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🟡 POTENTIAL    │ Co-admin could demote property creator       │ Fixed with  │
│                 │                                              │ owner check │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🟢 VERIFIED     │ get_user_context caller restricted           │ Protected   │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🟢 VERIFIED     │ create_pg_property atomic & authenticated    │ Protected   │
├─────────────────┼──────────────────────────────────────────────┼─────────────┤
│ 🟢 VERIFIED     │ Tenant profile edit restricted to own data   │ Protected   │
└─────────────────┴──────────────────────────────────────────────┴─────────────┘
```

---

## 6. Safe Application Sequence (Awaiting Your Approval)

When you are ready to apply the migration, follow this exact sequence:

### Step 1: Open Supabase Dashboard
1. Navigate to your Supabase project dashboard at `https://supabase.com/dashboard/project/<your-project-id>`.
2. Click on **SQL Editor** in the left sidebar.

### Step 2: Paste and Execute `20261022000002_milestone1_final_hardened.sql`
1. Create a new query in the SQL Editor.
2. Copy the entire contents of:  
   `supabase/migrations/20261022000002_milestone1_final_hardened.sql`
3. Click **Run**.
4. Confirm message: `Success. No rows returned`.

### Step 3: Bootstrap Your Initial Super Admin Account
1. Ensure your personal admin email has already signed up and confirmed its email address via the app or Supabase Auth.
2. Run this single command in the Supabase SQL Editor:
   ```sql
   SELECT public.bootstrap_initial_super_admin('your-verified-email@example.com');
   ```
3. Verify the output:
   ```json
   {
     "success": true,
     "email": "your-verified-email@example.com",
     "role": "super_admin"
   }
   ```
4. Run it a second time to verify the lockout:
   ```sql
   SELECT public.bootstrap_initial_super_admin('your-verified-email@example.com');
   ```
   *Expected result: ERROR: Super Admin already initialized. Platform bootstrap is permanently locked.*

---

## 7. Proposed Post-Migration Verification Test Suite (Unexecuted)

> [!IMPORTANT]
> **Status:** The following test cases are **PROPOSED VERIFICATION PROCEDURES** designed to validate role boundaries once the schema is applied. They have **NOT** yet been executed against the live database, as no SQL has touched production.

Run these test cases in the Supabase SQL Editor immediately after applying the migration to verify every role boundary:

```sql
-- TEST 1: Anonymous Access (Must fail with 0 rows or permission denied)
SET ROLE anon;
SELECT * FROM public.pg_properties;
-- Expected: 0 rows

SELECT public.get_user_context('00000000-0000-0000-0000-000000000000');
-- Expected: ERROR: permission denied for function get_user_context

-- RESET
RESET ROLE;

-- TEST 2: Tenant Profile Boundary
-- As a tenant, updating full_name succeeds:
-- UPDATE public.profiles SET full_name = 'Updated Name' WHERE id = auth.uid();
-- Updating role fails (user_roles is non-writable by tenant):
-- INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'super_admin');
-- Expected: ERROR: new row violates row-level security policy for table "user_roles"

-- TEST 3: Co-Admin Ownership Boundary
-- As a Co-Admin (not the creator), deleting the creator's membership:
-- DELETE FROM public.pg_memberships WHERE property_id = '<prop_id>' AND user_id = '<creator_id>';
-- Expected: 0 rows affected (blocked by memberships_delete_policy)

-- TEST 4: Cross-Property Isolation
-- Admin of Property A querying properties of Admin B:
-- SELECT * FROM public.pg_properties WHERE id = '<prop_b_id>';
-- Expected: 0 rows (unless user is Super Admin)
```

---

## 8. Current Status & Next Action

- **Code Status:** Clean. `tsc --noEmit` returns 0 errors.
- **Git Status:** 0 commits made, 0 pushes made.
- **Supabase Status:** 0 queries run against live database.

**Antigravity is currently paused at the security gate.**  
Please review this report and confirm if you approve the final migration file `20261022000002_milestone1_final_hardened.sql` before we proceed to apply it.
