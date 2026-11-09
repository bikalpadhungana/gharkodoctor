import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { VisitReportModal } from '../components/VisitReportModal';
import { PageLoader } from '../components/PageLoader';
import { useFlash } from '../components/Flash';
import { CheckCircle2, Truck, Phone, XCircle, Navigation, Clock, MapPin, RefreshCw, Settings, BellRing } from 'lucide-react';
import { serviceName, friendlyTime, isToday, greeting, mapsLink } from '../utils/booking';
import { HOTLINE, HOTLINE_DISPLAY } from '../config';

const VerificationState = ({ status, notes, lang }) => {
  const ne = lang === 'ne';
  const pending = status === 'pending';
  return (
    <div className="container dash">
      <div className="card" style={{ textAlign: 'center', padding: '28px 20px' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: '10px' }}>{pending ? '⏳' : '📄'}</div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
          {pending
            ? (ne ? 'प्रमाणीकरण विचाराधीन छ' : 'Verification under review')
            : (ne ? 'प्रमाणीकरण स्वीकृत हुन सकेन' : 'Verification not approved')}
        </h1>
        {!pending && notes && <p className="alert alert-warn" style={{ marginTop: '12px', textAlign: 'left' }}>{notes}</p>}
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          {pending
            ? (ne ? 'हाम्रो टोलीले तपाईंको नागरिकता र कागजात जाँच गर्दैछ। स्वीकृत भएपछि SMS आउनेछ र बुकिङ प्राप्त हुन थाल्नेछ।'
                  : "Our team is checking your citizenship and documents. You'll get an SMS once approved, and visits will start coming in.")
            : (ne ? 'कागजात अद्यावधिक गर्न वा थप जानकारीको लागि हाम्रो टोलीलाई सम्पर्क गर्नुहोस्।'
                  : 'Please contact our team to update your documents or learn more.')}
        </p>
      </div>

      {pending && (
        <div className="card">
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '10px' }}>{ne ? 'यस बीचमा' : 'Meanwhile'}</h2>
          <div className="row-list">
            <Link to="/provider/profile" className="row-item">
              <Settings size={18} color="var(--primary)" />
              <div className="ri-main">
                <div className="ri-title">{ne ? 'प्रोफाइल र सेवा क्षेत्र पूरा गर्नुहोस्' : 'Complete your profile & service area'}</div>
                <div className="ri-sub">{ne ? 'पूरा प्रोफाइलले छिटो स्वीकृत हुन मद्दत गर्छ' : 'A complete profile speeds up approval'}</div>
              </div>
            </Link>
            <a href={`tel:${HOTLINE}`} className="row-item">
              <Phone size={18} color="var(--primary)" />
              <div className="ri-main">
                <div className="ri-title">{ne ? 'टोलीलाई फोन गर्नुहोस्' : 'Call our team'}</div>
                <div className="ri-sub">{HOTLINE_DISPLAY}</div>
              </div>
            </a>
          </div>
        </div>
      )}
      {!pending && (
        <a href={`tel:${HOTLINE}`} className="btn btn-primary"><Phone size={16} /> {HOTLINE_DISPLAY}</a>
      )}
    </div>
  );
};

