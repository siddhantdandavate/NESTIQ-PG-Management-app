# NESTIQ --- Product Requirements & Development Roadmap

**Project:** NESTIQ PG Management App\
**Platform:** Android-first mobile app; iOS may be supported later\
**Frontend:** React Native + Expo + TypeScript\
**Backend / Database:** Supabase (PostgreSQL, Auth, Row Level Security)\
**Repository:** `NESTIQ-PG-Management-app`\
**Primary development branches:** `main`, `ruchita`, `siddhant`\
**Document status:** Initial working specification --- update as
decisions are confirmed

------------------------------------------------------------------------

## 1. Product vision

NESTIQ is a mobile-first PG (paying guest) management application that
replaces manual notebooks and scattered messages with a single system
for managing properties, rooms, tenants, rent, payments, complaints and
reminders.

The app has three user roles:

1.  **Super Admin** --- manages the NESTIQ platform and its PG-admin
    accounts.
2.  **PG Admin** --- manages only the PG/property or properties assigned
    to them.
3.  **Tenant** --- views their own stay, room, rent, payment, complaint
    and notification information.

The interfaces should be role-specific, while sharing common components
such as buttons, form fields, loading indicators, error messages and
language selection.

### Product principles

-   Build in small, testable increments.
-   Secure data access in the database, not only by hiding buttons in
    the UI.
-   Never let one PG's admin or tenant access another PG's private data.
-   Do not store Aadhaar or other sensitive identity-document copies
    unless there is a clear legal/product need and a secure handling
    plan.
-   Start with rent tracking and payment records; add a payment gateway
    only after the basic workflow is reliable.
-   Add multilingual infrastructure early, then translate each feature
    as it is built.
-   Keep the app usable on common Android phones and slower networks.
-   Treat the app as a real product: validation, empty states, errors,
    security tests and documentation are part of each feature.

------------------------------------------------------------------------

## 2. Technology and architecture

### 2.1 Initial stack

-   **React Native + Expo + TypeScript:** mobile application.
-   **Supabase Auth:** sign-up, sign-in, sessions and password recovery.
-   **Supabase PostgreSQL:** application data.
-   **Supabase Row Level Security (RLS):** database access control.
-   **Supabase Edge Functions or another trusted server-side
    component:** privileged operations, payment verification, scheduled
    tasks and secrets that must not be exposed to the mobile app.
-   **Expo Notifications:** push notification integration when the core
    workflows are stable.
-   **i18next + react-i18next:** suggested localization library.
-   **GitHub:** source control, pull requests, issue tracking and
    project documentation.

The stack can evolve, but avoid adding unnecessary services before the
initial workflows work.

### 2.2 High-level request flow

1.  A user opens NESTIQ.
2.  The app restores/checks the Supabase Auth session.
3.  The app fetches the user's profile and permitted role/membership
    information.
4.  The app shows the appropriate navigation and dashboard.
5.  The app reads/writes data through Supabase using the signed-in
    user's session.
6.  PostgreSQL RLS policies enforce which rows the user may access.
7.  Privileged tasks are handled by trusted server-side code, not by
    putting a secret key in the app.

**Important:** Role-based navigation is a user-experience feature, not
the security boundary. Database policies must independently enforce
permissions.

### 2.3 Suggested folder structure

The current project was created from Expo's `blank-typescript` template,
so it starts with `App.tsx`. Keep that entry point until navigation is
deliberately configured. Do not change to Expo Router merely by creating
an `app/` directory; install and configure the router properly if/when
the team chooses it.

``` text
NESTIQ-PG-Management-app/
├── App.tsx
├── assets/
│   ├── images/
│   └── icons/
├── components/
│   ├── common/
│   ├── forms/
│   └── ui/
├── features/
│   ├── auth/
│   ├── superadmin/
│   ├── admin/
│   ├── tenant/
│   ├── properties/
│   ├── rooms/
│   ├── tenants/
│   ├── rent/
│   ├── payments/
│   ├── complaints/
│   ├── notifications/
│   └── settings/
├── hooks/
├── lib/
│   ├── supabase.ts
│   └── utils/
├── locales/
│   ├── en/
│   ├── hi/
│   ├── te/
│   ├── ml/
│   └── mr/
├── types/
├── .env                 # local only; never commit secrets
├── .gitignore
├── app.json
├── package.json
└── tsconfig.json
```

