# NESTIQ — Implementation Plan

This implementation plan defines the controlled, phase-by-phase execution of the NESTIQ Android application following the single source of truth: [NESTIQ-Product-Roadmap.md](file:///e:/pg%20app/docs/NESTIQ-Product-Roadmap.md).

---

## 1. Phase Dependency Hierarchy

``` text
Phase 1: Foundation, Auth, Profile & RLS (COMPLETED & VERIFIED)
   │
   ▼
Phase 2: PG Property Management (CURRENT TARGET)
   │
   ▼
Phase 3: Room & Bed Management
   │
   ▼
Phase 4: Tenant Onboarding & Stays
   │
   ▼
Phase 5: Rent Schedule & Dues Tracking
   │
   ▼
Phase 6: Payment Records, Receipts & Reversals
   │
   ▼
Phase 7: Complaints & Maintenance
   │
   ▼
Phase 8: In-App Notifications & Localization
   │
   ▼
Phase 9: Quality, Release Builds & Security Verification
```

---

## 2. Phase-by-Phase Execution Details

### Phase 1: Foundation, Auth, Profile & RLS (Completed)
- **Status:** ✅ Complete
- **Deliverables:**
  - Supabase client with AsyncStorage session persistence ([lib/supabase.ts](file:///e:/pg%20app/lib/supabase.ts)).
  - PostgreSQL schema and RLS policies ([20261022000000_milestone1_auth_roles_rls.sql](file:///e:/pg%20app/supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql)).
  - Mobile authentication context ([features/auth/AuthContext.tsx](file:///e:/pg%20app/features/auth/AuthContext.tsx)).
  - Role-specific dashboard placeholders ([SuperAdminDashboard](file:///e:/pg%20app/features/superadmin/SuperAdminDashboard.tsx), [AdminDashboard](file:///e:/pg%20app/features/admin/AdminDashboard.tsx), [TenantDashboard](file:///e:/pg%20app/features/tenant/TenantDashboard.tsx)).
- **Verification:** `expo-doctor` passed (21/21), TypeScript passed with 0 errors, Android/iOS Metro bundles built with 0 errors.

---

### Phase 2: PG Property Management (Immediate Next Priority)
- **Goal:** Enable authorized PG Admins and Super Admins to view, create, edit, and switch PG properties with database-level isolation.
- **Key Deliverables:**
  1. `features/properties/propertyService.ts`: CRUD operations calling Supabase `pg_properties` and `pg_memberships`.
  2. `features/properties/PropertyListModal.tsx`: View all assigned properties for an admin.
  3. `features/properties/CreatePropertyModal.tsx`: Form to create a new PG (name, address, city, state, pincode, contact phone).
  4. `features/properties/PropertyDetailCard.tsx`: Display active property details with address and admin info.
  5. Integration into [AdminDashboard.tsx](file:///e:/pg%20app/features/admin/AdminDashboard.tsx) for seamless property switching.
- **Acceptance Criteria:**
  - An Admin sees only their assigned properties in the switcher.
  - Creating a property automatically links the creator as `admin` in `pg_memberships`.
  - Updating a property validates required fields (name, contact phone).
  - Cross-property editing is rejected by RLS.
- **Test Plan:**
  - Unit test for property validation.
  - Supabase RLS test verifying Admin A cannot modify Property B.

---

### Phase 3: Room & Bed Management
- **Goal:** Manage room inventory, capacity, sharing types, and bed-level allocations without risking overbooking.
- **Key Deliverables:**
  1. Database migration: `public.rooms` and `public.beds` with RLS.
  2. `features/rooms/roomService.ts`: Room and bed queries filtered by `property_id`.
  3. `features/rooms/RoomsScreen.tsx`: Room list with occupancy indicators (occupied vs total beds).
  4. `features/rooms/AddRoomModal.tsx`: Room creation with floor, sharing type, capacity, and rent per bed.
- **Acceptance Criteria:**
  - Rooms are strictly scoped to the active property.
  - Occupancy counts are dynamically derived from active tenant stays, not manual counters.
  - Room identifiers must be unique per property.
- **Test Plan:**
  - Verify room creation and bed generation for single/double/triple sharing.
  - Verify capacity constraints.

---

### Phase 4: Tenant Onboarding & Stays
- **Goal:** Onboard tenants, capture essential contact data, and assign them to an available room/bed with clear move-in dates.
- **Key Deliverables:**
  1. Database migration: `public.tenant_stays` with RLS.
  2. `features/tenants/tenantService.ts`: Onboarding, stay management, and directory queries.
  3. `features/tenants/TenantListScreen.tsx`: Directory with active/moved-out filtering and search.
  4. `features/tenants/TenantOnboardingModal.tsx`: Onboard tenant and assign room/bed.
  5. `features/tenants/TenantDetailModal.tsx`: View stay history, emergency contact, and agreement details.
- **Acceptance Criteria:**
  - An available bed must be chosen; assigned beds cannot be double-booked.
  - Move-out frees the bed while maintaining the historical stay record.
  - Tenant can view their assigned room in [TenantDashboard.tsx](file:///e:/pg%20app/features/tenant/TenantDashboard.tsx).
- **Test Plan:**
  - Double-booking prevention test.
  - Move-out lifecycle test verifying bed availability is restored.

---

### Phase 5: Rent Schedules & Payment Tracking
- **Goal:** Track rent obligations, record offline/manual payments, handle partial payments, and provide traceable receipts and reversals.
- **Key Deliverables:**
  1. Database migration: `public.rent_records` and `public.payments` with RLS.
  2. `features/payments/paymentService.ts`: Rent generation, payment recording, and reversal logic.
  3. `features/payments/PaymentHistoryScreen.tsx`: Detailed transaction ledger with receipt views.
  4. `features/payments/RecordPaymentModal.tsx`: Record cash/UPI/bank transfer with reference ID and date.
  5. `features/payments/ReceiptModal.tsx`: Printable/shareable payment receipt.
  6. Reversal mechanism with mandatory reason and balance restoration.
- **Acceptance Criteria:**
  - Rent obligations generated once per billing period without duplicates.
  - Partial payments accurately update the remaining balance.
  - Reversals restore outstanding balance and mark transaction as reversed (`is_reversed: true`).
  - Tenants view only their own payment records.
- **Test Plan:**
  - Math validation: `currentBalance - paymentAmount = balanceAfter`.
  - Reversal validation: `balanceAfter + paymentAmount = restoredBalance`.

---

### Phase 6: Complaints & Maintenance
- **Goal:** Enable tenants to raise maintenance requests and PG Admins to resolve them with status tracking.
- **Key Deliverables:**
  1. Database migration: `public.complaints` with RLS.
  2. `features/complaints/complaintService.ts`: Submit and update complaints.
  3. `features/complaints/TenantComplaintScreen.tsx`: Raise complaint and view status.
  4. `features/complaints/AdminComplaintScreen.tsx`: Filter by status and update progress.
- **Acceptance Criteria:**
  - Status progression: Open $\rightarrow$ In Progress $\rightarrow$ Resolved.
  - RLS prevents tenants from reading complaints from other tenants.
- **Test Plan:**
  - Tenant submission and admin resolution test.

---

### Phase 7: Localization & Formatting
- **Goal:** Native multilingual support across English, Hindi, Marathi, Telugu, Tamil, Kannada, Malayalam, and Gujarati.
- **Key Deliverables:**
  1. Port existing 8 locale dictionaries from `legacy-web-prototype/src/i18n/locales/*.json` into `locales/`.
  2. Native formatters in `lib/utils/formatters.ts`: INR currency (`₹`), Indian date formatting, and WhatsApp reminder message generator.
  3. Language selector modal in settings.
- **Acceptance Criteria:**
  - Language switches immediately without requiring sign-out.
  - Selected language persists across app restarts in `AsyncStorage` and `profiles.preferred_language`.
- **Test Plan:**
  - Switch between English and Hindi, verify UI strings update.

---

### Phase 8: Testing, Security & Release Readiness
- **Goal:** Full verification across real device screens, error boundaries, and release build configuration.
- **Key Deliverables:**
  1. Comprehensive RLS cross-role permission tests.
  2. Android APK / EAS build validation.
  3. Documentation updates and release checklists.