export const ProviderDashboardPage = () => {
  const { lang, token, user, refreshUser } = useAuth();
  const ne = lang === 'ne';
  const [bookings, setBookings] = useState(null);
  const [tab, setTab] = useState('today');
  const [reportFor, setReportFor] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [flash, showFlash] = useFlash();

  const fetchBookings = useCallback(async () => {
    const res = await api.getProviderBookings(token);
    setBookings(res.success ? res.bookings : []);
    if (!res.success) showFlash(res.message || 'Failed to load', 'error');
  }, [token, showFlash]);

  useEffect(() => {
    // Login response is minimal; pull fresh stats + verification status.
    refreshUser();
    fetchBookings();
  }, [fetchBookings, refreshUser]);

  // Poll for newly assigned visits while the dashboard is open and visible.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && fetchBookings(), 60000);
    return () => clearInterval(t);
  }, [fetchBookings]);

  const updateStatus = async (bookingId, status, reason = '', okMsg) => {
    setBusyId(bookingId);
    const res = await api.updateBookingStatus(bookingId, status, reason, token);
    setBusyId(null);
    if (res.success) {
      showFlash(okMsg || (ne ? 'अपडेट भयो' : 'Updated'));
      fetchBookings();
    } else {
      showFlash(res.message || (ne ? 'अपडेट गर्न सकिएन' : 'Update failed'), 'error');
    }
  };

  const release = (b) => {
    const reason = window.prompt(ne ? 'किन जान सक्नुहुन्न? (डिस्प्याचले अर्को स्वास्थ्यकर्मी पठाउनेछ)' : "Why can't you make it? (dispatch will reassign the visit)");
    if (reason === null) return;
    updateStatus(b._id, 'cancelled', reason || 'Provider unavailable', ne ? 'डिस्प्याचमा फिर्ता पठाइयो' : 'Sent back to dispatch');
  };

  if (user?.verificationStatus === 'pending' || user?.verificationStatus === 'rejected') {
    return <VerificationState status={user.verificationStatus} notes={user.verificationNotes} lang={lang} />;
  }
  if (bookings === null) return <PageLoader />;

  const requests = bookings.filter(b => b.status === 'requested');
  const open = bookings
    .filter(b => ['confirmed', 'en_route'].includes(b.status))
    .sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  const today = open.filter(b => isToday(b.scheduledTime) || b.status === 'en_route' || new Date(b.scheduledTime) < new Date());
  const upcoming = open.filter(b => !today.includes(b));
  const history = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
  const completedToday = history.filter(b => b.status === 'completed' && b.visitReport?.completedAt && isToday(b.visitReport.completedAt)).length;
  const lists = { today, upcoming, history };
  const firstName = user?.name?.split(' ')[0] || '';

  const VisitCard = ({ b, highlight }) => {
    const isAssigned = b.status !== 'requested';
    return (
      <div className={`card visit-card ${b.status === 'requested' ? 'attention' : highlight ? 'highlight' : ''}`}>
        <div className="vc-top">
          <div className="vc-icon">{b.serviceType?.icon || '🏥'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex-between" style={{ gap: '8px' }}>
              <div className="vc-title">{serviceName(b, lang)}</div>
              <StatusBadge status={b.status} />
            </div>
            <div className="vc-meta">
              <span><Clock size={13} style={{ verticalAlign: '-2px' }} /> <strong style={{ color: 'var(--text-main)' }}>{friendlyTime(b.scheduledTime, lang)}</strong></span>
              <span>
                <MapPin size={13} style={{ verticalAlign: '-2px' }} /> {b.patient?.name}
                {b.address ? ` — ${b.address}` : ''}{(b.ward || b.patient?.ward) ? `, ${ne ? 'वडा' : 'Ward'} ${b.ward || b.patient?.ward}` : ''}
              </span>
              {b.notes && <span>📝 {b.notes}</span>}
              {!isAssigned && (
                <span>🔒 {ne ? 'स्वीकार गरेपछि फोन र पूरा ठेगाना देखिनेछ' : 'Phone and full address appear after you accept'}</span>
              )}
            </div>
          </div>
        </div>

        {['confirmed', 'en_route', 'requested'].includes(b.status) && (
          <div className="vc-actions">
            {b.status === 'requested' && (
              <button className="btn btn-primary" disabled={busyId === b._id}
                onClick={() => updateStatus(b._id, 'confirmed', '', ne ? 'भिजिट स्वीकार गरियो' : 'Visit accepted')}>
                <CheckCircle2 size={16} /> {ne ? 'स्वीकार गर्नुहोस्' : 'Accept visit'}
              </button>
            )}
            {isAssigned && b.patient?.phone && (
              <a href={`tel:${b.patient.phone}`} className="btn btn-outline"><Phone size={16} /> {ne ? 'फोन' : 'Call'}</a>
            )}
            {isAssigned && b.address && (
              <a href={mapsLink(b)} target="_blank" rel="noreferrer" className="btn btn-outline"><Navigation size={16} /> {ne ? 'नक्सा' : 'Map'}</a>
            )}
            {b.status === 'confirmed' && (
              <button className="btn btn-secondary" disabled={busyId === b._id}
                onClick={() => updateStatus(b._id, 'en_route', '', ne ? 'बिरामीलाई SMS पठाइयो' : 'Patient notified by SMS')}>
                <Truck size={16} /> {ne ? 'निस्किएँ' : 'Start travel'}
              </button>
            )}
            {b.status === 'en_route' && (
              <button className="btn btn-primary" onClick={() => setReportFor(b)}>
                <CheckCircle2 size={16} /> {ne ? 'रिपोर्ट बुझाई सम्पन्न' : 'Complete with report'}
              </button>
            )}
          </div>
        )}
        {b.status === 'confirmed' && (
          <button type="button" onClick={() => release(b)} disabled={busyId === b._id}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', padding: '4px 0', fontFamily: 'inherit' }}>
            <XCircle size={13} style={{ verticalAlign: '-2px' }} /> {ne ? 'जान सक्दिनँ' : "Can't make it"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="container dash">
      <div className="greet">
        <div className="flex-between">
          <small>{greeting(lang)},</small>
          <Link to="/provider/profile" style={{ color: '#fff', fontSize: '0.78rem', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 'var(--radius-full)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Settings size={13} /> {ne ? 'प्रोफाइल' : 'Profile'}
          </Link>
        </div>
        <h1>{firstName} 👩‍⚕️</h1>
        <div className="greet-stats">
          <div><b>{today.length}</b><span>{ne ? 'आजका भिजिट' : 'Visits today'}</span></div>
          <div><b>{completedToday}</b><span>{ne ? 'आज सम्पन्न' : 'Done today'}</span></div>
          <div><b>{user?.completedVisits || 0}</b><span>{ne ? 'जम्मा सम्पन्न' : 'Total done'}</span></div>
          <div><b>⭐ {user?.rating > 0 ? user.rating : (ne ? 'नयाँ' : 'New')}</b><span>{ne ? 'रेटिङ' : 'Rating'}</span></div>
        </div>
      </div>

      {requests.length > 0 && (
        <section>
          <div className="section-head" style={{ marginBottom: '8px' }}>
            <h2><BellRing size={18} color="#d97706" /> {ne ? 'तपाईंको जवाफ कुर्दै' : 'Waiting for your answer'} <span className="count-pill warn">{requests.length}</span></h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requests.map(b => <VisitCard key={b._id} b={b} />)}
          </div>
        </section>
      )}

      <div className="section-head">
        <div className="segmented" role="tablist" style={{ flex: 1 }}>
          <button role="tab" aria-selected={tab === 'today'} onClick={() => setTab('today')}>
            {ne ? 'आज' : 'Today'} <span className="count-pill">{today.length}</span>
          </button>
          <button role="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
            {ne ? 'आगामी' : 'Upcoming'} <span className="count-pill">{upcoming.length}</span>
          </button>
          <button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>
            {ne ? 'इतिहास' : 'History'}
          </button>
        </div>
        <button className="icon-btn" onClick={fetchBookings} aria-label={ne ? 'रिफ्रेस' : 'Refresh'}><RefreshCw size={18} /></button>
      </div>

      {lists[tab].length === 0 ? (
        <div className="card empty-state">
          <div className="e">{tab === 'history' ? '🗂️' : '☕'}</div>
          <h3>
            {tab === 'today' ? (ne ? 'आज कुनै भिजिट छैन' : 'No visits today')
              : tab === 'upcoming' ? (ne ? 'कुनै आगामी भिजिट छैन' : 'No upcoming visits')
              : (ne ? 'अहिलेसम्म इतिहास छैन' : 'No history yet')}
          </h3>
          {tab !== 'history' && <p>{ne ? 'नयाँ भिजिट तोकिँदा SMS आउनेछ।' : "You'll get an SMS when a visit is assigned."}</p>}
        </div>
      ) : tab === 'history' ? (
        <div className="row-list">
          {history.map(b => (
            <Link key={b._id} to={`/booking/${b._id}`} className="row-item">
              <span style={{ fontSize: '1.3rem' }}>{b.serviceType?.icon || '🏥'}</span>
              <div className="ri-main">
                <div className="ri-title">{serviceName(b, lang)} · {b.patient?.name}</div>
                <div className="ri-sub">{friendlyTime(b.scheduledTime, lang)} · रु. {b.amount}</div>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lists[tab].map((b, i) => <VisitCard key={b._id} b={b} highlight={tab === 'today' && i === 0} />)}
        </div>
      )}

      <VisitReportModal
        isOpen={Boolean(reportFor)}
        onClose={() => setReportFor(null)}
        booking={reportFor}
        onReportSubmitted={() => {
          setReportFor(null);
          showFlash(ne ? 'भिजिट सम्पन्न भयो 🎉' : 'Visit completed 🎉');
          fetchBookings();
          refreshUser();
        }}
      />
      {flash}
    </div>
  );
};