Create folders when the corresponding feature starts; an empty folder
structure is not itself a milestone.

------------------------------------------------------------------------

## 3. Roles and permissions

### 3.1 Super Admin

Platform-level responsibilities:

-   Secure access to the Super Admin dashboard.
-   View platform-level counts and status summaries.
-   Create/invite, activate, suspend or deactivate PG Admin accounts.
-   View and manage PG/property records where platform administration
    requires it.
-   View high-level platform health and support issues.
-   Manage global configuration and supported languages if needed.
-   Audit privileged actions.

A Super Admin should not be created through public self-registration.
Provision the initial Super Admin through a trusted, controlled setup
process.

### 3.2 PG Admin

Property-level responsibilities:

-   Access only assigned PG/property records.
-   Create and update property details.
-   Manage rooms, beds and occupancy.
-   Add/invite tenants and assign rooms/beds.
-   Record move-in/move-out and tenancy status.
-   Configure rent amount and due dates.
-   View rent dues and payment history for their own property.
-   Manage complaints and update their status.
-   Send or trigger permitted reminders.
-   View property-level reports.

### 3.3 Tenant

Tenant responsibilities:

-   Sign in securely and manage permitted profile fields.
-   View their own PG/property, room/bed and stay details.
-   View their rent schedule, outstanding dues and payment history.
-   View verified payment status and receipts/references.
-   Raise complaints and track their own complaint status.
-   Receive and read notifications.
-   Choose a preferred language.
-   Update permitted contact details and sign out.

### 3.4 Permission rules

-   A user can have a profile, but access to a PG is determined by an
    explicit role/membership relationship.
-   An Admin must not be able to query another Admin's PG data.
-   A Tenant must not be able to read another tenant's private records.
-   A Tenant must not assign themselves a room, change their role or
    mark rent as paid.
-   Public sign-up must never grant Super Admin or PG Admin privileges
    automatically.
-   Sensitive or privileged actions must be enforced by database RLS
    and/or trusted server-side code.
-   Test permissions with different users, not only with the account
    that created the records.

------------------------------------------------------------------------

## 4. Feature roadmap --- implementation order

Work in the following sequence. A later phase can be designed while an
earlier one is being implemented, but avoid building production-like
dependent features before their foundations are secure.

## Phase 0 --- Repository and development foundation

### Features/tasks

-   [ ] Confirm the app starts on a real Android device using Expo Go.
-   [ ] Keep the existing Expo/TypeScript setup and commit the baseline.
-   [ ] Confirm `.gitignore` excludes `node_modules`, `.env` and other
    local secrets/build output.
-   [ ] Confirm no Supabase service-role key, password or private
    credential is committed.
-   [ ] Create and push `ruchita` and `siddhant` branches from `main`.
-   [ ] Agree on naming conventions, formatting and pull-request review
    rules.
-   [ ] Create GitHub Issues or a Projects board for tasks.
-   [ ] Add this document to the repository,
    e.g. `docs/PRODUCT-ROADMAP.md`.

### Completion criteria

-   App starts from a clean clone after installing dependencies.
-   `main` contains the working baseline.
-   Both developers can fetch their own branch and push a test change.
-   No secret credentials are tracked in Git.

## Phase 1 --- Supabase connection and secure data foundation

### Features/tasks

-   [ ] Create a Supabase project.
-   [ ] Record project URL and publishable/anon key in local environment
    configuration.
-   [ ] Add local environment file to `.gitignore`.
-   [ ] Install/configure the Supabase JavaScript client for Expo.
-   [ ] Configure session storage using an Expo-compatible
    secure/persistent storage approach recommended for the installed
    SDK.
