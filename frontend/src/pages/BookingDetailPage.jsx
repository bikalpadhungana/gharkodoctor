import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Calendar, Clock, MapPin, Phone, ShieldCheck, Star, AlertCircle, CheckCircle, XCircle, MessageSquare, FileText } from 'lucide-react';

export const BookingDetailPage = () => {
  const { id } = useParams();
  const { lang, token, user } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancel state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Review state
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id, token]);

  const fetchBooking = async () => {
    try {
      const res = await api.getBooking(id, token);
      if (res.success) {
        setBooking(res.booking);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    setCancelLoading(true);
    try {
      const res = await api.updateBookingStatus(id, 'cancelled', cancelReason, token);
      if (res.success) {
        setShowCancelModal(false);
        fetchBooking();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createReview({
        bookingId: id,
        rating,
        comment: reviewComment
      }, token);

      if (res.success) {
        setReviewSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="container" style={{ paddingTop: '30px', textAlign: 'center' }}>{lang === 'ne' ? 'लोड हुँदैछ...' : 'Loading details...'}</div>;
  }

  if (!booking) {
    return <div className="container" style={{ paddingTop: '30px', textAlign: 'center' }}>{lang === 'ne' ? 'बुकिङ फेला परेन' : 'Booking not found'}</div>;
  }

  const serviceTitle = booking.serviceType?.displayName?.[lang] || booking.serviceType?.displayName?.ne;
  const dateStr = new Date(booking.scheduledTime).toLocaleString(lang === 'ne' ? 'ne-NP' : 'en-US', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const canCancel = ['requested', 'confirmed'].includes(booking.status);

  return (
    <div className="container" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="flex-between">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Booking ID: #{booking._id.substring(18)}
          </span>
          <StatusBadge status={booking.status} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '2rem' }}>{booking.serviceType?.icon || '🏥'}</span>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{serviceTitle}</h2>
            <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 700 }}>
              रु. {booking.amount} ({booking.paymentMethod.toUpperCase()} - {booking.paymentStatus})
            </span>
          </div>
        </div>
      </div>

      {/* Date & Location */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {lang === 'ne' ? 'समय र स्थान' : 'Schedule & Location'}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
          <Clock size={18} color="var(--primary)" />
          <span>{dateStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem' }}>
          <MapPin size={18} color="var(--primary)" style={{ marginTop: '2px' }} />
          <div>
            <strong>{booking.address}</strong>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {lang === 'ne' ? `वडा नम्बर ${booking.ward}, ${booking.municipality}` : `Ward No. ${booking.ward}, ${booking.municipality}`}
            </div>
          </div>
        </div>

        {booking.notes && (
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary)' }}>
            <strong>{lang === 'ne' ? 'नोट:' : 'Note:'}</strong> {booking.notes}
          </div>
        )}

        {/* SMS Notification Banner */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MessageSquare size={14} />
          <span>{lang === 'ne' ? 'SMS सूचना:' : 'SMS Updates:'} {booking.patient?.phone} {lang === 'ne' ? 'मा एसएमएस पठाइएको छ' : 'SMS notifications active'}</span>
        </div>
      </div>

      {/* Assigned Provider */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          {lang === 'ne' ? 'तोकिएको स्वास्थ्यकर्मी' : 'Assigned Health Provider'}
        </h4>

        {booking.provider ? (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
              {booking.provider.name.charAt(0)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '1rem' }}>{booking.provider.name}</strong>
                <StatusBadge status={booking.provider.verificationStatus} type="verification" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '0.8rem' }}>
                <a href={`tel:${booking.provider.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} />
                  <span>{booking.provider.phone}</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px', background: '#fef3c7', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#b45309' }}>
            ⏳ {lang === 'ne' ? 'तपाईंको नजिकको प्रमाणीकृत स्वास्थ्यकर्मी मिलाइँदैछ...' : 'Assigning nearest verified provider...'}
          </div>
        )}
      </div>

      {/* Medical Visit Report Section (If available) */}
      {booking.visitReport && (booking.visitReport.summary || booking.visitReport.completedTasks?.length > 0 || booking.visitReport.documents?.length > 0) && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', border: '1.5px solid var(--primary-light)', background: '#fafdfd' }}>
          <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={18} />
              {lang === 'ne' ? 'स्वास्थ्यकर्मीको मेडिकल रिपोर्ट र विवरण' : 'Medical Visit Report & Prescription'}
            </h4>
            {booking.visitReport.completedAt && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(booking.visitReport.completedAt).toLocaleString(lang === 'ne' ? 'ne-NP' : 'en-US')}
              </span>
            )}
          </div>

          {/* Vital Signs Grid */}
          {booking.visitReport.vitalSigns && (booking.visitReport.vitalSigns.bp || booking.visitReport.vitalSigns.pulse || booking.visitReport.vitalSigns.temp || booking.visitReport.vitalSigns.spo2) && (
            <div style={{ background: 'white', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                🩺 {lang === 'ne' ? 'भाइटल साईन नतिजा (Vital Signs):' : 'Vital Signs Measurements:'}
              </strong>
              <div className="grid-2" style={{ fontSize: '0.85rem' }}>
                {booking.visitReport.vitalSigns.bp && <div>💓 <strong>BP:</strong> {booking.visitReport.vitalSigns.bp} mmHg</div>}
                {booking.visitReport.vitalSigns.pulse && <div>🫀 <strong>Pulse:</strong> {booking.visitReport.vitalSigns.pulse} BPM</div>}
                {booking.visitReport.vitalSigns.temp && <div>🌡️ <strong>Temp:</strong> {booking.visitReport.vitalSigns.temp} °F</div>}
                {booking.visitReport.vitalSigns.spo2 && <div>🫁 <strong>SpO2:</strong> {booking.visitReport.vitalSigns.spo2} %</div>}
              </div>
            </div>
          )}

          {/* Performed Checklist Tasks */}
          {booking.visitReport.completedTasks && booking.visitReport.completedTasks.length > 0 && (
            <div>
              <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                ✅ {lang === 'ne' ? 'सम्पन्न गरिएका स्वास्थ्य कार्यहरू:' : 'Completed Healthcare Tasks:'}
              </strong>
              <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {booking.visitReport.completedTasks.map((task, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                    <CheckCircle size={14} color="var(--primary)" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medical Summary Notes */}
          {booking.visitReport.summary && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-main)', borderLeft: '3px solid var(--primary)' }}>
              <strong>📋 {lang === 'ne' ? 'स्वास्थ्यकर्मीको सल्लाह र टिप्पणी:' : 'Clinical Notes & Advice:'}</strong>
              <p style={{ marginTop: '4px', whiteSpace: 'pre-line' }}>{booking.visitReport.summary}</p>
            </div>
          )}

          {/* Attached Medical Documents / Lab Photos */}
          {booking.visitReport.documents && booking.visitReport.documents.length > 0 && (
            <div>
              <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                📎 {lang === 'ne' ? 'संलग्न मेडिकल कागजात र फोटोहरू:' : 'Attached Prescriptions & Medical Documents:'}
              </strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
                {booking.visitReport.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.fileData}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px',
                      textDecoration: 'none',
                      color: 'var(--text-main)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {doc.fileData?.startsWith('data:image/') ? (
                      <img src={doc.fileData} alt={doc.name} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '4px' }} />
                    ) : (
                      <div style={{ width: '100%', height: '80px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center', fontSize: '1.5rem', marginBottom: '4px' }}>
                        📄
                      </div>
                    )}
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancellation Section */}
      {canCancel && (
        <div style={{ marginTop: '8px' }}>
          {!showCancelModal ? (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn btn-outline"
              style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              <XCircle size={16} />
              <span>{lang === 'ne' ? 'बुकिङ रद्द गर्नुहोस्' : 'Cancel Booking'}</span>
            </button>
          ) : (
            <div className="card" style={{ background: '#fff1f2', borderColor: '#fecdd3' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '8px' }}>
                {lang === 'ne' ? 'रद्द गर्ने कारण लेख्नुहोस्:' : 'Reason for Cancellation:'}
              </h4>
              <form onSubmit={handleCancelBooking} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ne' ? 'उदा: समय मिलेन / स्वास्थ्यमा सुधार आयो' : 'e.g., Schedule conflict / No longer needed'}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-danger" disabled={cancelLoading} style={{ flex: 1 }}>
                    {cancelLoading ? 'कन्फर्म हुँदैछ...' : (lang === 'ne' ? 'पुष्टि गर्नुहोस्' : 'Confirm Cancel')}
                  </button>
                  <button type="button" onClick={() => setShowCancelModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                    {lang === 'ne' ? 'फिर्ता हुनुहोस्' : 'Keep Booking'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Review Box (If completed) */}
      {booking.status === 'completed' && user?.role === 'patient' && (
        <div className="card">
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>
            ⭐ {lang === 'ne' ? 'सेवाको अनुभव र रेटिङ दिनुहोस्' : 'Rate Your Visit Experience'}
          </h4>

          {reviewSubmitted ? (
            <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={18} />
              <span>{lang === 'ne' ? 'रेटिङ दिनुभएकोमा धन्यवाद!' : 'Thank you for your rating!'}</span>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={28}
                    fill={star <= rating ? 'var(--secondary)' : 'none'}
                    color="var(--secondary)"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>

              <textarea
                className="form-textarea"
                rows={2}
                placeholder={lang === 'ne' ? 'कस्तो लाग्यो सेवा? संक्षिप्त प्रतिक्रिया दिनुहोस्...' : 'How was the service? Write brief feedback...'}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />

              <button type="submit" className="btn btn-secondary" style={{ width: 'auto', alignSelf: 'flex-start' }}>
                {lang === 'ne' ? 'प्रतिक्रिया बुझाउनुहोस्' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
