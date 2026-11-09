import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { EmergencyButton } from './components/EmergencyButton';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from './components/PageLoader';
import { HomePage } from './pages/HomePage';
import { STAFF_ROLES, homePathForRole } from './config';

// Route-level code splitting: patients on 3G only download the home page up front.
// Admin dashboard, IoT panel and the Leaflet map are fetched only when those routes are opened.
const named = (loader, name) => lazy(() => loader().then(m => ({ default: m[name] })));

const LoginPage = named(() => import('./pages/LoginPage'), 'LoginPage');
const RegisterPatientPage = named(() => import('./pages/RegisterPatientPage'), 'RegisterPatientPage');
const RegisterProviderPage = named(() => import('./pages/RegisterProviderPage'), 'RegisterProviderPage');
const ServicesPage = named(() => import('./pages/ServicesPage'), 'ServicesPage');
const BookVisitPage = named(() => import('./pages/BookVisitPage'), 'BookVisitPage');
const MyBookingsPage = named(() => import('./pages/MyBookingsPage'), 'MyBookingsPage');
const BookingDetailPage = named(() => import('./pages/BookingDetailPage'), 'BookingDetailPage');
const ProviderDashboardPage = named(() => import('./pages/ProviderDashboardPage'), 'ProviderDashboardPage');
const ProviderProfilePage = named(() => import('./pages/ProviderProfilePage'), 'ProviderProfilePage');
const AdminDashboardPage = named(() => import('./pages/AdminDashboardPage'), 'AdminDashboardPage');
const PatientHomePage = named(() => import('./pages/PatientHomePage'), 'PatientHomePage');

// "/" is the marketing page for guests, and a personal home for signed-in users.
// Providers and staff are sent to their own dashboards.
const HomeRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user?.role === 'patient') return <PatientHomePage />;
  if (user) return <Navigate to={homePathForRole(user.role)} replace />;
  return <HomePage />;
};

const NotFoundPage = () => {
  const { lang } = useAuth();
  return (
    <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
      <div className="card" style={{ padding: '28px' }}>
        <div style={{ fontSize: '2.5rem' }}>🧭</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '8px 0' }}>
          {lang === 'ne' ? 'यो पृष्ठ फेला परेन' : 'Page not found'}
        </h2>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '12px' }}>
          {lang === 'ne' ? 'गृहपृष्ठमा जानुहोस्' : 'Go to Home'}
        </Link>
      </div>
    </div>
  );
};

const guard = (roles, el) => <ProtectedRoute roles={roles}>{el}</ProtectedRoute>;

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-viewport">
          <a href="#main" className="skip-link">Skip to content</a>
          <Navbar />

          <main id="main" style={{ flex: 1 }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register-patient" element={<RegisterPatientPage />} />
                <Route path="/register-provider" element={<RegisterProviderPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/book" element={guard(['patient'], <BookVisitPage />)} />
                <Route path="/my-bookings" element={guard(['patient'], <MyBookingsPage />)} />
                <Route path="/booking/:id" element={guard(null, <BookingDetailPage />)} />
                <Route path="/provider/dashboard" element={guard(['provider'], <ProviderDashboardPage />)} />
                <Route path="/provider/profile" element={guard(['provider'], <ProviderProfilePage />)} />
                <Route path="/admin/dashboard" element={guard(STAFF_ROLES, <AdminDashboardPage />)} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </main>

          <EmergencyButton />
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