-   [ ] Add a small connection test and handle offline/error states.
-   [ ] Decide how schema changes are tracked (prefer versioned SQL
    migrations for a team project).
-   [ ] Establish RLS as a requirement for every exposed table.
-   [ ] Create the initial `profiles` table linked to Supabase Auth user
    IDs.
-   [ ] Create role/membership tables and their policies in a controlled
    sequence.
-   [ ] Test data access with separate test accounts and roles.

### Suggested initial data model

-   `profiles`: `id` matching the Auth user ID, display name, phone (if
    needed), preferred language, timestamps.
-   `user_roles`: global platform roles such as `super_admin`; only
    trusted processes can assign privileged roles.
-   `pg_properties`: property identity and basic address/details.
-   `pg_memberships`: links a user to a PG/property with a scoped role
    such as `admin` or `tenant`.
-   Additional feature tables are introduced in later phases.

Do not put every table into production at once. Create tables and
policies when their dependencies and workflows are understood.

### Completion criteria

-   App connects to Supabase.
-   Database schema is versioned/documented.
-   RLS is enabled and verified for tables that expose user/property
    data.
-   No secret service-role key exists in the mobile app.

## Phase 2 --- Authentication, profile and role-specific navigation

### Features/tasks

-   [ ] Sign-up/invitation flow appropriate to the role.
-   [ ] Email/password sign-in.
-   [ ] Input validation and user-friendly error messages.
-   [ ] Loading states and duplicate-submit prevention.
-   [ ] Session restoration on app restart.
-   [ ] Logout.
-   [ ] Forgot-password/reset-password flow.
-   [ ] Create/fetch the user's profile after authentication.
-   [ ] Load role and property membership securely.
-   [ ] Add navigation guards for signed-out and signed-in users.
-   [ ] Create separate Super Admin, Admin and Tenant dashboard entry
    points.
-   [ ] Show a safe loading/error state if a profile or role is missing.
-   [ ] Prevent role changes from ordinary profile-edit screens.
-   [ ] Test each role using separate accounts.
-   [ ] Test direct attempts to access another role's data.

### Important onboarding decision

-   Initial Super Admin: provisioned through a trusted setup, not public
    sign-up.
-   PG Admin: created/invited by Super Admin or through an explicitly
    approved onboarding flow.
-   Tenant: invited/registered by an Admin or through a verified
    invitation flow.
-   Do not assume that hiding a screen prevents unauthorized database
    access.

### Completion criteria

-   Signed-out users see the authentication flow.
-   Authenticated users are routed to the correct role-specific
    experience.
-   Missing/invalid role state is handled safely.
-   Database access tests confirm the role and property boundaries.

## Phase 3 --- Super Admin platform management

### Features/tasks

-   [ ] Super Admin dashboard shell.
-   [ ] Platform summary counts (as the data becomes available).
-   [ ] Admin account list and detail view.
-   [ ] Invite/create PG Admin flow.
-   [ ] Activate/suspend/deactivate admin access through a trusted
    operation.
-   [ ] Property overview and support view.
-   [ ] Basic audit trail for privileged changes.
-   [ ] Search/filter/pagination if the list becomes large.
-   [ ] Confirmation dialogs for destructive or privileged actions.
-   [ ] Empty, loading, failure and success states.

### Completion criteria

-   Only Super Admin can perform platform-level actions.
-   Privileged changes are checked on the server/database side.
-   Admins cannot grant themselves Super Admin privileges.

## Phase 4 --- PG property management

### Features/tasks

-   [ ] Create a PG/property.
-   [ ] Edit name, address, contact and basic property details.
-   [ ] View property details.
-   [ ] Associate authorized Admin users with the property.
-   [ ] Support more than one property per Admin if the product requires
    it.
-   [ ] Property status (active/inactive).
-   [ ] Validate required fields.
-   [ ] Enforce property-level access policies.

