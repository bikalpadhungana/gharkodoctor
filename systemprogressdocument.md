# GharkoDoctor — System Progress Document

**Pattern:** Living Log of Development Progress  
**Last Updated:** August 13, 2026  
**Status:** Beta Launch Ready — Desktop Responsive Version, Audited, SEO-Optimized, Map Picker, Logo Branding, Coverage Radius, Medical Visit Reports, Super Admin Audit Log System, Comprehensive Bilingual Language Engine, Backend Dist Directory & Standalone Server Deployment Implemented  

---

## 1. System Overview & Architecture Implemented

- **Stack:** Full MERN (MongoDB, Express.js, React + Vite, Node.js).
- **Design Principles:** Mobile-first PWA, 3G-optimized, budget Android friendly, Nepali-first UI copy (English secondary), trust-forward badges, emergency helpline integration, **Official Standalone House-Stethoscope Icon Mark** (`/icon.png`), **Thematic Icon System** (`var(--primary)`, `var(--secondary)`, `var(--accent)`), **Full Reactive Bilingual Engine** (instant switching between Nepali & English), **Desktop & Mobile Responsive Design**.
- **Desktop Layout ([HomePage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/HomePage.jsx)):** 2-column desktop hero grid with 24/7 Kathmandu Valley coverage widget, 4-column desktop trust highlights grid, multi-column services grid (`grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`), and wide desktop call dispatch banner.
- **Standalone Backend Dist & SPA Serving:** `backend/dist` folder created containing compiled frontend assets. Express `server.js` checks `path.join(__dirname, 'dist')` first (falling back to `../frontend/dist`) and handles SPA wildcard route navigation (`app.get('*')`) for single-directory server deployments on Port `5004`.

---

## 2. Backend Implementation (`/backend`)

### Models (`/models`)
- `User.js`: Patient/family accounts (name, phone, password, ward, municipality, address, preferred language, `profileImage` Data URI, flexible phone regex).
- `Provider.js`: Health professionals (nurse, paramedic, doctor) with verification status (`pending | verified | rejected`), citizenship ID, council license number, community reference, service area, `serviceRadiusKm` (3km, 5km, 10km, 15km, 25km), location coordinates, `profileImage` Data URI, availability schedule, rating, completed visits count, and auto-flag for new providers.
- `Admin.js`: Admin, superadmin (`role: 'superadmin'`), and dispatcher credentials.
- `AuditLog.js`: System audit log recording administrative actions (`PAYMENT_VERIFIED`, `ROLE_UPDATED`, `PROVIDER_VERIFIED`, `BOOKING_DISPATCHED`), performedBy metadata, target objects, timestamps, and IP addresses.
- `ServiceType.js`: Schema Registry pattern — supports dynamic addition of new service types without backend code changes.
- `Booking.js`: Core booking state machine (`requested → confirmed → en_route → completed → cancelled`) with full status history auditing, payment verification status (`pending | paid | refunded`), and **`visitReport` (vital signs, completed task checklist, medical summary notes, attached documents & camera photos)**.
- `Review.js`: Patient reviews & ratings with automatic provider rating aggregation.

### API Surface & Controllers (`/controllers` & `/routes` & `server.js`)
- `dist/`: Populated inside `backend/` containing static assets, `index.html`, `manifest.json`, `robots.txt`, `sitemap.xml`, `logo.png`, `icon.png`.
- `server.js`: Detects `backend/dist` directly and serves static assets and SPA catch-all route `app.get('*')`.
- `config/db.js`: MONGODB_URI connection handling with fallback to local `mongodb://127.0.0.1:27017/gharkodoctor`.
- `/api/auth`: Patient registration, provider registration (with `serviceRadiusKm`), unified login (supports Patients, Providers, and Admins via phone or email), admin login, profile (`/me`), patient profile update (`PATCH /api/auth/profile`).
- `/api/providers`: Available verified providers by ward/service, public profile, provider self-service profile update (`PATCH /api/providers/profile`) & availability/radius update (`PATCH /api/providers/availability`).
- `/api/bookings`: Create booking, patient's bookings, provider's assigned visits, state machine status updates (with cancellation support & `visitReport` submission), dispatch provider assignment.
- `/api/admin`: Stats dashboard, pending provider verification workflow (approve/reject), booking management, phone-in booking creation (`POST /api/admin/bookings/phone-in`), payment verification (`PATCH /api/admin/bookings/:id/payment`), user role management (`PATCH /api/admin/users/:id/role`), audit log stream (`GET /api/admin/audit-logs`), service type CRUD.
- `/api/reviews`: Review creation for completed visits and provider rating lookup.

---

## 3. Frontend Implementation & Features (`/frontend`)

- **Desktop Version for Home Page ([HomePage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/HomePage.jsx)):**
  - **Desktop Hero Grid (`.hero-desktop-grid`):** 2-column layout pairing headline & booking CTAs on the left with an interactive Kathmandu Valley Coverage Showcase Card on the right.
  - **Trust Highlights Grid (`.trust-desktop-grid`):** 4-column desktop layout highlighting 100% verified staff, cash/eSewa payment, quick dispatch, and valley coverage.
  - **Multi-Column Services Grid (`.services-desktop-grid`):** Responsive multi-column layout for service cards on desktop.
  - **Call Dispatch Banner (`.cta-desktop-card`):** 2-column wide desktop banner.
- **Bilingual Engine Audit & Fix:**
  - Audited [AdminDashboardPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/AdminDashboardPage.jsx), [BookingDetailPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/BookingDetailPage.jsx), and [BookVisitPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/BookVisitPage.jsx).
  - All tab titles, headers, labels, placeholders, card statistics, action buttons, and status indicators react dynamically to the header language toggle (नेपाली / English).
- **Service Provider Profile Image Upload Fix:**
  - Added `profileImage` payload propagation in [ProviderProfilePage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/ProviderProfilePage.jsx).
- **Super Admin Control Center ([AdminDashboardPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/AdminDashboardPage.jsx)):**
  - **Payment Verification:** Super admins can verify payment status (`pending` ↔ `paid` / `refunded`) for each visit booking.
  - **User & Admin Role Management:** Super admins can make existing users/providers an `admin` or `superadmin` or set dispatchers.
  - **Audit & System Log Stream:** Live view of administrative action traces, payment verification timestamps, and system events.
  - **Medical Visit Report & Document Inspection:** Super admins can inspect full booking details including vital signs, task checklist photos, and uploaded lab/prescription files.

---

## 4. Verification & Testing

- **Syntax & Directory Check:** `backend/dist` created and verified; `node -c server.js` passed with zero errors.
- **Database Seed:** Executed `npm run seed` — Super Admin account created (`superadmin@gharkodoctor.com` / `admin123456`).
- **Frontend Production Build:** Executed `npm run build` — compiled cleanly into `frontend/dist/` and copied to `backend/dist/`.
- **Server Static Serving:** Express server serves `backend/dist` static assets and SPA client-side routing fallback `app.get('*')`.
