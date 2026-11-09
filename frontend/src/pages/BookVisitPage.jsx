import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ProviderCard } from '../components/ProviderCard';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { SEO } from '../components/SEO';
import { PageLoader } from '../components/PageLoader';
import { Calendar, MapPin, CreditCard, AlertCircle, ShieldCheck, Map, FileText, Info } from 'lucide-react';

// Visit slots within service hours (06:00–21:00). Hourly is enough granularity for home visits
// and keeps choices tappable on small screens.
const SLOT_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const MIN_LEAD_MINUTES = 60; // a provider needs travel time

const toDateInput = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateInput(d);
};
const slotLabel = (h, ne) => {
  const h12 = ((h + 11) % 12) + 1;
  const suffix = h < 12 ? (ne ? 'बिहान' : 'AM') : h < 17 ? (ne ? 'दिउँसो' : 'PM') : (ne ? 'साँझ' : 'PM');
  return ne ? `${suffix} ${h12}:00` : `${h12}:00 ${suffix}`;
};
const isSlotPast = (dateStr, h) => {
  const slot = new Date(`${dateStr}T${String(h).padStart(2, '0')}:00`);
  return slot.getTime() < Date.now() + MIN_LEAD_MINUTES * 60 * 1000;
};

const PAYMENT_OPTIONS = [
  {
    value: 'cash',
    title: { ne: '💵 नगद — भिजिटपछि तिर्नुहोस्', en: '💵 Cash — pay after the visit' },
    hint: { ne: 'स्वास्थ्यकर्मी आएर सेवा दिएपछि मात्र रकम तिर्नुहोस्', en: 'Pay only after the provider arrives and treats the patient' }
  },
  {
    value: 'esewa',
    title: { ne: '💚 eSewa', en: '💚 eSewa' },
    hint: { ne: 'भिजिटको समयमा eSewa बाट तिर्नुहोस्', en: 'Pay with eSewa at the time of the visit' }
  },
  {
    value: 'khalti',
    title: { ne: '💜 Khalti', en: '💜 Khalti' },
    hint: { ne: 'भिजिटको समयमा Khalti बाट तिर्नुहोस्', en: 'Pay with Khalti at the time of the visit' }
  }
];