### Suggested table

`pg_properties`: ID, name, address fields, contact details if needed,
status, created/updated timestamps.

### Completion criteria

-   Admin can manage only assigned properties.
-   Property records remain correctly linked to memberships and later
    room/tenant records.

## Phase 5 --- Room and bed management

### Features/tasks

-   [ ] Add/edit/view a room.
-   [ ] Room number/name, floor, room type and amenities.
-   [ ] Capacity and monthly rent configuration.
-   [ ] Room status (active/inactive or maintenance).
-   [ ] Optional bed-level records for shared rooms.
-   [ ] Occupied/available count.
-   [ ] Prevent occupancy from exceeding capacity.
-   [ ] Prevent duplicate room identifiers within the same property
    where required.
-   [ ] Search/filter rooms by status, type or availability.
-   [ ] Room details page showing current occupancy.
-   [ ] Handle room/bed changes for existing tenants safely.

### Suggested tables

-   `rooms`: property ID, room identifier, capacity, rent configuration,
    status and timestamps.
-   `beds` (optional but recommended for individual bed allocation):
    room ID, bed identifier, status.

### Completion criteria

-   Room counts and availability are based on actual active
    stays/assignments, not manually inconsistent counters.
-   Concurrent assignments cannot silently overfill a room.
-   Admin A cannot read or change Admin B's rooms.

## Phase 6 --- Tenant onboarding and stay management

### Features/tasks

-   [ ] Create/invite tenant.
-   [ ] Capture only necessary tenant information.
-   [ ] Link tenant identity to a profile/membership.
-   [ ] Assign property, room and optional bed.
-   [ ] Record move-in date.
-   [ ] Record agreed rent, deposit and due-date rules.
-   [ ] View tenant list and tenant details.
-   [ ] Search/filter tenants by active/moved-out status.
-   [ ] Update permitted profile/contact information.
-   [ ] Record move-out date and reason if required.
-   [ ] Release the room/bed after a completed move-out.
-   [ ] Maintain tenancy history instead of deleting historical records.
-   [ ] Prevent overlapping active assignments.
-   [ ] Define the process for a tenant changing rooms.
-   [ ] Ensure tenants can access only their own stay and related
    information.

### Suggested table

`tenant_stays`: tenant profile/user ID, property ID, room ID, optional
bed ID, move-in/out dates, agreed rent/deposit, status and timestamps.

### Completion criteria

-   Admin can add a tenant and assign a valid available room/bed.
-   Tenant sees the correct property and room in their app.
-   Move-out updates availability while preserving history.

## Phase 7 --- Rent schedule and dues tracking

### Features/tasks

-   [ ] Define rent billing period and due-date rules.
-   [ ] Configure agreed rent for a tenant/stay.
-   [ ] Generate rent records for each billing period.
-   [ ] View upcoming, due, overdue and paid rent.
-   [ ] Admin dashboard summary of total due and overdue amounts.
-   [ ] Tenant view of their own rent schedule.
-   [ ] Record partial payments if the product requires them.
-   [ ] Handle discounts/adjustments only with a defined audit trail.
-   [ ] Avoid duplicate rent records for the same stay and billing
    period.
-   [ ] Define behavior when rent changes mid-stay.
-   [ ] Keep old rent records stable when future rent settings change.

### Suggested table

`rent_records`: stay ID, billing period, amount due, due date,
status/derived payment state, timestamps. Keep payment transactions
separate from rent obligations.

### Completion criteria

-   Every rent record maps to the correct tenant stay and period.
-   Duplicate billing periods are prevented.
-   Tenant and Admin see consistent dues and payment summaries.

## Phase 8 --- Payment records and online payments

### Features/tasks

-   [ ] Record offline/cash/bank/UPI payments where appropriate.
-   [ ] Store amount, date, method, reference and status.
-   [ ] Show payment history and receipts/reference information.
-   [ ] Reconcile payments against rent records.
-   [ ] Handle partial payment, failed payment and refund states if
    supported.
