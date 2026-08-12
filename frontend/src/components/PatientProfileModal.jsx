import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { fileToBase64 } from '../utils/fileUtils';
import { X, Camera, User, Phone, MapPin, Save, Check } from 'lucide-react';

export const PatientProfileModal = ({ isOpen, onClose }) => {
  const { lang, user, token, loginUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: user?.address || '',
    ward: user?.ward || '',
    municipality: user?.municipality || '',
    profileImage: user?.profileImage || ''
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        address: user.address || '',
        ward: user.ward || '',
        municipality: user.municipality || '',
        profileImage: user.profileImage || ''
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0], 600, 600, 0.75);
        setFormData(prev => ({ ...prev, profileImage: base64 }));
      } catch (err) {
        console.error('Error reading image', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.updatePatientProfile(formData, token);
      if (res.success) {
        loginUser(res.user, token);
        setSuccessMsg(lang === 'ne' ? 'प्रोफाइल अद्यावधिक भयो!' : 'Profile updated successfully!');
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Error updating profile');
      }
    } catch (err) {
      setErrorMsg('Server error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          padding: '24px'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', marginBottom: '16px' }}>
          {lang === 'ne' ? 'बिरामी प्रोफाइल (Profile & Photo)' : 'Patient Profile & Photo'}
        </h3>

        {/* Profile Image Avatar Upload */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {formData.profileImage ? (
              <img
                src={formData.profileImage}
                alt="Profile"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                  border: '3px solid var(--primary)',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--primary-light), #ccfbf1)',
                  color: 'var(--primary)',
                  fontSize: '2rem',
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto',
                  border: '3px solid var(--primary)'
                }}
              >
                {formData.name?.charAt(0) || 'U'}
              </div>
            )}

            <label
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                background: 'var(--primary)',
                color: 'white',
                borderRadius: 'var(--radius-full)',
                padding: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={lang === 'ne' ? 'फोटो अपलोड वा क्यामेरा' : 'Camera / Upload'}
            >
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                capture="user"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </label>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
            {lang === 'ne' ? '📷 क्यामेरा वा ग्यालरीबाट फोटो रोज्नुहोस्' : 'Click camera to take or upload profile photo'}
          </span>
        </div>

        {successMsg && (
          <div style={{ background: 'var(--success-light)', color: '#15803d', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
            ✅ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'var(--accent-light)', color: 'var(--accent-hover)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '12px', textAlign: 'center' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'नाम (Name)' : 'Full Name'} *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'फोन नम्बर' : 'Phone Number'}</label>
            <input
              type="text"
              className="form-input"
              value={user?.phone || ''}
              disabled
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'पालिका' : 'Municipality'}</label>
              <input
                type="text"
                className="form-input"
                value={formData.municipality}
                onChange={e => setFormData({ ...formData, municipality: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'वडा' : 'Ward'}</label>
              <input
                type="text"
                className="form-input"
                value={formData.ward}
                onChange={e => setFormData({ ...formData, ward: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'घरको ठेगाना' : 'Home Address'}</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
            <Save size={18} />
            <span>{loading ? (lang === 'ne' ? 'सुरक्षित हुँदैछ...' : 'Saving...') : (lang === 'ne' ? 'प्रोफाइल सेभ गर्नुहोस्' : 'Save Profile')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
