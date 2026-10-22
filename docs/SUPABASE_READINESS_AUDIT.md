# NESTIQ — Supabase Readiness & Local Preview Audit

**Audit Date:** 2026-10-22  
**Auditor:** Antigravity (Acting CTO, QA Engineer & Principal Architect)  
**Target Platform:** React Native + Expo (Android-First)  
**Current Git Branch:** `siddhant` (Working tree clean)  
**Single Source of Truth:** `docs/NESTIQ-Product-Roadmap.md`

---

## 1. Environment Configuration Status

**Status:** `NOT CONFIGURED`

### Findings
- **`.env` Configuration:**
  - `e:\pg app\.env` exists but contains placeholder values:
    ```bash
    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    ```
  - `lib/supabase.ts` inspects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Because placeholder domains are detected (`your-project`), `isSupabaseConfigured` evaluates to `false`.
- **Local Fallback Behavior:**
  - The application intentionally detects missing/placeholder credentials and sets `isConfigured = false`.
  - In [AuthScreen.tsx](file:///e:/pg%20app/features/auth/AuthScreen.tsx), the warning banner is actively displayed:  
    *“⚠️ Local Environment Mode: Supabase credentials not yet configured in .env. You can use the Quick Role Switcher below to test Super Admin, PG Admin, and Tenant dashboards.”*
  - This prevents network timeout crashes on boot while allowing preview testing of the UI components.
- **Git Protection:**
  - [.gitignore](file:///e:/pg%20app/.gitignore) safely ignores `.env`, `.env*.local`, `.env.*`.
  - `.env.example` is tracked as the safe template.
  - Zero secrets or private keys are committed.

---

## 2. Database Connectivity Status

**Status:** `NOT CONFIGURED` / `BLOCKED`

### Findings
- **Local Supabase Daemon:**
  - Execution of `supabase status` confirmed Docker Desktop is not active (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`).
  - No local PostgreSQL instance is running on port 54321/54322.
- **Remote Cloud Supabase Project:**
  - `supabase projects list` indicates that two prior projects exist on the user's account (`anupam-balwadi` and `siddhantdandavate's Project`), both with status `INACTIVE`.
  - No Supabase project is linked to `pg_app` (`Cannot find project ref. Have you run supabase link?`).
  - No active remote database endpoint is currently targeted.

---

## 3. Tables & Schema Status

**Status:** `NOT VERIFIED` (Local migration ready, but unapplied to live DB)

### Findings
- **Migration File Status:**
  - `supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql` exists and defines the full initial schema:
    1. `public.profiles` (id, full_name, phone, preferred_language, avatar_url, timestamps).
    2. `public.user_roles` (id, user_id, role = 'super_admin', timestamps).
    3. `public.pg_properties` (id, name, address, city, state, pincode, contact_phone, created_by, timestamps).
    4. `public.pg_memberships` (id, user_id, property_id, role IN ('admin', 'tenant'), status, timestamps).
    5. Trigger `handle_new_user` on `auth.users`.
- **Live Database Status:**
  - Because no database is connected or running, this schema has **not yet been executed or verified on a live PostgreSQL database**.
  - No table exists on a live server until a Supabase project is provisioned/linked and migrations are applied.

---

## 4. RLS & Security Verification Status

**Status:** `NOT VERIFIED` (SQL policies written; live multi-user verification pending)

### Findings
- **SQL Policy Design:**
  - `profiles`: Self-read, self-update, super admin read-all, PG Admin read members of own PG.
  - `user_roles`: Super admin only can assign or modify.
  - `pg_properties`: Members and super admins can view; only authorized property admins can update.
  - `pg_memberships`: Admins manage members of their PG; tenants view only their own record.
  - Security Definer helper functions (`is_super_admin`, `is_property_admin`, `is_property_member`, `get_user_context`) prevent RLS recursion.
- **Verification Reality:**
  - The policies are structurally sound on paper, but **zero live queries have been tested against Supabase with distinct user JWT tokens**.
  - Client-side role switching in the preview is purely in-memory UI simulation, **not a security boundary**.

---

## 5. Screen-by-Screen Data-Source Audit

| Screen / Feature | Data Displayed / Flow | Actual Data Source | Supabase Connected? |
| :--- | :--- | :--- | :---: |
| **Auth Screen** | Sign-In & Sign-Up form | In-memory state (`AuthScreen.tsx`) | ❌ No |
| **Role Selector** | Super Admin / PG Admin / Tenant buttons | In-memory simulated profile in `AuthContext.tsx` | ❌ No |
| **Super Admin Dashboard** | Platform Name & Profile Name | In-memory mock profile (`dev-super-admin`) | ❌ No |
| **Super Admin Dashboard** | 12 PGs, 14 PG Admins, 99.9% Uptime | **Hardcoded static mock constants** | ❌ No |
| **PG Admin Dashboard** | Property List (Chips & Switcher) | **AsyncStorage** (`@nestiq_dev_properties`) | ❌ No |
| **PG Admin Dashboard** | "+ Add PG" Form (Create) | Saves to **AsyncStorage**; persists on device | ❌ No |
| **PG Admin Dashboard** | "Edit Details" Form (Update) | Updates in **AsyncStorage**; persists on device | ❌ No |
| **PG Admin Dashboard** | 16 Rooms, 38 Beds, 34 Tenants, 89% Occupancy | **Hardcoded static mock constants** | ❌ No |
| **Tenant Dashboard** | Resident Name | In-memory mock profile (`dev-tenant`) | ❌ No |
| **Tenant Dashboard** | "Room 204 • Bed B", "₹8,500", "Due 5th" | **Hardcoded static mock constants** | ❌ No |
| **Tenant Dashboard** | Services buttons (Payments, Complaints) | Static UI navigation placeholder shells | ❌ No |

---

## 6. Mock Data & Misleading Metrics Audit

The following metrics currently rendered in the UI are **100% static placeholders** and must not be confused with real data:

| Metric Claimed | File Location | Nature | Recommendation |
| :--- | :--- | :--- | :--- |
| **12 Total PGs** | `features/superadmin/SuperAdminDashboard.tsx:64` | Hardcoded static number | Display `—` or dynamic count of registered PGs |
| **14 Active PG Admins** | `features/superadmin/SuperAdminDashboard.tsx:69` | Hardcoded static number | Display `—` or query real admin count |
| **99.9% Platform Uptime** | `features/superadmin/SuperAdminDashboard.tsx:74` | Hardcoded static number | Replace with "Database: Local / Not Linked" |
| **0 Critical Alerts** | `features/superadmin/SuperAdminDashboard.tsx:79` | Hardcoded static number | Replace with actual system health indicator |
| **16 Total Rooms** | `features/admin/AdminDashboard.tsx:189` | Hardcoded static number | Label as "Phase 3 Placeholder" or show `0` until Phase 3 |
| **38 Total Beds** | `features/admin/AdminDashboard.tsx:195` | Hardcoded static number | Label as "Phase 3 Placeholder" or show `0` until Phase 3 |
| **34 Active Tenants** | `features/admin/AdminDashboard.tsx:201` | Hardcoded static number | Label as "Phase 4 Placeholder" or show `0` until Phase 4 |
| **89% Occupancy Rate** | `features/admin/AdminDashboard.tsx:207` | Hardcoded static number | Compute dynamically once rooms & tenants are implemented |
| **Room 204 • Bed B** | `features/tenant/TenantDashboard.tsx:44` | Hardcoded static string | Display "No stay assigned" unless linked to `tenant_stays` |
| **₹8,500 Monthly Rent** | `features/tenant/TenantDashboard.tsx:50` | Hardcoded static number | Display "No active rent due" until Phase 5 |

---

## 7. Blockers & Safest Next Steps

### Blockers
1. **No Live Supabase Connection:** The app cannot authenticate real users, enforce PostgreSQL RLS, or persist property data to a central cloud database without an active Supabase project URL and anon key.
2. **Local Preview Isolation:** Current property additions ("+ Add PG") persist only in local device `AsyncStorage`. They are not shared between devices or visible to other users.

### Recommended Next Actions (In Strict Sequence)

1. **Step A: Configure Supabase Project**
   - Provide or provision a dedicated NESTIQ Supabase project (via Supabase Cloud dashboard or local Docker).
   - Add the valid `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`.
2. **Step B: Apply & Verify Initial Migration**
   - Execute `20261022000000_milestone1_auth_roles_rls.sql` against the Supabase project to create `profiles`, `user_roles`, `pg_properties`, `pg_memberships`, triggers, and RLS policies.
3. **Step C: Verify Authentication & Isolation with Real Test Accounts**
   - Test sign-up of a Super Admin account, a PG Admin account, and a Tenant account.
   - Test real database login and session restoration.
   - Verify that PG Admin A cannot query PG Admin B's properties.
   - Verify that Tenants cannot read other tenants' data.
4. **Step D: Implement Rooms & Beds (Phase 3)**
   - Only after Steps A–C are verified should the `rooms` and `beds` schema migration and screens be created.

---
*Report generated via read-only inspection. No source code or database migrations were modified.*