-   [ ] Add Razorpay or another provider only after the manual tracking
    flow works.
-   [ ] Create payment order using trusted server-side code.
-   [ ] Verify provider signature/status server-side.
-   [ ] Process webhooks safely and idempotently.
-   [ ] Do not mark a payment successful solely because the app received
    a client callback.
-   [ ] Restrict who can view or record payments.
-   [ ] Add audit information for Admin-entered adjustments.

### Suggested table

`payments`: rent record/stay reference, amount, payment method/provider,
provider reference, status, paid timestamp and audit timestamps.

### Completion criteria

-   A payment is marked successful only after trusted verification.
-   Duplicate callbacks do not create duplicate payments.
-   A Tenant can see only their own payment records.

## Phase 9 --- Complaints and maintenance

### Features/tasks

-   [ ] Tenant creates a complaint.
-   [ ] Category (plumbing, electrical, cleaning, internet, other).
-   [ ] Description and optional image attachment.
-   [ ] Submission date and current status.
-   [ ] Admin complaint list and detail view.
-   [ ] Status transitions: Open → In Progress → Resolved; optional
    Closed.
-   [ ] Admin response/resolution notes.
-   [ ] Tenant can track their own complaint.
-   [ ] Optional comments/history of status changes.
-   [ ] Optional priority/assignment to a maintenance person.
-   [ ] Validate attachment size/type and restrict file access.
-   [ ] Notify the relevant user when status changes.

### Suggested tables

-   `complaints`: tenant/stay reference, property ID, category,
    description, status, priority, timestamps.
-   `complaint_updates` (optional): complaint ID, author, update,
    old/new status, timestamp.

### Completion criteria

-   Tenants can create and track their own complaints.
-   Admins can manage complaints only for their property.
-   Status changes and notifications stay consistent.

## Phase 10 --- Notifications and rent reminders

### Features/tasks

-   [ ] In-app notifications list.
-   [ ] Mark notification as read.
-   [ ] Notification preferences where appropriate.
-   [ ] Push token registration and refresh.
-   [ ] Rent due reminder schedule.
-   [ ] Overdue reminder schedule with reasonable limits.
-   [ ] Complaint status notifications.
-   [ ] Tenant onboarding/move-in notifications if needed.
-   [ ] Localize notification title/body.
-   [ ] Handle permission denied, invalid tokens and delivery failures.
-   [ ] Use scheduled server-side tasks/Edge Functions or a suitable
    scheduler.
-   [ ] Avoid duplicate reminders using idempotency/unique event
    records.
-   [ ] Avoid exposing tenant or payment details in sensitive
    lock-screen messages.

### Suggested table

`notifications`: recipient user ID, type, title/body or translation key,
related entity, read timestamp, delivery metadata and creation
timestamp.

### Completion criteria

-   Reminders run even if the tenant does not open the app.
-   Duplicate reminders are controlled.
-   Users receive only notifications intended for them.

## Phase 11 --- Reports and dashboard summaries

### Features/tasks

-   [ ] Admin overview: rooms, occupancy and available beds.
-   [ ] Rent due and overdue summaries.
-   [ ] Payment history summaries.
-   [ ] Tenant active/moved-out counts.
-   [ ] Complaint status counts.
-   [ ] Date filters and property filters.
-   [ ] Export/report download only if needed.
-   [ ] Ensure summaries respect property permissions.
-   [ ] Validate calculations against underlying records.

### Completion criteria

-   Dashboard metrics match the source records.
-   Reports do not leak data across properties or tenants.

## Phase 12 --- Localization and accessibility

Supported language candidates:

-   English (`en`)
-   Hindi (`hi`)
-   Telugu (`te`)
-   Malayalam (`ml`)
-   Marathi (`mr`)

### Features/tasks

-   [ ] Install/configure `i18next` and `react-i18next` or another
    agreed localization library.
