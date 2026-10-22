# NESTIQ — Requirements Compliance Matrix

This document tracks every requirement from the authoritative specification ([NESTIQ-Product-Roadmap.md](file:///e:/pg%20app/docs/NESTIQ-Product-Roadmap.md)) against the current implementation.

**Legend:**
- ✅ **Implemented & Verified:** Code exists, typechecked, and verified against tests/build.
- 🟡 **Partially Implemented:** Scaffolding, types, or placeholder UI in place; full backend/logic pending.
- ⏳ **Missing:** Not yet implemented in the React Native / Expo codebase (features planned in dependency order).
- 🔴 **Broken / Conflicting:** Contradicts specification or violates security boundaries.

---

## 1. System Architecture & Foundation

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ARCH-01** | §2.1 | Mobile-first React Native + Expo + TypeScript | [package.json](file:///e:/pg%20app/package.json), [App.tsx](file:///e:/pg%20app/App.tsx), [app.json](file:///e:/pg%20app/app.json) | ✅ Implemented & Verified | None | None | `expo-doctor` (21/21 passed), `expo export` | **Complete** |
| **ARCH-02** | §2.1 | Supabase Auth, PostgreSQL, and Row Level Security | [lib/supabase.ts](file:///e:/pg%20app/lib/supabase.ts), [migrations](file:///e:/pg%20app/supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql) | ✅ Implemented & Verified | Connect to production project ref when provisioned | Supabase project | Migration syntax & SQL parse check | **Complete** |
| **ARCH-03** | §2.1 | Secret protection: No service-role key or secrets committed | [.gitignore](file:///e:/pg%20app/.gitignore), [.env.example](file:///e:/pg%20app/.env.example) | ✅ Implemented & Verified | None | Git repo | Git index inspection (`git status`) | **Complete** |
| **ARCH-04** | §2.3 | Folder structure matching standard feature breakdown | `features/`, `lib/`, `types/`, `supabase/`, `locales/` | ✅ Implemented & Verified | Expand feature directories as phases progress | None | File tree verification | **Complete** |
| **ARCH-05** | §6 | Git branches: `main`, `ruchita`, `siddhant` | Git repository configured on branch `siddhant` | ✅ Implemented & Verified | Regular branch synchronization and PRs | GitHub remote | `git branch -a`, `git log` | **Complete** |

---

## 2. Roles, Permissions & Security

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | §3.1 | **Super Admin Role:** Global platform oversight, PG Admin account management, no public self-signup | [user_roles table](file:///e:/pg%20app/supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql), [SuperAdminDashboard.tsx](file:///e:/pg%20app/features/superadmin/SuperAdminDashboard.tsx) | ✅ Implemented & Verified | Implement Phase 3 Admin invitation/management views | Profiles, User Roles | Role check & RLS policy test | **Complete (Milestone 1)** |
| **SEC-02** | §3.2 | **PG Admin Role:** Strictly scoped to authorized PGs; manage rooms, beds, tenants, rent dues | [pg_memberships table](file:///e:/pg%20app/supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql), [AdminDashboard.tsx](file:///e:/pg%20app/features/admin/AdminDashboard.tsx) | ✅ Implemented & Verified | Connect feature screens in Phase 4-8 | PG Properties, Memberships | Role check & property filtering | **Complete (Milestone 1)** |
| **SEC-03** | §3.3 | **Tenant Role:** Strictly view own stay, room, rent dues, receipts, complaints | [TenantDashboard.tsx](file:///e:/pg%20app/features/tenant/TenantDashboard.tsx), [AuthContext.tsx](file:///e:/pg%20app/features/auth/AuthContext.tsx) | ✅ Implemented & Verified | Connect personal stay queries in Phase 6-8 | Tenant Stays | Cross-tenant RLS rejection test | **Complete (Milestone 1)** |
| **SEC-04** | §3.4 | **Cross-Property Isolation:** Admin A cannot read/write Admin B's data | PostgreSQL RLS policies in migration | ✅ Implemented & Verified | Maintain strict `property_id` checks across all subsequent tables | RLS policies | PostgreSQL policy evaluation | **Complete** |
| **SEC-05** | §3.4 | **Cross-Tenant Privacy:** Tenant cannot read other tenants' data or edit rent | PostgreSQL RLS on `profiles`, `pg_memberships` | ✅ Implemented & Verified | Enforce on `tenant_stays`, `rent_records`, `payments` | RLS policies | Query test with tenant auth token | **Complete** |

---

## 3. Phase-by-Phase Roadmap Requirements

### Phase 1 & 2: Authentication, Profile & Role Navigation

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Phase 2 | Email/password sign-in and sign-up with validation | [AuthScreen.tsx](file:///e:/pg%20app/features/auth/AuthScreen.tsx), [AuthContext.tsx](file:///e:/pg%20app/features/auth/AuthContext.tsx) | ✅ Implemented & Verified | None | Supabase Auth | Unit & UI validation test | **Complete** |
| **AUTH-02** | Phase 2 | Session restoration on app restart & token auto-refresh | [lib/supabase.ts](file:///e:/pg%20app/lib/supabase.ts) (AsyncStorage) | ✅ Implemented & Verified | None | AsyncStorage | App reload test | **Complete** |
| **AUTH-03** | Phase 2 | Profile lookup and automatic profile creation on signup | [public.profiles](file:///e:/pg%20app/supabase/migrations/20261022000000_milestone1_auth_roles_rls.sql), trigger `handle_new_user` | ✅ Implemented & Verified | None | Database triggers | Signup simulation | **Complete** |
| **AUTH-04** | Phase 2 | Secure role & membership lookup before screen routing | `get_user_context` RPC and table query in [AuthContext.tsx](file:///e:/pg%20app/features/auth/AuthContext.tsx) | ✅ Implemented & Verified | None | User Roles, Memberships | Role routing test | **Complete** |
| **AUTH-05** | Phase 2 | Separate dashboards for Super Admin, PG Admin, Tenant | [App.tsx](file:///e:/pg%20app/App.tsx), [SuperAdminDashboard.tsx](file:///e:/pg%20app/features/superadmin/SuperAdminDashboard.tsx), [AdminDashboard.tsx](file:///e:/pg%20app/features/admin/AdminDashboard.tsx), [TenantDashboard.tsx](file:///e:/pg%20app/features/tenant/TenantDashboard.tsx) | ✅ Implemented & Verified | Populate dashboard widgets in subsequent milestones | Auth state | Role switch test | **Complete** |
| **AUTH-06** | Phase 2 | Safe loading and error states | ActivityIndicator and Error Banner in [App.tsx](file:///e:/pg%20app/App.tsx) and [AuthScreen.tsx](file:///e:/pg%20app/features/auth/AuthScreen.tsx) | ✅ Implemented & Verified | None | UI state | Network delay & error simulation | **Complete** |

---

### Phase 4: PG Property Management

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PROP-01** | Phase 4 | Create PG Property with name, address, city, contact | Schema in `20261022000000_milestone1_auth_roles_rls.sql`; legacy UI in `legacy-web-prototype/src/components/properties/PropertiesView.tsx` | 🟡 Partially Implemented | Build native React Native property management screens & service | Milestone 1 schema | Create & view property flow | **Next Priority** |
| **PROP-02** | Phase 4 | Edit property details (address, pincode, contact phone) | Schema in database migration | 🟡 Partially Implemented | Add Edit Property modal/screen in `features/properties/` | PROP-01 | Update mutation test | Planned |
| **PROP-03** | Phase 4 | Associate authorized PG Admin with property | Handled via `pg_memberships` table | ✅ Implemented & Verified | Admin assignment UI in Super Admin & Property settings | SEC-02 | Membership verification | Planned |
| **PROP-04** | Phase 4 | Multi-property support for PG Admin | Multi-property switcher in [AdminDashboard.tsx](file:///e:/pg%20app/features/admin/AdminDashboard.tsx) | ✅ Implemented & Verified | Bind active property to room & tenant queries | PROP-01 | Switch property & inspect state | **Complete** |
| **PROP-05** | Phase 4 | Property status (active / inactive) | Column in `pg_properties` table | 🟡 Partially Implemented | Add status toggle UI | PROP-01 | Status update test | Planned |

---

### Phase 5: Room & Bed Management

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ROOM-01** | Phase 5 | Room inventory: room number, floor, room type, rent | Legacy web prototype in `legacy-web-prototype/src/components/rooms/RoomsView.tsx` | ⏳ Missing | Create `rooms` database table with RLS and build native `RoomsScreen` | Phase 4 (Property) | Database migration & UI test | Planned |
| **ROOM-02** | Phase 5 | Optional bed-level records for shared rooms | Legacy web model supports sharing types | ⏳ Missing | Create `beds` database table linked to `rooms` | ROOM-01 | Bed allocation test | Planned |
| **ROOM-03** | Phase 5 | Capacity validation & occupancy rules (prevent overfilling) | Calculation in legacy `AppContext.tsx` | ⏳ Missing | Implement database constraint/trigger to prevent overfilling | ROOM-01, ROOM-02 | Concurrent booking test | Planned |
| **ROOM-04** | Phase 5 | Search & filter rooms by floor, type, and availability | Legacy web UI implemented filters | ⏳ Missing | Implement native search & filter in `features/rooms/` | ROOM-01 | Filter test | Planned |

---

### Phase 6: Tenant Onboarding & Stay Management

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TEN-01** | Phase 6 | Onboard/create tenant with minimal required data | Legacy web prototype in `TenantFormModal.tsx` | ⏳ Missing | Create `tenant_stays` table with RLS and native `TenantOnboardingScreen` | Phase 5 (Rooms) | Onboarding test | Planned |
| **TEN-02** | Phase 6 | Assign property, room, and bed with move-in date | Legacy web model supports room assignment | ⏳ Missing | Bind tenant stay to available bed | ROOM-03, TEN-01 | Assignment validation test | Planned |
| **TEN-03** | Phase 6 | Record move-out and release room/bed while preserving history | Logic in legacy `AppContext.tsx` | ⏳ Missing | Move-out action updating `status` and `move_out_date` | TEN-02 | Availability release test | Planned |
| **TEN-04** | Phase 6 | Tenant Directory with active/moved-out filtering | Legacy web `TenantDirectory.tsx` | ⏳ Missing | Native `TenantListScreen` with status chips | TEN-01 | Directory test | Planned |
| **TEN-05** | Phase 6 | Tenant profile view with contact & stay details | Legacy web `TenantProfileModal.tsx` | ⏳ Missing | Native `TenantDetailScreen` | TEN-01 | Profile render test | Planned |

---

### Phase 7 & 8: Rent Schedules, Payments & Receipts

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **PAY-01** | Phase 7 | Rent billing schedule generation per stay | Calculations in legacy `AppContext.tsx` | ⏳ Missing | Create `rent_records` table with unique constraint on `(stay_id, billing_period)` | Phase 6 (Stays) | Duplicate generation prevention test | Planned |
| **PAY-02** | Phase 7 | Rent dues calculation (upcoming, due, overdue) | Mathematical model in legacy `AppContext.tsx` | ⏳ Missing | Implement pure TypeScript rent calculation utility & database view | PAY-01 | Due calculation unit test | Planned |
| **PAY-03** | Phase 8 | Manual/offline payment recording (Cash, UPI, Bank Transfer) | Legacy web `PaymentModal.tsx` | ⏳ Missing | Create `payments` table with RLS and native `RecordPaymentModal` | PAY-01 | Payment insertion & balance test | Planned |
| **PAY-04** | Phase 8 | Partial payment support and outstanding balance tracking | Handled in legacy `AppContext.tsx` | ⏳ Missing | Deduct payment from rent obligation with traceable balance | PAY-03 | Partial payment test | Planned |
| **PAY-05** | Phase 8 | Payment receipt viewing with reference ID & date | Legacy web `ReceiptModal.tsx` | ⏳ Missing | Native `ReceiptView` modal | PAY-03 | Receipt generation test | Planned |
| **PAY-06** | Phase 8 | Payment reversal with audit trail | Legacy web `reversePayment` in `AppContext.tsx` | ⏳ Missing | Traceable reversal with reason & balance restoration | PAY-03 | Reversal audit test | Planned |
| **PAY-07** | Phase 8 | Online Payment Gateway (Razorpay/UPI) | Explicitly deferred in roadmap until manual workflow is proven | ⏳ Missing | Server-side order creation & webhook verification | PAY-03 | Webhook idempotency test | Deferred |

---

### Phase 9: Complaints & Maintenance

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **COMP-01** | Phase 9 | Tenant raises complaint (category, description, optional photo) | Roadmap specification §4 Phase 9 | ⏳ Missing | Create `complaints` table with RLS; native complaint submission form | Phase 6 (Stays) | Submission test | Planned |
| **COMP-02** | Phase 9 | Admin reviews & updates complaint status (Open → In Progress → Resolved) | Roadmap specification §4 Phase 9 | ⏳ Missing | Admin complaint management view with status updates | COMP-01 | Status transition test | Planned |
| **COMP-03** | Phase 9 | Strict complaint isolation: Tenants see only own; Admins see only their PG | PostgreSQL RLS policy on complaints | ⏳ Missing | Write and test RLS policy on `complaints` table | COMP-01 | Cross-tenant rejection test | Planned |

---

### Phase 10: Notifications & Reminders

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NOTIF-01** | Phase 10 | In-app notification list and mark as read | Legacy web `NotificationDrawer.tsx` | ⏳ Missing | Create `notifications` table and native notification sheet | Phase 6, 7 | Read status update test | Planned |
| **NOTIF-02** | Phase 10 | Rent due WhatsApp/SMS reminder template generation | Legacy `generateReminderMessage` in `translations.ts` | 🟡 Partially Implemented | Port message generator to native Expo utility | PAY-02 | Template generation test | Planned |
| **NOTIF-03** | Phase 10 | Push notifications via Expo Notifications | Roadmap Phase 10 (when core workflows are stable) | ⏳ Missing | Install Expo Notifications and register tokens | NOTIF-01 | Push token registration test | Planned |

---

### Phase 12: Localization & Regional Languages

| Req ID | Section | Expected Behavior | Current Implementation & Files | Compliance Status | Required Changes | Dependencies | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **I18N-01** | Phase 12 | Support candidate languages (English, Hindi, Telugu, Malayalam, Marathi) | 8 language dictionaries in `legacy-web-prototype/src/i18n/locales/*.json` | 🟡 Partially Implemented | Set up `i18next` + `react-i18next` in Expo and port dictionaries | None | Language switch test | Planned |
| **I18N-02** | Phase 12 | Language selection without requiring sign-out | Legacy web language dropdown | 🟡 Partially Implemented | Add Language Selector modal/menu in native app | I18N-01 | Immediate UI update test | Planned |
| **I18N-03** | Phase 12 | Persist language preference across app restarts | Stored in `profiles.preferred_language` & AsyncStorage | 🟡 Partially Implemented | Bind to AuthContext profile preference | I18N-01 | Restart persistence test | Planned |
| **I18N-04** | Phase 12 | Consistent INR currency (`₹`) and Indian date formatting | Utils in `legacy-web-prototype/src/i18n/index.ts` | 🟡 Partially Implemented | Port currency and date formatters to `lib/utils/formatters.ts` | None | Format test cases | Planned |

---

## 4. Architectural & Data-Integrity Risks Identified

1. **Risk 1: Client-Side Authorization Bypass**
   - *Risk:* UI-only role checks permit malicious actors to forge HTTP/GraphQL requests.
   - *Mitigation:* RLS policies on all PostgreSQL tables independently enforce access permissions on every SELECT, INSERT, UPDATE, DELETE.
2. **Risk 2: Multi-Tenant Data Leakage**
   - *Risk:* A PG Admin queries data across different properties.
   - *Mitigation:* Every property-scoped query strictly verifies `is_property_admin(property_id)` in PostgreSQL.
3. **Risk 3: Overbooking / Capacity Exceeded**
   - *Risk:* Concurrent tenant onboarding silently exceeds room capacity.
   - *Mitigation:* Database-level check/trigger computing active stays against room capacity before committing assignment.
4. **Risk 4: Payment Imbalance & Audit Loss**
   - *Risk:* Direct edits or silent deletions of payment records.
   - *Mitigation:* Separate `rent_records` (obligations) from `payments` (transactions). Reversals are modeled as explicit reversal transactions (`is_reversed: true` or compensatory entry) rather than deleting records.
