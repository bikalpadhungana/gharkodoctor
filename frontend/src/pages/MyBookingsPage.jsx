import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Calendar, Clock, MapPin, ChevronRight, User } from 'lucide-react';

export const MyBookingsPage = () => {
  const { lang, token, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchBookings = async () => {
      try {
        const res = await api.getMyBookings(token);
        if (res.success) {
          setBookings(res.bookings);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [token, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <p>{lang === 'ne' ? 'कृपया पहिले लगइन गर्नुहोस्' : 'Please login first'}</p>
        <Link to="/login" className="btn btn-primary" style={{ width: 'auto', marginTop: '12px' }}>
          {lang === 'ne' ? 'लगइन गर्नुहोस्' : 'Login'}
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          {lang === 'ne' ? 'मेरो बुकिङहरू' : 'My Bookings'}
        </h2>
        <Link to="/services" className="btn btn-outline" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>
          + {lang === 'ne' ? 'नयाँ बुकिङ' : 'New Visit'}
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {lang === 'ne' ? 'लोड हुँदैछ...' : 'Loading bookings...'}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <Calendar size={36} color="var(--text-muted)" style={{ marginBottom: '10px' }} />
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{lang === 'ne' ? 'कुनै पनि बुकिङ फेला परेन' : 'No Bookings Found'}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>
            {lang === 'ne' ? 'तपाईंले अहिलेसम्म कुनै घर भिजिट सेवा बुक गर्नुभएको छैन।' : 'You have not booked any home visits yet.'}
          </p>
          <Link to="/services" className="btn btn-primary" style={{ width: 'auto', margin: '0 auto' }}>
            {lang === 'ne' ? 'सेवाहरू हेर्नुहोस्' : 'Browse Services'}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bookings.map((booking) => {
            const serviceTitle = booking.serviceType?.displayName?.[lang] || booking.serviceType?.displayName?.ne;
            const dateStr = new Date(booking.scheduledTime).toLocaleDateString(lang === 'ne' ? 'ne-NP' : 'en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <Link
                key={booking._id}
                to={`/booking/${booking._id}`}
                className="card"
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <div className="flex-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.4rem' }}>{booking.serviceType?.icon || '🏥'}</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{serviceTitle}</h3>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="var(--primary)" />
                    <span>{dateStr}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span>{booking.address}, वडा {booking.ward}</span>
                  </div>

                  {booking.provider && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>
                      <User size={14} color="var(--secondary)" />
                      <span>{booking.provider.name} ({lang === 'ne' ? 'स्वास्थ्यकर्मी' : 'Provider'})</span>
                    </div>
                  )}
                </div>

                <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                    रु. {booking.amount} ({booking.paymentMethod.toUpperCase()})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                    <span>{lang === 'ne' ? 'विवरण हेर्नुहोस्' : 'Details'}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