-   [ ] Create translation files for each supported language.
-   [ ] Use translation keys rather than hard-coded UI strings.
-   [ ] Add language selection.
-   [ ] Persist the user's preferred language.
-   [ ] Choose a fallback language if a translation is missing.
-   [ ] Translate validation, loading, empty, success and error
    messages.
-   [ ] Translate notification templates.
-   [ ] Format dates, numbers and currency consistently.
-   [ ] Check long strings, font rendering and layouts on Android.
-   [ ] Review translations with fluent speakers; do not rely only on
    machine translation.
-   [ ] Test switching languages without requiring the user to sign out.

### Completion criteria

-   Main user journeys work in every language chosen for release.
-   Switching language updates the interface and persists the
    preference.
-   Text does not overflow important buttons/forms on supported devices.

**Implementation rule:** Add localization infrastructure early in Phase
1 or 2, and translate each screen when that screen is developed. Do not
wait until the very end to replace all hard-coded text.

## Phase 13 --- Testing, security and release

### Features/tasks

-   [ ] Test on multiple Android screen sizes.
-   [ ] Test slow/offline network behavior.
-   [ ] Test session expiry and logout.
-   [ ] Test every role with separate accounts.
-   [ ] Test cross-property and cross-tenant access restrictions.
-   [ ] Test invalid forms, duplicate submissions and server errors.
-   [ ] Test rent calculations and date boundaries.
-   [ ] Test payment success/failure/retry and duplicate webhooks if
    online payments exist.
-   [ ] Test reminder scheduling and duplicate prevention.
-   [ ] Test every supported language.
-   [ ] Remove debug logs that expose personal data.
-   [ ] Review permissions, data retention and privacy policy.
-   [ ] Create app icon, splash screen, versioning and release build
    configuration.
-   [ ] Prepare Play Store listing, screenshots, privacy/data-safety
    disclosures and testing track.
-   [ ] Test release build before production release.
-   [ ] Document known limitations and support/contact process.

### Completion criteria

-   Critical flows work on a release build, not only Expo Go.
-   Security checks pass for all roles.
-   Privacy disclosures accurately reflect collected and shared data.
-   No known critical data-access or payment-integrity issues remain.

------------------------------------------------------------------------

## 5. Recommended screen map

### Shared / unauthenticated

-   Splash/loading screen.
-   Login.
-   Sign-up or invitation acceptance (depending on onboarding policy).
-   Forgot/reset password.
-   Language selector.
-   Session-expired/error screen.

### Super Admin

-   Super Admin dashboard.
-   Admin accounts list.
-   Admin detail/invitation screen.
-   Property overview.
-   Support/issue overview if needed.
-   Platform settings and audit view if needed.

### PG Admin

-   Admin dashboard.
-   Property list/details.
-   Room and bed list/details/forms.
-   Tenant list/details/forms.
-   Assign room/bed.
-   Move-in/move-out workflow.
-   Rent dues.
-   Payment history.
-   Complaint list/details/status update.
-   Notifications.
-   Property reports.
-   Settings and language.

### Tenant

-   Tenant dashboard.
-   My PG/property and room/bed.
-   My stay details.
-   Rent due and history.
-   Payment history/receipt.
-   Raise complaint.
-   My complaints/status.
-   Notifications.
-   Profile and language settings.

Do not build every screen before the backend exists. Build one user
journey end-to-end, verify it, then move to the next.

------------------------------------------------------------------------

## 6. GitHub collaboration workflow

### Branches

-   `main`: stable, reviewed code.
-   `ruchita`: Ruchita's integration/development branch.
-   `siddhant`: Siddhant's integration/development branch.
-   Optional feature branches: `feature/auth`,
    `feature/room-management`, `feature/tenant-onboarding`, etc.

Personal branches are acceptable for the team's starting workflow. For
larger changes, short-lived feature branches reduce conflicts.

### Workflow for each feature

