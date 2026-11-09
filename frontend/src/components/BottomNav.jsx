import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, Stethoscope, UserCheck, ClipboardList } from 'lucide-react';

// Mobile tab bar — only the destinations each role actually uses.
export const BottomNav = () => {
  const { user, isProvider, isStaff, lang } = useAuth();
  const ne = lang === 'ne';

  // Staff work from a single panel with its own tabs; a one-item tab bar adds nothing.
  if (isStaff) return null;

  const items = isProvider
    ? [
        { to: '/provider/dashboard', icon: ClipboardList, label: ne ? 'मेरो भिजिट' : 'My visits' },
        { to: '/provider/profile', icon: UserCheck, label: ne ? 'प्रोफाइल' : 'Profile' }
      ]
    : [
        { to: '/', icon: Home, label: ne ? 'गृह' : 'Home' },
        { to: '/services', icon: Stethoscope, label: ne ? 'सेवाहरू' : 'Services' },
        { to: user ? '/my-bookings' : '/login', icon: Calendar, label: ne ? 'बुकिङहरू' : 'Bookings' }
      ];

  return (
    <nav className="bottom-nav" aria-label={ne ? 'मुख्य' : 'Main'}>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