export const BookVisitPage = () => {
  const { lang, token, user } = useAuth();
  const ne = lang === 'ne';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get('service');

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loadError, setLoadError] = useState('');

  const [scheduledDate, setScheduledDate] = useState(addDays(0));
  const [scheduledHour, setScheduledHour] = useState(null);
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash-on-visit is the trust default
  const [notes, setNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prefill the patient's saved address once their profile is available (it loads async after refresh).
  useEffect(() => {
    if (!user) return;
    setAddress(a => a || user.address || '');
    setWard(w => w || user.ward || '');
    setMunicipality(m => m || user.municipality || 'काठमाडौं (Kathmandu)');
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.getServices();
      if (cancelled) return;
      if (!res.success) {
        setLoadError(res.message || (ne ? 'सेवाहरू लोड हुन सकेनन्' : 'Could not load services'));
        return;
      }
      setServices(res.serviceTypes);
      setSelectedService(res.serviceTypes.find(s => s._id === serviceId) || res.serviceTypes[0] || null);
    })();
    return () => { cancelled = true; };
  }, [serviceId, ne]);

  useEffect(() => {
    if (!selectedService) return;
    let cancelled = false;
    setSelectedProvider(null);
    api.getAvailableProviders({ serviceType: selectedService._id }).then(res => {
      if (!cancelled && res.success) setProviders(res.providers);
    });
    return () => { cancelled = true; };
  }, [selectedService]);

  // If the chosen slot becomes invalid (date changed to today, or time passed), clear it.
  useEffect(() => {
    if (scheduledHour !== null && isSlotPast(scheduledDate, scheduledHour)) setScheduledHour(null);
  }, [scheduledDate, scheduledHour]);

  const allSlotsPastToday = useMemo(
    () => SLOT_HOURS.every(h => isSlotPast(addDays(0), h)),
    []
  );

  // After the last slot of the day, default to tomorrow so the first screen isn't all disabled.
  useEffect(() => {
    if (allSlotsPastToday) setScheduledDate(addDays(1));
  }, [allSlotsPastToday]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (scheduledHour === null) {
      setError(ne ? 'कृपया भिजिटको समय छान्नुहोस्' : 'Please choose a visit time');
      document.getElementById('visit-time')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!address.trim()) {
      setError(ne ? 'कृपया घरको ठेगाना लेख्नुहोस्' : 'Please enter your home address');
      return;
    }

    setSubmitting(true);
    const when = new Date(`${scheduledDate}T${String(scheduledHour).padStart(2, '0')}:00`);

    // Price is computed server-side; we only send what the patient chose.
    const res = await api.createBooking({
      serviceType: selectedService._id,
      scheduledTime: when.toISOString(),
      address,
      ward,
      municipality,
      paymentMethod,
      notes,
      emergencyContact,
      preferredProvider: selectedProvider?._id
    }, token);

    setSubmitting(false);
    if (res.success) {
      navigate(`/booking/${res.booking._id}`, { state: { justBooked: true } });
    } else {
      setError(res.message || (ne ? 'बुकिङ असफल भयो' : 'Booking failed'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loadError) {
    return (
      <div className="container" style={{ paddingTop: '16px' }}>
        <div className="alert alert-error"><AlertCircle size={16} /><span>{loadError}</span></div>
      </div>
    );
  }
  if (!selectedService) return <PageLoader />;

  const serviceTitle = selectedService.displayName?.[lang] || selectedService.displayName?.ne;
  const price = selectedService.basePriceRange || {};
  const dateChoices = [
    { value: addDays(0), label: ne ? 'आज' : 'Today', disabled: allSlotsPastToday },
    { value: addDays(1), label: ne ? 'भोलि' : 'Tomorrow' },
    { value: addDays(2), label: ne ? 'पर्सि' : 'Day after' }
  ];
  const isCustomDate = !dateChoices.some(d => d.value === scheduledDate);
  const sectionTitle = { fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' };

  return (
    <div className="container" style={{ paddingTop: '16px' }}>
      <SEO
        title={ne ? `${serviceTitle} बुकिङ गर्नुहोस्` : `Book ${serviceTitle} Visit`}
        description={ne ? 'काठमाडौंमा घरमै डाक्टर वा नर्स बोलाउनुहोस्। नगद वा eSewa बाट भुक्तानी गर्नुहोस्।' : 'Schedule a verified nurse or doctor visit at home in Kathmandu. Cash or digital payment.'}
        canonicalPath="/book"
      />

      <div className="card card-gradient" style={{ marginBottom: '16px', padding: '16px' }}>
        <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{ne ? 'घरमै स्वास्थ्य सेवा बुकिङ' : 'Home Visit Booking'}</span>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedService.icon} {serviceTitle}</h1>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px', display: 'block' }}>
          {ne ? `अनुमानित मूल्य: रु. ${price.min} – ${price.max}` : `Estimated price: Rs. ${price.min} – ${price.max}`}
        </span>
      </div>

      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
        {/* 1. Service */}
        <div className="card">
          <label className="form-label" htmlFor="service-select">{ne ? '१. सेवा प्रकार' : '1. Service'}</label>
          <select
            id="service-select"
            className="form-select"
            value={selectedService._id}
            onChange={(e) => setSelectedService(services.find(s => s._id === e.target.value))}
          >
            {services.map(s => (
              <option key={s._id} value={s._id}>
                {s.icon} {s.displayName?.[lang] || s.displayName?.ne} — रु. {s.basePriceRange?.min}+
              </option>
            ))}
          </select>
        </div>

        {/* 2. When */}
        <div className="card" id="visit-time">
          <h2 style={sectionTitle}>
            <Calendar size={18} color="var(--primary)" />
            {ne ? '२. कहिले आउने?' : '2. When should we come?'}
          </h2>

          <div className="chip-row" role="group" aria-label={ne ? 'मिति' : 'Date'} style={{ marginBottom: '12px' }}>
            {dateChoices.map(d => (
              <button
                key={d.value}
                type="button"
                className="chip"
                aria-pressed={scheduledDate === d.value}
                disabled={d.disabled}
                onClick={() => setScheduledDate(d.value)}
              >
                {d.label}
              </button>
            ))}
            <input
              type="date"
              className="form-input"
              aria-label={ne ? 'अर्को मिति छान्नुहोस्' : 'Pick another date'}
              min={addDays(0)}
              max={addDays(30)}
              value={scheduledDate}
              onChange={(e) => e.target.value && setScheduledDate(e.target.value)}
              style={{ width: 'auto', flex: '1 1 150px', borderColor: isCustomDate ? 'var(--primary)' : undefined }}
            />
          </div>

          <div className="chip-row" role="group" aria-label={ne ? 'समय' : 'Time'}>
            {SLOT_HOURS.map(h => {
              const past = isSlotPast(scheduledDate, h);
              return (
                <button
                  key={h}
                  type="button"
                  className="chip"
                  aria-pressed={scheduledHour === h}
                  disabled={past}
                  onClick={() => setScheduledHour(h)}
                >
                  {slotLabel(h, ne)}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            {ne
              ? 'अहिले नै चाहिएमा वा आपतकालीन अवस्थामा तलको रातो बटन थिच्नुहोस्।'
              : 'Need someone right now, or is it an emergency? Use the red button below.'}
          </p>
        </div>

        {/* 3. Where */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: '12px', gap: '8px' }}>
            <h2 style={{ ...sectionTitle, marginBottom: 0 }}>
              <MapPin size={18} color="var(--primary)" />
              {ne ? '३. कहाँ आउने?' : '3. Where?'}
            </h2>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="btn btn-outline"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Map size={14} />
              <span>{ne ? 'नक्सामा छान्नुहोस्' : 'Choose on map'}</span>
            </button>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="municipality">{ne ? 'पालिका / नगर' : 'Municipality'}</label>
              <input id="municipality" type="text" className="form-input" value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ward">{ne ? 'वडा नम्बर' : 'Ward No.'}</label>
              <input id="ward" type="text" inputMode="numeric" className="form-input" placeholder="4" value={ward} onChange={(e) => setWard(e.target.value)} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="address">{ne ? 'टोल / घर नम्बर / नजिकको चिन्ह' : 'Street / house no. / landmark'} *</label>
            <input
              id="address"
              type="text"
              className="form-input"
              autoComplete="street-address"
              placeholder={ne ? 'उदा: बालुवाटार, भाटभटेनी नजिकै, नीलो गेट' : 'e.g. Baluwatar, near Bhatbhateni, blue gate'}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        </div>

        {/* 4. Patient details */}
        <div className="card">
          <h2 style={sectionTitle}>
            <FileText size={18} color="var(--primary)" />
            {ne ? '४. बिरामीको बारेमा' : '4. About the patient'}
          </h2>
          <div className="form-group">
            <label className="form-label" htmlFor="notes">{ne ? 'लक्षण / विशेष निर्देशन' : 'Symptoms / instructions'}</label>
            <textarea
              id="notes"
              className="form-textarea"
              rows={3}
              maxLength={1000}
              placeholder={ne ? 'उदा: हिजोदेखि उच्च ज्वरो, ८० वर्षीय बुवा, डाक्टरको पुर्जा छ' : 'e.g. High fever since yesterday, 80-year-old father, has prescription'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="emergency">{ne ? 'परिवारको अर्को सम्पर्क नम्बर (ऐच्छिक)' : 'Another family contact (optional)'}</label>
            <input
              id="emergency"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="form-input"
              placeholder="98XXXXXXXX"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
            />
          </div>
        </div>

        {/* 5. Payment */}
        <div className="card">
          <h2 style={sectionTitle}>
            <CreditCard size={18} color="var(--primary)" />
            {ne ? '५. भुक्तानी' : '5. Payment'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PAYMENT_OPTIONS.map(opt => (
              <label key={opt.value} className="choice-card">
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                />
                <div>
                  <strong style={{ fontSize: '0.95rem', display: 'block' }}>{opt.title[lang] || opt.title.ne}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{opt.hint[lang] || opt.hint.ne}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="alert alert-info" style={{ marginTop: '10px' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{ne ? 'अहिले केही पनि तिर्नु पर्दैन। सेवा पाएपछि मात्र भुक्तानी।' : "Nothing to pay now. You pay only after you've been treated."}</span>
          </div>
        </div>

        {/* 6. Optional provider */}
        {providers.length > 0 && (
          <div className="card">
            <h2 style={sectionTitle}>
              <ShieldCheck size={18} color="var(--primary)" />
              {ne ? '६. प्रमाणित स्वास्थ्यकर्मी छान्नुहोस् (ऐच्छिक)' : '6. Choose a verified provider (optional)'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
              {ne
                ? 'नछानेमा हाम्रो टोलीले तपाईंको नजिकको उपलब्ध स्वास्थ्यकर्मी पठाउनेछ।'
                : "Skip this and our dispatch team will send the nearest available provider."}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {providers.map(p => (
                <ProviderCard
                  key={p._id}
                  provider={p}
                  selected={selectedProvider?._id === p._id}
                  onSelect={(prov) => setSelectedProvider(selectedProvider?._id === prov._id ? null : prov)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Sticky summary + confirm */}
        <div className="sticky-cta">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {scheduledHour !== null
                ? `${dateChoices.find(d => d.value === scheduledDate)?.label || scheduledDate} · ${slotLabel(scheduledHour, ne)}`
                : (ne ? 'समय छानिएको छैन' : 'No time chosen')}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap' }}>रु. {price.min}+</div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ fontWeight: 800 }}>
            {submitting ? (ne ? 'पठाउँदै…' : 'Booking…') : (ne ? 'बुकिङ पक्का गर्नुहोस्' : 'Confirm booking')}
          </button>
        </div>
      </form>

      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={(loc) => {
          if (loc.address) setAddress(loc.address);
          if (loc.ward) setWard(loc.ward);
          if (loc.municipality) setMunicipality(loc.municipality);
        }}
      />
    </div>
  );
};