1.  Check the issue and acceptance criteria.
2.  Pull the latest version of the branch being used.
3.  Create or switch to the correct development/feature branch.
4.  Implement the feature in small commits.
5.  Test locally, including failure and permission cases.
6.  Commit with a clear message.
7.  Push to GitHub.
8.  Open a Pull Request with a summary, screenshots if relevant, test
    steps and any database migration/policy changes.
9.  The other developer reviews the code and tests.
10. Merge only after checks pass.
11. Pull the updated `main`/integration branch before starting the next
    dependent feature.

### Example commands

``` powershell
# Update your personal branch
git switch ruchita
git pull origin ruchita

# After implementing and testing a feature
git add .
git commit -m "Add profile and role loading"
git push origin ruchita
```

Then open a Pull Request on GitHub. For Siddhant, use `siddhant` in
place of `ruchita`.

### Database changes are shared code too

-   Store schema changes as versioned SQL migrations in the repository,
    e.g. `supabase/migrations/`.
-   Agree who owns each migration and policy change.
-   Do not make undocumented manual database changes that only exist in
    one developer's Supabase dashboard.
-   Never commit service-role keys, passwords or real tenant data.
-   Use test accounts and synthetic data during development.
-   Review database policies with the same care as application code.

### Pull Request checklist

-   [ ] The feature matches its issue/acceptance criteria.
-   [ ] No unrelated changes are included.
-   [ ] App builds and the changed flow works.
-   [ ] Loading, empty, success and error states are handled.
-   [ ] Authorization is enforced in the database/server.
-   [ ] Database migration/policy changes are included and documented.
-   [ ] No secrets or private tenant information are committed.
-   [ ] Reviewer has checked the diff and test instructions.

------------------------------------------------------------------------

## 7. Feature dependencies --- what must come first?

  -----------------------------------------------------------------------
  Feature                             Must be in place first
  ----------------------------------- -----------------------------------
  Role-specific dashboards            Auth session, profile and trusted
                                      role lookup

  Super Admin admin-management        Secure Super Admin provisioning and
  actions                             privileged server/database controls

  PG property management              Auth, role/membership model and RLS

  Rooms and beds                      Property model and property-level
                                      permissions

  Tenant assignment                   Profiles, properties, rooms/beds
                                      and occupancy rules

  Rent schedules                      Tenant stays and agreed rent rules

  Payment records                     Rent obligations and payment state
                                      model

  Online payment gateway              Payment records plus trusted
                                      server-side
                                      order/verification/webhook handling

  Complaints                          Tenant stays/property membership
                                      and complaint RLS

  Scheduled reminders                 Due-date model, notification
                                      records and server-side scheduler

  Reports                             Reliable underlying room, stay,
                                      rent, payment and complaint data

  Language selection                  Localization infrastructure and
                                      persisted user preference

  Play Store release                  Release build, privacy disclosures,
                                      testing and production
                                      configuration
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 8. Can we build separate interfaces for Super Admin, Admin and Tenant gradually?

**Yes. This is a standard and sensible way to build NESTIQ.** You do not
need to build all three dashboards at the same time.

Recommended sequence:

1.  Connect the app to Supabase.
2.  Implement authentication and session handling.
3.  Create the profile/role model and secure database policies.
4.  Implement a role-loading step after login.
5.  Route the user to the correct dashboard based on the trusted
    role/membership data.
6.  Build and test one dashboard at a time.
7.  Connect each dashboard to its relevant feature APIs/queries.
8.  Add deeper features in dependency order.

Conceptually:

``` text
Open NESTIQ
    |
Check authentication session
    |
Signed in?
  /       \
No         Yes
|           |
Login     Load profile + permitted role
              |
       +------+------+ 
       |      |      |
   Super    PG     Tenant
   Admin   Admin   Dashboard
```

The UI can display different screens, menus and actions per role. But a
user must not gain permissions merely by editing a client-side value.
Supabase RLS and trusted server-side operations must enforce the same
permissions.

### Practical implementation advice

Start with one small end-to-end milestone:

