import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { VisitReportModal } from '../components/VisitReportModal';
import { Calendar, CheckCircle2, Truck, Phone, MapPin, AlertTriangle, ShieldAlert, FileText } from 'lucide-react';

export const ProviderDashboardPage = () => {
  const { lang, token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      const res = await api.getProviderBookings(token);
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await api.updateBookingStatus(bookingId, newStatus, '', token);
      if (res.success) {
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (user?.verificationStatus === 'pending') {
    return (
      <div className="container" style={{ paddingTop: '30px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'प्रमाणीकरण विचाराधीन छ' : 'Verification Under Review'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            {lang === 'ne'
              ? 'तपाईंको कागजात र नागरिकता एडमिनले जाँच गर्दैहुनुहुन्छ। स्वीकृत भएपछि बुकिङ प्राप्त हुन थाल्नेछ।'
              : 'Our dispatch team is reviewing your credentials. You will start receiving visit requests once approved.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats Summary */}
      <div className="card card-gradient">
        <div className="flex-between">
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{user?.name}</span>
          <a href="/provider/profile" style={{ color: 'white', fontSize: '0.75rem', textDecoration: 'underline', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 'var(--radius-full)' }}>
            ⚙️ {lang === 'ne' ? 'प्रोफाइल र सेवा दूरी' : 'Edit Profile & Radius'}
          </a>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
          {lang === 'ne' ? 'स्वास्थ्य प्रदायक ड्यासबोर्ड' : 'Provider Dashboard'}
        </h2>
        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{user?.completedVisits || 0}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{lang === 'ne' ? 'सम्पन्न भिजिट' : 'Completed'}</div>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>⭐ {user?.rating || 'New'}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{lang === 'ne' ? 'औसत रेटिङ' : 'Rating'}</div>
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>📍 {user?.serviceRadiusKm || 5} KM</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{lang === 'ne' ? 'सेवा दूरी' : 'Coverage Radius'}</div>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
        {lang === 'ne' ? 'तपाईंको भिजिट कार्यहरू' : 'Assigned Visit Tasks'}
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'लोड हुँदैछ...' : 'Loading visits...'}</div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          {lang === 'ne' ? 'अहिले कुनै असाइन गरिएको बुकिङ छैन' : 'No visits currently assigned'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bookings.map(b => {
            const serviceTitle = b.serviceType?.displayName?.[lang] || b.serviceType?.displayName?.ne;
            const dateStr = new Date(b.scheduledTime).toLocaleString(lang === 'ne' ? 'ne-NP' : 'en-US', {
              dateStyle: 'short',
              timeStyle: 'short'
            });

            return (
              <div key={b._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="flex-between">
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{serviceTitle}</h4>
                  <StatusBadge status={b.status} />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>📅 {dateStr}</div>
                  <div>📍 <strong>{b.patient?.name}</strong> — {b.address}, वडा {b.ward}</div>
                  <a href={`tel:${b.patient?.phone}`} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={14} />
                    <span>{b.patient?.phone}</span>
                  </a>
                </div>

                {/* Status action buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(b._id, 'en_route')}
                      className="btn btn-secondary"
                      style={{ padding: '8px', fontSize: '0.85rem' }}
                    >
                      <Truck size={16} />
                      <span>{lang === 'ne' ? 'घरतिर निस्किएँ (En Route)' : 'Start Travel (En Route)'}</span>
                    </button>
                  )}

                  {b.status === 'en_route' && (
                    <button
                      onClick={() => setSelectedBookingForReport(b)}
                      className="btn btn-primary"
                      style={{ padding: '8px', fontSize: '0.85rem' }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{lang === 'ne' ? 'सेवा सम्पन्न र रिपोर्ट बुझाउनुहोस्' : 'Submit Visit Report & Complete'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VisitReportModal
        isOpen={Boolean(selectedBookingForReport)}
        onClose={() => setSelectedBookingForReport(null)}
        booking={selectedBookingForReport}
        onReportSubmitted={() => {
          fetchBookings();
          setSelectedBookingForReport(null);
        }}
      />
    </div>
  );
};
