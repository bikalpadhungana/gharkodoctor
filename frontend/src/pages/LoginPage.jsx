import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Phone, Lock, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { lang, loginUser } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminTab, setIsAdminTab] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isAdminTab) {
        res = await api.adminLogin({ email: adminEmail, password });
      } else {
        res = await api.login({ phone, password });
      }

      if (res.success) {
        loginUser(res.user, res.token);
        if (res.user.role === 'admin' || res.user.role === 'dispatcher') {
          navigate('/admin/dashboard');
        } else if (res.user.role === 'provider') {
          navigate('/provider/dashboard');
        } else {
          navigate('/');
        }
      } else {
        setError(res.message || 'लगइन असफल भयो');
      }
    } catch (err) {
      setError(lang === 'ne' ? 'नेटवर्क वा सर्भर त्रुटि' : 'Network or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '30px' }}>
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img
            src="/icon.png"
            alt="GharkoDoctor Icon"
            style={{ height: '56px', width: '56px', margin: '0 auto 8px auto', display: 'block', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'घरको डाक्टर मा स्वागत छ' : 'Welcome to GharkoDoctor'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
            DOCTOR OF HOUSE
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
          {lang === 'ne' ? 'आफ्नो खातामा लगइन गर्नुहोस्' : 'Login to your account'}
        </p>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setIsAdminTab(false)}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: !isAdminTab ? 'white' : 'transparent',
              fontWeight: !isAdminTab ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: !isAdminTab ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {lang === 'ne' ? 'बिरामी / प्रदायक' : 'Patient / Provider'}
          </button>
          <button
            type="button"
            onClick={() => setIsAdminTab(true)}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: isAdminTab ? 'white' : 'transparent',
              fontWeight: isAdminTab ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: isAdminTab ? 'var(--shadow-sm)' : 'none'
            }}
          >
            {lang === 'ne' ? 'एडमिन' : 'Admin'}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--accent-light)',
              color: 'var(--accent-hover)',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isAdminTab ? (
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'फोन नम्बर' : 'Phone Number'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@gharkodoctor.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'पासवर्ड' : 'Password'}</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            <LogIn size={18} />
            <span>{loading ? (lang === 'ne' ? 'लगइन हुँदैछ...' : 'Logging in...') : (lang === 'ne' ? 'लगइन गर्नुहोस्' : 'Login')}</span>
          </button>
        </form>

        {!isAdminTab && (
          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              {lang === 'ne' ? 'बिरामीको खाता छैन?' : "Don't have a patient account?"}{' '}
              <Link to="/register-patient" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                {lang === 'ne' ? 'दर्ता गर्नुहोस्' : 'Register Here'}
              </Link>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }}>
              {lang === 'ne' ? 'स्वास्थ्यकर्मी वा नर्स हुनुहुन्छ?' : 'Are you a Nurse or Doctor?'}{' '}
              <Link to="/register-provider" style={{ color: 'var(--secondary-hover)', fontWeight: 700, textDecoration: 'none' }}>
                {lang === 'ne' ? 'प्रदायकको रूपमा जोडिनुहोस्' : 'Join as Provider'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
