import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ChevronRight, RotateCcw, Plus, Clock, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { BookingTracker } from '../components/BookingTracker';
import { HOTLINE, HOTLINE_DISPLAY } from '../config';
import { isActive, serviceName, friendlyTime, greeting } from '../utils/booking';

// Signed-in patient home: "what's happening with my visit" first, then one-tap booking.
export const PatientHomePage = () => {
  const { lang, token, user } = useAuth();
  const ne = lang === 'ne';
  const [bookings, setBookings] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getMyBookings(token), api.getServices()]).then(([b, s]) => {
      if (cancelled) return;
      setBookings(b.success ? b.bookings : []);
      if (s.success) setServices(s.serviceTypes);
    });
    return () => { cancelled = true; };
  }, [token]);

  const active = (bookings || [])
    .filter(isActive)
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  const nextVisit = active[0];
  const otherActive = active.slice(1);
  const lastCompleted = (bookings || []).find(b => b.status === 'completed');
  const firstName = user?.name?.split(' ')[0] || '';
  const profileIncomplete = user && (!user.address || !user.ward);

  return (
    <div className="container dash">
      <div className="greet">
        <small>{greeting(lang)},</small>
        <h1>{firstName} 👋</h1>
        <p style={{ fontSize: '0.85rem', opacity: 0.92, marginTop: '4px' }}>
          {ne ? 'आज तपाईंको परिवारलाई कस्तो सेवा चाहिन्छ?' : 'What care does your family need today?'}
        </p>
      </div>

      {/* Current visit */}
      {bookings === null ? (
        <div className="skeleton skeleton-card" />
      ) : nextVisit ? (
        <section aria-labelledby="next-visit">
          <div className="section-head" style={{ marginBottom: '8px' }}>
            <h2 id="next-visit">{ne ? 'तपाईंको आगामी भिजिट' : 'Your upcoming visit'}</h2>
          </div>
          <div className="card visit-card highlight">
            <div className="vc-top">
              <div className="vc-icon">{nextVisit.serviceType?.icon || '🏥'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex-between" style={{ gap: '8px' }}>
                  <div className="vc-title">{serviceName(nextVisit, lang)}</div>
                  <StatusBadge status={nextVisit.status} />
                </div>
                <div className="vc-meta">
                  <span><Clock size={13} style={{ verticalAlign: '-2px' }} /> {friendlyTime(nextVisit.scheduledTime, lang)}</span>
                  <span><MapPin size={13} style={{ verticalAlign: '-2px' }} /> {nextVisit.address}</span>
                </div>
              </div>
            </div>

            <BookingTracker status={nextVisit.status} lang={lang} />

            {nextVisit.provider ? (
              <div className="alert alert-info" style={{ alignItems: 'center' }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>
                  <strong>{nextVisit.provider.name}</strong>
                  {nextVisit.status === 'en_route'
                    ? (ne ? ' तपाईंको घरतिर आउँदै हुनुहुन्छ' : ' is on the way to you')
                    : (ne ? ' तपाईंको भिजिटको लागि तोकिनुभएको छ' : ' is assigned to your visit')}
                </span>
              </div>
            ) : (
              <div className="alert alert-warn">
                ⏳ {ne ? 'प्रमाणित स्वास्थ्यकर्मी मिलाइँदैछ। तोकिएपछि SMS आउनेछ।' : "We're matching a verified provider. You'll get an SMS once assigned."}
              </div>
            )}

            <div className="vc-actions">
              {nextVisit.provider?.phone && (
                <a href={`tel:${nextVisit.provider.phone}`} className="btn btn-primary">
                  <Phone size={16} /> {ne ? 'स्वास्थ्यकर्मीलाई फोन' : 'Call provider'}
                </a>
              )}
              <Link to={`/booking/${nextVisit._id}`} className="btn btn-outline">
                {ne ? 'विवरण हेर्नुहोस्' : 'View details'} <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {otherActive.length > 0 && (
            <div className="row-list" style={{ marginTop: '10px' }}>
              {otherActive.map(b => (
                <Link key={b._id} to={`/booking/${b._id}`} className="row-item">
                  <span style={{ fontSize: '1.3rem' }}>{b.serviceType?.icon || '🏥'}</span>
                  <div className="ri-main">
                    <div className="ri-title">{serviceName(b, lang)}</div>
                    <div className="ri-sub">{friendlyTime(b.scheduledTime, lang)}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ fontSize: '2rem' }}>🩺</div>
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.95rem' }}>{ne ? 'कुनै आगामी भिजिट छैन' : 'No upcoming visits'}</strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {ne ? 'तल सेवा छानेर १ मिनेटमा बुक गर्नुहोस्।' : 'Pick a service below to book in a minute.'}
            </p>
          </div>
        </div>
      )}

      {/* Rebook */}
      {!nextVisit && lastCompleted?.serviceType?._id && (
        <Link to={`/book?service=${lastCompleted.serviceType._id}`} className="card row-item" style={{ padding: '14px', borderRadius: 'var(--radius-md)' }}>
          <RotateCcw size={20} color="var(--primary)" />
          <div className="ri-main">
            <div className="ri-title">{ne ? 'फेरि बुक गर्नुहोस्' : 'Book again'}: {serviceName(lastCompleted, lang)}</div>
            <div className="ri-sub">
              {lastCompleted.provider?.name
                ? (ne ? `अघिल्लो पटक: ${lastCompleted.provider.name}` : `Last time: ${lastCompleted.provider.name}`)
                : friendlyTime(lastCompleted.scheduledTime, lang)}
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </Link>
      )}

      {/* Services */}
      <section aria-labelledby="book-service">
        <div className="section-head" style={{ marginBottom: '8px' }}>
          <h2 id="book-service"><Plus size={18} color="var(--primary)" />{ne ? 'नयाँ भिजिट बुक गर्नुहोस्' : 'Book a new visit'}</h2>
          <Link to="/services">{ne ? 'सबै' : 'All'}</Link>
        </div>
        <div className="svc-grid">
          {services.length === 0
            ? [0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '108px' }} />)
            : services.slice(0, 8).map(s => (
              <Link key={s._id} to={`/book?service=${s._id}`} className="svc-tile">
                <span className="e">{s.icon || '🏥'}</span>
                <span className="t">{s.displayName?.[lang] || s.displayName?.ne}</span>
                <span className="p">रु. {s.basePriceRange?.min}+</span>
              </Link>
            ))}
        </div>
      </section>

      {profileIncomplete && (
        <div className="alert alert-warn">
          📍 {ne
            ? 'छिटो बुकिङको लागि माथि आफ्नो नाममा थिचेर घरको ठेगाना र वडा सेभ गर्नुहोस्।'
            : 'Tap your name at the top to save your home address and ward for faster booking.'}
        </div>
      )}

      {/* Phone booking help */}
      <a href={`tel:${HOTLINE}`} className="card row-item" style={{ padding: '14px', borderRadius: 'var(--radius-md)' }}>
        <Phone size={20} color="var(--primary)" />
        <div className="ri-main">
          <div className="ri-title">{ne ? 'फोनबाट बुक गर्न चाहनुहुन्छ?' : 'Prefer to book by phone?'}</div>
          <div className="ri-sub">{HOTLINE_DISPLAY} — {ne ? 'हाम्रो टोलीले बुकिङ गरिदिन्छ' : 'our team will book it for you'}</div>
        </div>
        <ChevronRight size={18} color="var(--text-muted)" />
      </a>

      {bookings && bookings.length > 0 && (
        <Link to="/my-bookings" className="btn btn-outline">
          {ne ? 'सबै बुकिङ इतिहास हेर्नुहोस्' : 'See all my bookings'}
        </Link>
      )}
    </div>
  );
};
