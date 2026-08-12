import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { SEO } from '../components/SEO';
import { fileToBase64 } from '../utils/fileUtils';
import { UserCheck, ShieldCheck, MapPin, Calendar, Clock, Edit2, Save, X, Star, CheckCircle2, Map, Award, Phone, Mail, FileText, Camera } from 'lucide-react';

export const ProviderProfilePage = () => {
  const { lang, user, token, loginUser } = useAuth();
  const [provider, setProvider] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    bio: user?.bio || '',
    address: user?.address || '',
    ward: user?.ward || '',
    municipality: user?.municipality || '',
    profileImage: user?.profileImage || '',
    serviceRadiusKm: user?.serviceRadiusKm || 5,
    serviceAreaStr: user?.serviceArea ? user.serviceArea.join(', ') : '',
    communityReference: user?.communityReference || ''
  });

  useEffect(() => {
    if (user) {
      setProvider(user);
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        bio: user.bio || '',
        address: user.address || '',
        ward: user.ward || '',
        municipality: user.municipality || '',
        profileImage: user.profileImage || '',
        serviceRadiusKm: user.serviceRadiusKm || 5,
        serviceAreaStr: user.serviceArea ? user.serviceArea.join(', ') : '',
        communityReference: user.communityReference || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationSelected = (loc) => {
    setFormData(prev => ({
      ...prev,
      address: loc.address || prev.address,
      ward: loc.ward || prev.ward,
      municipality: loc.municipality || prev.municipality
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const serviceAreaArray = formData.serviceAreaStr
        ? formData.serviceAreaStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        bio: formData.bio,
        address: formData.address,
        ward: formData.ward,
        municipality: formData.municipality,
        profileImage: formData.profileImage,
        serviceRadiusKm: Number(formData.serviceRadiusKm),
        serviceArea: serviceAreaArray,
        communityReference: formData.communityReference
      };

      const res = await api.updateProviderProfile(payload, token);

      if (res.success) {
        setProvider(res.provider);
        loginUser(res.provider, token);
        setMessage(lang === 'ne' ? 'प्रोफाइल सफलतापूर्वक अद्यावधिक भयो!' : 'Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(res.message || 'प्रोफाइल अद्यावधिक गर्न सकिएन');
      }
    } catch (err) {
      setError(lang === 'ne' ? 'सर्भर त्रुटि भयो' : 'Server error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!provider) {
    return <div className="container">{lang === 'ne' ? 'लोड हुँदैछ...' : 'Loading...'}</div>;
  }

  const categoryName = provider.category?.displayName?.[lang] || provider.category?.displayName?.ne || provider.category?.name || '';

  return (
    <div className="container" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SEO
        title={lang === 'ne' ? 'स्वास्थ्यकर्मी प्रोफाइल — घरको डाक्टर' : 'Health Provider Profile — GharkoDoctor'}
        description={lang === 'ne' ? 'स्वास्थ्यकर्मी प्रोफाइल व्यवस्थापन र कार्यक्षेत्र दूरी अद्यावधिक गर्नुहोस्।' : 'Manage health provider profile, service area radius, and availability.'}
      />

      {/* Header Profile Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="flex-between">
          <StatusBadge status={provider.verificationStatus} type="verification" />
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-outline"
              style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}
            >
              <Edit2 size={14} />
              <span>{lang === 'ne' ? 'सच्याउनुहोस् (Edit)' : 'Edit Profile'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-outline"
              style={{ width: 'auto', padding: '6px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', borderColor: 'var(--border)' }}
            >
              <X size={14} />
              <span>{lang === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {provider.profileImage ? (
              <img
                src={provider.profileImage}
                alt={provider.name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  border: '2px solid var(--primary)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--primary-light), #ccfbf1)',
                  color: 'var(--primary)',
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                {provider.name?.charAt(0) || 'P'}
              </div>
            )}

            {isEditing && (
              <label
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  background: 'var(--secondary)',
                  color: 'white',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={lang === 'ne' ? 'फोटो अपलोड वा क्यामेरा' : 'Upload / Camera'}
              >
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const base64 = await fileToBase64(e.target.files[0], 600, 600, 0.75);
                      setFormData(prev => ({ ...prev, profileImage: base64 }));
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{provider.name}</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
              🏥 {categoryName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--secondary-hover)', fontWeight: 700 }}>
                <Star size={14} fill="var(--secondary)" color="var(--secondary)" />
                <span>{provider.rating > 0 ? provider.rating : 'New'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="var(--primary)" />
                <span>{provider.completedVisits || 0} {lang === 'ne' ? 'भिजिट सम्पन्न' : 'completed'}</span>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div style={{ background: 'var(--success-light)', color: '#15803d', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            ✅ {message}
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--accent-light)', color: 'var(--accent-hover)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Edit Profile Form vs View Profile Mode */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            📝 {lang === 'ne' ? 'व्यक्तिगत र सेवा क्षेत्र विवरण सच्याउनुहोस्' : 'Update Personal & Service Details'}
          </h3>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'पूरा नाम (Full Name)' : 'Full Name'} *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'फोन नम्बर' : 'Phone Number'} *</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'इमेल (Email)' : 'Email'}</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'संक्षिप्त परिचय (Bio)' : 'Bio / Short Introduction'}</label>
            <textarea
              name="bio"
              className="form-textarea"
              rows={3}
              placeholder={lang === 'ne' ? 'आफ्नो अनुभव र विशेषज्ञता लेख्नुहोस्...' : 'Write your medical background & experience...'}
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          {/* Service Area & Coverage Radius Picker */}
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div className="flex-between" style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} />
                {lang === 'ne' ? 'सेवा दूरी र कभरेज (Service Radius & Area)' : 'Service Coverage & Radius'}
              </h4>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="btn btn-outline"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Map size={14} />
                <span>🗺️ {lang === 'ne' ? 'नक्सामा ठेगाना छान्नुहोस्' : 'Pick on Map'}</span>
              </button>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'सेवा पुर्याउने दूरी (Service Radius)' : 'Service Radius'}</label>
                <select
                  name="serviceRadiusKm"
                  className="form-select"
                  value={formData.serviceRadiusKm}
                  onChange={handleChange}
                >
                  <option value={3}>3 KM (Hyperlocal Ward)</option>
                  <option value={5}>5 KM (Standard Area)</option>
                  <option value={10}>10 KM (Wide Municipality)</option>
                  <option value={15}>15 KM (Valley-wide)</option>
                  <option value={25}>25 KM (Expanded Valley)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'मुख्य पालिका' : 'Municipality'}</label>
                <input
                  type="text"
                  name="municipality"
                  className="form-input"
                  value={formData.municipality}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'वडा नम्बर' : 'Ward'}</label>
                <input
                  type="text"
                  name="ward"
                  className="form-input"
                  value={formData.ward}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'टोल / मुख्य क्षेत्र' : 'Tole / Address'}</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{lang === 'ne' ? 'सेवा दिने वडाहरू (comma separated)' : 'Covered Wards (comma separated)'}</label>
              <input
                type="text"
                name="serviceAreaStr"
                className="form-input"
                placeholder="उदा: Ward 4, Ward 5, Baluwatar"
                value={formData.serviceAreaStr}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'समुदाय सिफारिस (Community Ref)' : 'Community Reference'}</label>
            <input
              type="text"
              name="communityReference"
              className="form-input"
              value={formData.communityReference}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px', fontWeight: 800 }}>
            <Save size={18} />
            <span>{loading ? (lang === 'ne' ? 'सुरक्षित हुँदैछ...' : 'Saving...') : (lang === 'ne' ? 'परिवर्तन सुरक्षित गर्नुहोस्' : 'Save Profile Changes')}</span>
          </button>
        </form>
      ) : (
        /* View Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Bio & Details */}
          {provider.bio && (
            <div className="card">
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                {lang === 'ne' ? 'संक्षिप्त परिचय' : 'About Provider'}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.4 }}>{provider.bio}</p>
            </div>
          )}

          {/* Service Area & Coverage Radius */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} color="var(--primary)" />
              {lang === 'ne' ? 'सेवा दूरी र कभरेज (Coverage Radius)' : 'Service Coverage & Radius'}
            </h4>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--primary-light)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '1.4rem' }}>📍</div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--primary-hover)', display: 'block' }}>
                  {provider.serviceRadiusKm || 5} KM Radius Coverage
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  {provider.address || 'काठमाडौं'}, वडा {provider.ward || ''} {provider.municipality ? `(${provider.municipality})` : ''}
                </span>
              </div>
            </div>

            {provider.serviceArea && provider.serviceArea.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>{lang === 'ne' ? 'कभर गरिएका वडाहरू:' : 'Covered Wards:'}</strong> {provider.serviceArea.join(', ')}
              </div>
            )}
          </div>

          {/* Verification Credentials */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--primary)" />
              {lang === 'ne' ? 'प्रमाणीकरण विवरण' : 'Verification Credentials'}
            </h4>

            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>💳 <strong>नागरिकता:</strong> {provider.verificationDocs?.citizenshipId || 'N/A'}</div>
              <div>📜 <strong>काउन्सिल लाइसेन्स:</strong> {provider.verificationDocs?.licenseNumber || 'N/A'}</div>
              {provider.communityReference && (
                <div>🏛️ <strong>समुदाय सिफारिस:</strong> {provider.communityReference}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelected}
      />
    </div>
  );
};
