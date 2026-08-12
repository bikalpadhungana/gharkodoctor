import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PatientProfileModal } from './PatientProfileModal';
import { LogOut, Globe, User } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isPatient, logout, lang, toggleLang } = useAuth();
  const navigate = useNavigate();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
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
                  else if (user.role === 'provider') navigate('/provider/profile');
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
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-hover)' }}>
                  {user.name.split(' ')[0]}
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
                title="Logout"
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
