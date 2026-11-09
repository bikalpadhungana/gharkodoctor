import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PageLoader } from '../components/PageLoader';
import { Clock, MapPin, ChevronRight, User, Plus, RotateCcw } from 'lucide-react';
import { isActive, serviceName, friendlyTime } from '../utils/booking';

export const MyBookingsPage = () => {
  const { lang, token } = useAuth();
  const ne = lang === 'ne';
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    let cancelled = false;
    api.getMyBookings(token).then(res => {
      if (cancelled) return;
      if (res.success) setBookings(res.bookings);
      else { setBookings([]); setError(res.message || ''); }
    });
    return () => { cancelled = true; };
  }, [token]);

  if (bookings === null) return <PageLoader />;

  const upcoming = bookings.filter(isActive).sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
  const past = bookings.filter(b => !isActive(b));
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="container dash">
      <div className="section-head">
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{ne ? 'मेरो बुकिङहरू' : 'My Bookings'}</h1>
        <Link to="/services" className="btn btn-primary" style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}>
          <Plus size={16} /> {ne ? 'नयाँ भिजिट' : 'New visit'}
        </Link>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          {ne ? 'आगामी' : 'Upcoming'} <span className="count-pill">{upcoming.length}</span>
        </button>
        <button role="tab" aria-selected={tab === 'past'} onClick={() => setTab('past')}>
          {ne ? 'पुराना' : 'Past'} <span className="count-pill">{past.length}</span>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="card empty-state">
          <div className="e">{tab === 'upcoming' ? '📅' : '🗂️'}</div>
          <h3>{tab === 'upcoming' ? (ne ? 'कुनै आगामी भिजिट छैन' : 'No upcoming visits') : (ne ? 'कुनै पुरानो बुकिङ छैन' : 'No past bookings yet')}</h3>
          {tab === 'upcoming' && (
            <Link to="/services" className="btn btn-primary" style={{ width: 'auto', margin: '14px auto 0' }}>
              {ne ? 'सेवा छान्नुहोस्' : 'Choose a service'}
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {list.map(b => (
            <div key={b._id} className="card visit-card" style={{ opacity: b.status === 'cancelled' ? 0.75 : 1 }}>
              <Link to={`/booking/${b._id}`} className="vc-top" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="vc-icon">{b.serviceType?.icon || '🏥'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex-between" style={{ gap: '8px' }}>
                    <div className="vc-title">{serviceName(b, lang)}</div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="vc-meta">
                    <span><Clock size={13} style={{ verticalAlign: '-2px' }} /> {friendlyTime(b.scheduledTime, lang)}</span>
                    <span><MapPin size={13} style={{ verticalAlign: '-2px' }} /> {b.address}{b.ward ? `, ${ne ? 'वडा' : 'Ward'} ${b.ward}` : ''}</span>
                    {b.provider && <span><User size={13} style={{ verticalAlign: '-2px' }} /> {b.provider.name}</span>}
                  </div>
                </div>
              </Link>
              <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  रु. {b.amount} · {b.paymentMethod?.toUpperCase()}
                  {b.paymentStatus === 'paid' && <span style={{ color: 'var(--success)' }}> · {ne ? 'भुक्तानी भयो' : 'Paid'}</span>}
                </span>
                {tab === 'past' && b.serviceType?._id ? (
                  <Link to={`/book?service=${b.serviceType._id}`} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RotateCcw size={14} /> {ne ? 'फेरि बुक' : 'Book again'}
                  </Link>
                ) : (
                  <Link to={`/booking/${b._id}`} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    {ne ? 'विवरण' : 'Details'} <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
