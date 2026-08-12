import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, Stethoscope, ShieldCheck, UserCheck } from 'lucide-react';

export const BottomNav = () => {
  const { user, isPatient, isProvider, isAdmin, lang } = useAuth();

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home />
        <span>{lang === 'ne' ? 'गृह' : 'Home'}</span>
      </NavLink>

      {/* Patient links */}
      {(!user || isPatient) && (
        <>
          <NavLink to="/services" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Stethoscope />
            <span>{lang === 'ne' ? 'सेवाहरू' : 'Services'}</span>
          </NavLink>
          <NavLink to="/my-bookings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar />
            <span>{lang === 'ne' ? 'बुकिङहरू' : 'Bookings'}</span>
          </NavLink>
        </>
      )}

      {/* Provider links */}
      {isProvider && (
        <>
          <NavLink to="/provider/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Calendar />
            <span>{lang === 'ne' ? 'मेरो कार्य' : 'Dashboard'}</span>
          </NavLink>
          <NavLink to="/provider/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UserCheck />
            <span>{lang === 'ne' ? 'प्रोफाइल' : 'Profile'}</span>
          </NavLink>
        </>
      )}

      {/* Admin links */}
      {isAdmin && (
        <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldCheck />
          <span>{lang === 'ne' ? 'एडमिन' : 'Admin'}</span>
        </NavLink>
      )}
    </nav>
  );
};
