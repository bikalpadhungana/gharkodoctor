import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { UserPlus, AlertCircle, Map } from 'lucide-react';

export const RegisterPatientPage = () => {
  const { lang, loginUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    address: '',
    ward: '',
    municipality: ''
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLocationSelected = (loc) => {
    setFormData(prev => ({
      ...prev,
      address: loc.address || prev.address,
      ward: loc.ward || prev.ward,
      municipality: loc.municipality || prev.municipality
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.registerPatient(formData);
      if (res.success) {
        loginUser(res.user, res.token);
        navigate('/services');
      } else {
        setError(res.message || 'दर्ता असफल भयो');
      }
    } catch (err) {
      setError(lang === 'ne' ? 'नेटवर्क वा सर्भर त्रुटि' : 'Network or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <SEO
        title={lang === 'ne' ? 'बिरामी दर्ता गर्नुहोस् — घरको डाक्टर' : 'Patient Registration — GharkoDoctor'}
        description={lang === 'ne' ? 'घरमै नर्स, डाक्टर र स्वास्थ्य सेवा पाउन दर्ता गर्नुहोस्।' : 'Register for trusted home doctor and nurse visits in Kathmandu.'}
        canonicalPath="/register-patient"
      />
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img
            src="/icon.png"
            alt="GharkoDoctor Icon"
            style={{ height: '56px', width: '56px', margin: '0 auto 8px auto', display: 'block', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'बिरामी दर्ता गर्नुहोस्' : 'Patient Registration'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
            DOCTOR OF HOUSE
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '20px' }}>
          {lang === 'ne' ? 'घरमै स्वास्थ्य सेवा पाउन दर्ता गर्नुहोस्' : 'Create an account to book home visits'}
        </p>

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
          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'पूरा नाम' : 'Full Name'} *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder={lang === 'ne' ? 'राम शर्मा' : 'Ram Sharma'}
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'फोन नम्बर' : 'Phone Number'} *</label>
            <input
              type="tel"
              name="phone"
              className="form-input"
              placeholder="98XXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'पासवर्ड' : 'Password'} *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>{lang === 'ne' ? 'ठेगाना र स्थान' : 'Address & Location'}</label>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="btn btn-outline"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <Map size={14} />
              <span>{lang === 'ne' ? '🗺️ नक्सामा छान्नुहोस्' : '🗺️ Choose on Map'}</span>
            </button>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'पालिका / शहर' : 'Municipality'}</label>
              <input
                type="text"
                name="municipality"
                className="form-input"
                placeholder={lang === 'ne' ? 'काठमाडौं' : 'Kathmandu'}
                value={formData.municipality}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'वडा नम्बर' : 'Ward No.'}</label>
              <input
                type="text"
                name="ward"
                className="form-input"
                placeholder="4"
                value={formData.ward}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'घरको ठेगाना / टोल' : 'Street Address / Tole'}</label>
            <input
              type="text"
              name="address"
              className="form-input"
              placeholder={lang === 'ne' ? 'बालुवाटार, काठमाडौं' : 'Baluwatar, Kathmandu'}
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
            <UserPlus size={18} />
            <span>{loading ? (lang === 'ne' ? 'दर्ता हुँदैछ...' : 'Registering...') : (lang === 'ne' ? 'दर्ता गर्नुहोस्' : 'Complete Registration')}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          {lang === 'ne' ? 'पहिले नै खाता छ?' : 'Already have an account?'}{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
            {lang === 'ne' ? 'लगइन गर्नुहोस्' : 'Login'}
          </Link>
        </div>
      </div>

      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelected}
      />
    </div>
  );
};
