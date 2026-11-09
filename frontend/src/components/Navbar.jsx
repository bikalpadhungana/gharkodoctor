import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PatientProfileModal } from './PatientProfileModal';
import { LogOut, Globe, User } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isPatient, logout, lang, toggleLang } = useAuth();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const ne = lang === 'ne';
  const role = user?.role;
  const isStaffUser = ['admin', 'superadmin', 'dispatcher'].includes(role);

  const navLinks = !isAuthenticated
    ? [
        { to: '/', label: ne ? 'गृह' : 'Home' },
        { to: '/services', label: ne ? 'सेवाहरू' : 'Services' },
        { to: '/register-provider', label: ne ? 'स्वास्थ्यकर्मी दर्ता' : 'Join as Provider', style: { color: 'var(--primary)', fontWeight: 700 } }
      ]
    : role === 'patient'
      ? [
          { to: '/', label: ne ? 'गृह' : 'Home' },
          { to: '/services', label: ne ? 'नयाँ भिजिट' : 'Book a visit' },
          { to: '/my-bookings', label: ne ? 'मेरो बुकिङ' : 'My bookings' }
        ]
      : role === 'provider'
        ? [
            { to: '/provider/dashboard', label: ne ? 'मेरो भिजिट' : 'My visits' },
            { to: '/provider/profile', label: ne ? 'प्रोफाइल' : 'Profile' }
          ]
        : [{ to: '/admin/dashboard', label: ne ? 'डिस्प्याच प्यानल' : 'Dispatch panel' }];

  const roleLabel = {
    patient: ne ? 'बिरामी' : 'Patient',
    provider: ne ? 'स्वास्थ्यकर्मी' : 'Provider',
    dispatcher: ne ? 'डिस्प्याचर' : 'Dispatcher',
    admin: ne ? 'एडमिन' : 'Admin',
    superadmin: ne ? 'सुपर एडमिन' : 'Super admin'
  }[role];

  const handleLogout = () => {
    if (!window.confirm(ne ? 'लगआउट गर्ने?' : 'Log out?')) return;
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="glass-header">
        <Link to="/" className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img
            src="/icon.png"
            alt="GharkoDoctor Icon"
            style={{ height: '36px', width: '36px', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-hover)', lineHeight: 1.1 }}>
              घरको डाक्टर
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
              DOCTOR OF HOUSE
            </span>
          </div>
        </Link>

        {/* Desktop navigation — what each role actually uses */}
        <nav className="desktop-nav-links" aria-label="Main">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => `nav-link-desktop ${isActive ? 'active' : ''}`} style={l.style}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="btn-outline"
            style={{
              padding: '4px 10px',
              fontSize: '0.75rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Globe size={14} />
            {lang === 'ne' ? 'English' : 'नेपाली'}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Profile Avatar Trigger */}
              <button
                onClick={() => {
                  if (isPatient) setIsProfileModalOpen(true);
                  else if (role === 'provider') navigate('/provider/profile');
                  else if (isStaffUser) navigate('/admin/dashboard');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0
                }}
                title={lang === 'ne' ? 'प्रोफाइल सच्याउनुहोस्' : 'Profile Settings'}
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: 'var(--radius-full)',
                      objectFit: 'cover',
                      border: '1.5px solid var(--primary)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    {user.name?.charAt(0) || 'U'}
                  </div>
                )}
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-hover)' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{roleLabel}</span>
                </span>
              </button>

              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title={ne ? 'लगआउट' : 'Log out'}
                aria-label={ne ? 'लगआउट' : 'Log out'}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.8rem', width: 'auto' }}
            >
              {lang === 'ne' ? 'लगइन' : 'Login'}
            </Link>
          )}
        </div>
      </header>

      {/* Patient Profile Modal */}
      <PatientProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
