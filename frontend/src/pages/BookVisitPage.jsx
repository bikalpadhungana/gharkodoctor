import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProviderCard } from '../components/ProviderCard';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { SEO } from '../components/SEO';
import { Calendar, MapPin, CreditCard, Clock, AlertCircle, CheckCircle2, ShieldCheck, Map } from 'lucide-react';

export const BookVisitPage = () => {
  const { lang, token, user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const serviceId = searchParams.get('service');

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [address, setAddress] = useState(user?.address || '');
  const [ward, setWard] = useState(user?.ward || '');
  const [municipality, setMunicipality] = useState(user?.municipality || 'काठमाडौं (Kathmandu)');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default cash-on-visit for trust
  const [notes, setNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [isMapOpen, setIsMapOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLocationSelected = (loc) => {
    if (loc.address) setAddress(loc.address);
    if (loc.ward) setWard(loc.ward);
    if (loc.municipality) setMunicipality(loc.municipality);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const init = async () => {
      try {
        const res = await api.getServices();
        if (res.success) {
          setServices(res.serviceTypes);
          const found = res.serviceTypes.find(s => s._id === serviceId) || res.serviceTypes[0];
          setSelectedService(found);

          if (found) {
            fetchProviders(found._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [serviceId, isAuthenticated]);

  const fetchProviders = async (stId) => {
    try {
      const res = await api.getAvailableProviders({ serviceType: stId });
      if (res.success) {
        setProviders(res.providers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleServiceChange = (e) => {
    const stId = e.target.value;
    const found = services.find(s => s._id === stId);
    setSelectedService(found);
    setSelectedProvider(null);
    fetchProviders(stId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!scheduledDate) {
      setError(lang === 'ne' ? 'कृपया मिति छान्नुहोस्' : 'Please select a date');
      return;
    }

    setLoading(true);

    const fullDateTime = new Date(`${scheduledDate}T${scheduledTime}`);

    try {
      const bookingData = {
        serviceType: selectedService._id,
        scheduledTime: fullDateTime.toISOString(),
        address,
        ward,
        municipality,
        paymentMethod,
        notes,
        emergencyContact,
        amount: selectedService.basePriceRange?.min || 500
      };

      const res = await api.createBooking(bookingData, token);

      if (res.success) {
        // If a provider was manually picked, assign them
        if (selectedProvider) {
          await api.assignProvider(res.booking._id, selectedProvider._id, token);
        }
        navigate(`/booking/${res.booking._id}`);
      } else {
        setError(res.message || 'बुकिङ असफल भयो');
      }
    } catch (err) {
      setError(lang === 'ne' ? 'नेटवर्क वा सर्भर त्रुटि' : 'Network or server error');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedService) {
    return <div className="container">{lang === 'ne' ? 'लोड हुँदैछ...' : 'Loading...'}</div>;
  }

  const serviceTitle = selectedService.displayName?.[lang] || selectedService.displayName?.ne;

  return (
    <div className="container" style={{ paddingTop: '16px' }}>
      <SEO
        title={lang === 'ne' ? `${serviceTitle} बुकिङ गर्नुहोस्` : `Book ${serviceTitle} Visit`}
        description={lang === 'ne' ? 'काठमाडौंमा घरमै डाक्टर वा नर्स बोलाउनुहोस्। नगद वा eSewa बाट भुक्तानी गर्नुहोस्।' : 'Schedule a verified nurse or doctor visit at home in Kathmandu. Cash or digital payment.'}
        canonicalPath="/book"
      />
      <div className="card card-gradient" style={{ marginBottom: '16px', padding: '16px' }}>
        <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{lang === 'ne' ? 'घरमै स्वास्थ्य सेवा बुकिङ' : 'Home Visit Booking'}</span>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{serviceTitle}</h2>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px', display: 'block' }}>
          {lang === 'ne'
            ? `अनुमानित मूल्य: रु. ${selectedService.basePriceRange?.min} - ${selectedService.basePriceRange?.max}`
            : `Estimated Price: Rs. ${selectedService.basePriceRange?.min} - ${selectedService.basePriceRange?.max}`}
        </span>
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Service Selector */}
        <div className="card">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{lang === 'ne' ? 'सेवा प्रकार छान्नुहोस्' : 'Select Service Type'}</label>
            <select
              className="form-select"
              value={selectedService._id}
              onChange={handleServiceChange}
            >
              {services.map(s => (
                <option key={s._id} value={s._id}>
                  {s.displayName?.[lang] || s.displayName?.ne} ({s.icon})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card">
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={18} color="var(--primary)" />
            {lang === 'ne' ? 'भिजिट समय (Schedule Date & Time)' : 'Visit Date & Time'}
          </h4>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'मिति (Date)' : 'Date'} *</label>
              <input
                type="date"
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'समय (Time)' : 'Time'} *</label>
              <input
                type="time"
                className="form-input"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Location / Address */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={18} color="var(--primary)" />
              {lang === 'ne' ? 'घरको ठेगाना (Location)' : 'Home Location'}
            </h4>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="btn btn-outline"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.78rem' }}
            >
              <Map size={14} />
              <span>{lang === 'ne' ? '🗺️ नक्सामा छान्नुहोस्' : '🗺️ Choose on Map'}</span>
            </button>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'पालिका / नगर' : 'Municipality'}</label>
              <input
                type="text"
                className="form-input"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'वडा नम्बर' : 'Ward No.'}</label>
              <input
                type="text"
                className="form-input"
                placeholder="4"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{lang === 'ne' ? 'घर नम्बर / टोल / मुख्य चिन्ह' : 'Street Address / Landmark'} *</label>
            <input
              type="text"
              className="form-input"
              placeholder={lang === 'ne' ? 'उदा: बालुवाटार, भाटभटेनी नजिकै' : 'e.g. Near Bhatbhateni, Baluwatar'}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Payment Method */}
        <div className="card">
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={18} color="var(--primary)" />
            {lang === 'ne' ? 'भुक्तानी माध्यम (Payment Method)' : 'Payment Method'}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                border: paymentMethod === 'cash' ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: paymentMethod === 'cash' ? 'var(--primary-light)' : 'white',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={() => setPaymentMethod('cash')}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', display: 'block' }}>💵 {lang === 'ne' ? 'नगद भुक्तानी (Cash on Visit)' : 'Cash on Visit'}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'ne' ? 'स्वास्थ्यकर्मी घरमा आएर सेवा दिएपछि मात्र रकम तिर्नुहोस्' : 'Pay in cash after the provider arrives'}
                </span>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                border: paymentMethod === 'esewa' ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: paymentMethod === 'esewa' ? 'var(--primary-light)' : 'white',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="payment"
                value="esewa"
                checked={paymentMethod === 'esewa'}
                onChange={() => setPaymentMethod('esewa')}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#60bb46', display: 'block' }}>💚 eSewa Digital Wallet</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'ne' ? 'eSewa बाट सुरक्षित अनलाइन भुक्तानी' : 'Instant digital payment via eSewa'}
                </span>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                border: paymentMethod === 'khalti' ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: paymentMethod === 'khalti' ? 'var(--primary-light)' : 'white',
                cursor: 'pointer'
              }}
            >
              <input
                type="radio"
                name="payment"
                value="khalti"
                checked={paymentMethod === 'khalti'}
                onChange={() => setPaymentMethod('khalti')}
              />
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#5c2d91', display: 'block' }}>💜 Khalti Wallet</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {lang === 'ne' ? 'Khalti बाट अनलाइन भुक्तानी' : 'Pay via Khalti'}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Additional Notes & Emergency Contact */}
        <div className="card">
          <div className="form-group">
            <label className="form-label">{lang === 'ne' ? 'बिरामीको लक्षण / विशेष निर्देशन' : 'Patient Symptoms / Instructions'}</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder={lang === 'ne' ? 'उदा: उच्च ज्वरो, 80 बर्षीय ज्येष्ठ नागरिक...' : 'e.g., High fever since yesterday, elderly patient...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{lang === 'ne' ? 'आपतकालीन सम्पर्क नम्बर (Optional)' : 'Emergency Contact Phone'}</label>
            <input
              type="tel"
              className="form-input"
              placeholder="98XXXXXXXX"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>
        </div>

        {/* Available Verified Providers (Optional Selection) */}
        {providers.length > 0 && (
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} color="var(--primary)" />
              {lang === 'ne' ? 'प्रमाणीकृत प्रदायक छान्नुहोस् (Optional)' : 'Choose Verified Provider'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {providers.map(p => (
                <ProviderCard
                  key={p._id}
                  provider={p}
                  onSelect={(prov) => setSelectedProvider(selectedProvider?._id === prov._id ? null : prov)}
                />
              ))}
            </div>

            {selectedProvider && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--success-light)', color: '#15803d', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} />
                <span>{selectedProvider.name} {lang === 'ne' ? 'छनोट गरियो' : 'selected'}</span>
              </div>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '14px', fontSize: '1rem', fontWeight: 800 }}>
          <span>{loading ? (lang === 'ne' ? 'पुष्टि हुँदैछ...' : 'Booking...') : (lang === 'ne' ? 'बुकिङ पुष्टि गर्नुहोस्' : 'Confirm Visit Booking')}</span>
        </button>
      </form>

      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelected}
      />
    </div>
  );
};
