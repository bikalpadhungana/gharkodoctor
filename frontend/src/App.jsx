import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { EmergencyButton } from './components/EmergencyButton';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPatientPage } from './pages/RegisterPatientPage';
import { RegisterProviderPage } from './pages/RegisterProviderPage';
import { ServicesPage } from './pages/ServicesPage';
import { BookVisitPage } from './pages/BookVisitPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { ProviderDashboardPage } from './pages/ProviderDashboardPage';
import { ProviderProfilePage } from './pages/ProviderProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-viewport">
          <Navbar />
          
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register-patient" element={<RegisterPatientPage />} />
              <Route path="/register-provider" element={<RegisterProviderPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/book" element={<BookVisitPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/booking/:id" element={<BookingDetailPage />} />
              <Route path="/provider/dashboard" element={<ProviderDashboardPage />} />
              <Route path="/provider/profile" element={<ProviderProfilePage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Routes>
          </main>

          <EmergencyButton />
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
