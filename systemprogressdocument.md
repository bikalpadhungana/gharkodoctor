# GharkoDoctor — System Progress Document

**Pattern:** Living Log of Development Progress  
**Last Updated:** August 13, 2026  
**Status:** Beta Launch Ready — World-Class System Home Page UI, Desktop & Mobile Viewports, Audited, SEO-Optimized, Map Picker, Logo Branding, Coverage Radius, Medical Visit Reports, Super Admin Audit Log System, Comprehensive Bilingual Language Engine, Backend Dist Directory & Standalone Server Deployment Implemented  

---

## 1. System Overview & Architecture Implemented

- **Stack:** Full MERN (MongoDB, Express.js, React + Vite, Node.js).
- **Design Principles:** Mobile PWA & WebView friendly, desktop wide layout (`1200px` max-width), 3G-optimized, budget Android friendly, Nepali-first UI copy (English secondary), trust-forward badges, emergency helpline integration, **Official Standalone House-Stethoscope Icon Mark** (`/icon.png`), **Thematic Icon System** (`var(--primary)`, `var(--secondary)`, `var(--accent)`), **Full Reactive Bilingual Engine** (instant switching between Nepali & English).
- **Desktop & Mobile UI Enhancements ([HomePage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/HomePage.jsx) & [Navbar.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/components/Navbar.jsx)):**
  - **Desktop Navigation Bar:** Header contains brand logo, language switcher, user profile avatar, and desktop navigation links (**गृह/Home**, **सेवाहरू/Services**, **हाम्रा बुकिङहरू/My Bookings**, **स्वास्थ्यकर्मी दर्ता/Join as Provider**, **एडमिन प्यानल/Admin**).
  - **Mobile View & WebView:** Sticky glass navbar, mobile bottom navigation bar (`.bottom-nav`), and floating emergency FAB button ("🚨 आपतकालीन कल").
  - **World-Class Home Page Sections:**
    1. Hero Section with Instant Booking Card Widget (Service + Municipality + Ward selector).
    2. Trust & Verification Highlights (100% Verified Staff, Cash/eSewa Payment, Quick Dispatch, Valley Coverage).
    3. Featured Services Catalog Grid with pricing and direct booking triggers.
    4. "How GharkoDoctor Works" (४ सरल चरणमा घरमै स्वास्थ्य सेवा).
    5. Real Patient Testimonials & 5-Star Reviews Grid from Kathmandu, Lalitpur, and Bhaktapur.
    6. "Join as a Health Provider" Application Banner.
    7. 24/7 Helpline & Call Dispatch Banner.
- **Standalone Backend Dist & SPA Serving:** `backend/dist` directory containing compiled frontend assets. Express `server.js` serves static assets directly from `backend/dist` with SPA wildcard fallback (`app.get('*')`) on Port `5004`.

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

- **World-Class System Home Page ([HomePage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/HomePage.jsx)):**
  - Instant Home Care Booking Card widget, 4-step workflow, trust metrics, verified service catalog, patient testimonials, health provider application banner, and 24/7 hotline dispatch.
- **Desktop & Mobile Navbar Navigation ([Navbar.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/components/Navbar.jsx)):**
  - Added desktop link bar for large screens and seamless mobile view/webview experience.
- **Bilingual Engine Audit & Fix:**
  - Audited [AdminDashboardPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/AdminDashboardPage.jsx), [BookingDetailPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/BookingDetailPage.jsx), and [BookVisitPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/BookVisitPage.jsx).
- **Super Admin Control Center ([AdminDashboardPage.jsx](file:///Users/bikalpadhungana/Documents/bikalpakolab/software/gharkodoctor/frontend/src/pages/AdminDashboardPage.jsx)):**
  - Payment Verification (`pending` ↔ `paid` / `refunded`), User Role Delegation, Audit & System Log Stream, Medical Visit Report File Inspection.

---

## 4. Verification & Testing

- **Syntax & Directory Check:** `backend/dist` created and verified; `node -c server.js` passed with zero errors.
- **Database Seed:** Executed `npm run seed` — Super Admin account created (`superadmin@gharkodoctor.com` / `admin123456`).
- **Frontend Production Build:** Executed `npm run build` — compiled cleanly into `frontend/dist/` and copied to `backend/dist/`.
- **Server Static Serving:** Express server serves `backend/dist` static assets and SPA client-side routing fallback `app.get('*')`.