**Milestone 1: Secure login and role-based entry**

-   Supabase connection.
-   Authentication.
-   Profile lookup.
-   Trusted role/membership lookup.
-   Separate dashboard placeholders for all three roles.
-   RLS tests with separate accounts.

Once that works, implement Super Admin onboarding, then property/room
management, then tenant onboarding. You can create the dashboard
placeholders early without implementing every dashboard feature.

------------------------------------------------------------------------

## 9. MVP versus later improvements

To avoid making the first release too large, prioritize a working MVP.

### MVP --- first usable release

-   Authentication and secure role-specific access.
-   Super Admin setup and Admin onboarding.
-   PG/property management.
-   Rooms/beds and availability.
-   Tenant onboarding and room assignment.
-   Rent schedule, dues and payment record tracking.
-   Complaints and status tracking.
-   In-app notifications and basic due reminders.
-   English plus the first selected regional languages.
-   Security, basic reports and release testing.

### Later releases

-   Online payment gateway and automated reconciliation.
-   Advanced reporting/export.
-   More notification preferences and automated workflows.
-   Additional languages and reviewed translations.
-   Maintenance staff roles, if needed.
-   Advanced audit history and platform analytics.
-   Additional integrations based on actual PG owner feedback.

Do not implement advanced features just because they are possible.
Validate the basic workflows with a PG owner/manager and a few tenants
first.

------------------------------------------------------------------------

## 10. Definition of done for every feature

A feature is not complete merely because its screen appears. Mark it
complete only when:

1.  The UI and navigation work.
2.  Data is persisted and fetched correctly.
3.  Input validation and error handling are implemented.
4.  Loading, empty and success states are handled.
5.  Role and property permissions are tested.
6.  The feature has been tested with at least one normal case and
    relevant failure cases.
7.  Database migrations and RLS policies are included if needed.
8.  No secrets or real tenant data are committed.
9.  The code is reviewed and merged through a Pull Request.
10. The README or relevant documentation is updated.

------------------------------------------------------------------------

## 11. Immediate next steps

Follow this exact order from the current Expo starter project:

1.  Verify the starter app and Git branches are stable.
2.  Create the Supabase project and configure local environment
    variables.
3.  Connect the React Native app to Supabase.
4.  Create and test `profiles`.
5.  Implement authentication and session handling.
6.  Define roles/memberships and secure RLS policies.
7.  Add role-based navigation and dashboard placeholders.
8.  Test Super Admin, Admin and Tenant access using separate test
    accounts.
9.  Begin property management.
10. Add rooms/beds.
11. Add tenant onboarding and assignment.
12. Add rent and payment tracking.
13. Add complaints and notifications.
14. Finish localization for the chosen release languages.
15. Complete security, device and release testing.

**First development target:** Supabase connection + secure
authentication + profile/role loading + separate role dashboards. Do not
start room, tenant or payment workflows until this foundation is
verified.

------------------------------------------------------------------------

## 12. Decisions to confirm with the team

Record these decisions in GitHub Issues or this document as they become
clear:

-   [ ] Can one Admin manage multiple PG properties?
-   [ ] Does each room need individual bed-level allocation?
-   [ ] Who can create/invite Admins: only Super Admin, or also an
    approved self-registration/onboarding flow?
-   [ ] Will tenants use email/password, phone-based login, invitation
    links, or a combination?
-   [ ] Which languages are required for the first release?
-   [ ] Will the first release record offline payments only, or include
    online payments?
-   [ ] What is the rent due-date policy and reminder schedule?
-   [ ] Are deposits, partial payments, refunds and room changes
    required in MVP?
-   [ ] Which tenant fields are genuinely necessary?
-   [ ] Who will operate and pay for production hosting/services?
-   [ ] What is the minimum Android version/device range to support?

Do not block initial setup on every answer. Confirm each decision before
implementing the feature it affects.

------------------------------------------------------------------------

**End of document --- NESTIQ Product Requirements & Development
Roadmap**
