import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { SEO } from '../components/SEO';
import { Stethoscope, ShieldCheck, AlertCircle, Map } from 'lucide-react';

export const RegisterProviderPage = () => {
  const { lang, loginUser } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    category: '',
    address: '',
    ward: '',
    municipality: '',
    citizenshipId: '',
    licenseNumber: '',
    communityReference: '',
    bio: ''
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

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        if (res.success) {
          setServices(res.serviceTypes);
          if (res.serviceTypes.length > 0) {
            setFormData(prev => ({ ...prev, category: res.serviceTypes[0]._id }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.registerProvider(formData);
      if (res.success) {
        loginUser(res.user, res.token);
        navigate('/provider/dashboard');
      } else {
        setError(res.message || 'प्रदायक दर्ता असफल भयो');
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
        title={lang === 'ne' ? 'स्वास्थ्यकर्मी दर्ता गर्नुहोस् — घरको डाक्टर' : 'Register as a Health Provider — GharkoDoctor'}
        description={lang === 'ne' ? 'नर्स, अहेव वा डाक्टर हुनुहुन्छ? घरको डाक्टरमा जोडिएर काठमाडौंमा घरमै स्वास्थ्य सेवा दिनुहोस् र आम्दानी बढाउनुहोस्।' : 'Join GharkoDoctor as a verified home healthcare nurse, doctor, or paramedic in Kathmandu.'}
        keywords="nurse jobs kathmandu, home care nurse vacancy nepal, doctor home visit jobs kathmandu, स्वास्थ्यकर्मी काम काठमाडौं"
        canonicalPath="/register-provider"
      />
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img
            src="/icon.png"
            alt="GharkoDoctor Icon"
            style={{ height: '56px', width: '56px', margin: '0 auto 8px auto', display: 'block', objectFit: 'contain' }}
          />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'स्वास्थ्य प्रदायकको रूपमा जोडिनुहोस्' : 'Register as a Health Provider'}
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginTop: '2px' }}>
            DOCTOR OF HOUSE
          </span>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {lang === 'ne'
              ? 'नर्स, अहेव, डाक्टर, वा स्वास्थ्यकर्मी हुनुहुन्छ? घरमै सेवा दिएर आम्दानी गर्नुहोस्।'
              : 'Join Nepal’s premier home-health provider network.'}
          </p>
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
          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'सेवा प्रकार (Category)' : 'Service Category'} *</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {services.map(s => (
                <option key={s._id} value={s._id}>
                  {s.displayName?.[lang] || s.displayName?.ne} ({s.icon})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'पूरा नाम' : 'Full Name'} *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder={lang === 'ne' ? 'सिता श्रेष्ठ' : 'Sita Shrestha'}
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

          {/* Verification section */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} />
              {lang === 'ne' ? 'प्रमाणीकरण विवरण (Verification)' : 'Verification Credentials'}
            </h4>

            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'नागरिकता नम्बर' : 'Citizenship Number'}</label>
              <input
                type="text"
                name="citizenshipId"
                className="form-input"
                placeholder="27-01-78-XXXXX"
                value={formData.citizenshipId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'नेपाल नर्सिङ/मेडिकल काउन्सिल दर्ता नं.' : 'Council License / Registration No.'}</label>
              <input
                type="text"
                name="licenseNumber"
                className="form-input"
                placeholder="NNC-XXXXX"
                value={formData.licenseNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                {lang === 'ne' ? 'समुदाय सिफारिस (वडा/क्लिनिक)' : 'Community Reference (Ward/Clinic)'}
              </label>
              <input
                type="text"
                name="communityReference"
                className="form-input"
                placeholder={lang === 'ne' ? 'उदा: मोडर्न क्लिनिक वा वडा नं ४ सिफारिस' : 'e.g. Recommended by Ward 4 Office or City Clinic'}
                value={formData.communityReference}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                {lang === 'ne'
                  ? 'काउन्सिल दर्ता नभएमा स्थानीय क्लिनिक वा वडाको सिफारिसले विश्वास बढाउँछ।'
                  : 'Boosts trust score if formal licensing is thin.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', marginBottom: '8px' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>{lang === 'ne' ? 'कार्यक्षेत्र र सेवा दूरी (Service Area & Radius)' : 'Service Area & Coverage Radius'}</label>
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
              <label className="form-label">{lang === 'ne' ? 'सेवा पुर्याउने दूरी (Coverage Radius)' : 'Service Radius'}</label>
              <select
                name="serviceRadiusKm"
                className="form-select"
                value={formData.serviceRadiusKm || 5}
                onChange={handleChange}
              >
                <option value={3}>3 KM (Hyperlocal Ward)</option>
                <option value={5}>5 KM (Standard Area)</option>
                <option value={10}>10 KM (Wide Municipality)</option>
                <option value={15}>15 KM (Kathmandu Valley-wide)</option>
                <option value={25}>25 KM (Expanded Valley)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'मुख्य पालिका' : 'Municipality'}</label>
              <input
                type="text"
                name="municipality"
                className="form-input"
                placeholder="उदा: काठमाडौं"
                value={formData.municipality}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid-2">
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

            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'टोल / ठेगाना' : 'Street Address / Tole'}</label>
              <input
                type="text"
                name="address"
                className="form-input"
                placeholder="उदा: बालुवाटार"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-secondary" disabled={loading} style={{ marginTop: '10px' }}>
            <span>{loading ? (lang === 'ne' ? 'आवेदन बुझाउँदै...' : 'Submitting...') : (lang === 'ne' ? 'आवेदन बुझाउनुहोस्' : 'Submit Provider Application')}</span>
          </button>
        </form>
      </div>

      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelected}
      />
    </div>
  );
};
