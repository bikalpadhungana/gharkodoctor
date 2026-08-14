import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { FlapMainTestPanel } from '../components/FlapMainTestPanel';
import { ShieldCheck, Users, Calendar, Check, X, PhoneCall, RefreshCw, AlertCircle, PlusCircle, Map, CreditCard, UserCheck, FileText, Activity, ShieldAlert, History, Lock, Radio } from 'lucide-react';

export const AdminDashboardPage = () => {
  const { lang, token, user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'bookings' | 'phonein' | 'users' | 'audit'
  const [stats, setStats] = useState(null);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [verifiedProviders, setVerifiedProviders] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [usersList, setUsersList] = useState({ patients: [], providers: [], admins: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Phone-in form state
  const [phoneForm, setPhoneForm] = useState({
    patientName: '',
    patientPhone: '',
    serviceType: '',
    scheduledTime: '',
    address: '',
    ward: '',
    municipality: 'Kathmandu',
    notes: '',
    amount: ''
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [phoneSubmitLoading, setPhoneSubmitLoading] = useState(false);
  const [phoneSubmitSuccess, setPhoneSubmitSuccess] = useState('');
  const [phoneSubmitError, setPhoneSubmitError] = useState('');

  const handleLocationSelected = (loc) => {
    setPhoneForm(prev => ({
      ...prev,
      address: loc.address || prev.address,
      ward: loc.ward || prev.ward,
      municipality: loc.municipality || prev.municipality
    }));
  };

  useEffect(() => {
    loadData();
  }, [token, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, bookingsRes, verifiedRes, servicesRes] = await Promise.all([
        api.getAdminStats(token),
        api.getPendingProviders(token),
        api.getAllBookings(token),
        api.getAllProviders(token, 'verified'),
        api.getServices()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (pendingRes.success) setPendingProviders(pendingRes.providers);
      if (bookingsRes.success) setAllBookings(bookingsRes.bookings);
      if (verifiedRes.success) setVerifiedProviders(verifiedRes.providers);
      if (servicesRes.success) {
        setServiceTypes(servicesRes.serviceTypes);
        if (servicesRes.serviceTypes.length > 0) {
          setPhoneForm(prev => ({ ...prev, serviceType: servicesRes.serviceTypes[0]._id }));
        }
      }

      if (activeTab === 'users') {
        const usersRes = await api.getUsersAndAdmins(token);
        if (usersRes.success) setUsersList(usersRes.users);
      }

      if (activeTab === 'audit') {
        const auditRes = await api.getAuditLogs(token);
        if (auditRes.success) setAuditLogs(auditRes.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (providerId, status) => {
    try {
      const res = await api.verifyProvider(providerId, status, 'Admin reviewed', token);
      if (res.success) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignProvider = async (bookingId, providerId) => {
    try {
      const res = await api.assignProvider(bookingId, providerId, token);
      if (res.success) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyPayment = async (bookingId, paymentStatus) => {
    try {
      const res = await api.verifyPayment(bookingId, paymentStatus, 'cash', 0, 'Verified by Admin', token);
      if (res.success) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePromoteUser = async (userId, targetRole, userType) => {
    try {
      const res = await api.updateUserRole(userId, targetRole, userType, token);
      if (res.success) {
        alert(lang === 'ne' ? `भूमिका परिवर्तन भयो: ${targetRole}` : `User role updated to ${targetRole}!`);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhoneBookingSubmit = async (e) => {
    e.preventDefault();
    setPhoneSubmitError('');
    setPhoneSubmitSuccess('');
    setPhoneSubmitLoading(true);

    try {
      const res = await api.createPhoneInBooking(phoneForm, token);
      if (res.success) {
        setPhoneSubmitSuccess(lang === 'ne' ? `फोन बुकिङ दर्ता भयो! बुकिङ ID: #${res.booking._id.substring(18)}` : `Phone booking created! Booking ID: #${res.booking._id.substring(18)}`);
        setPhoneForm({
          patientName: '',
          patientPhone: '',
          serviceType: serviceTypes[0]?._id || '',
          scheduledTime: '',
          address: '',
          ward: '',
          municipality: 'Kathmandu',
          notes: '',
          amount: ''
        });
        loadData();
      } else {
        setPhoneSubmitError(res.message || 'Booking failed');
      }
    } catch (err) {
      setPhoneSubmitError(lang === 'ne' ? 'फोन बुकिङ गर्दा त्रुटि भयो' : 'Server error creating phone booking');
    } finally {
      setPhoneSubmitLoading(false);
    }
  };

  return (
    <div className="container desktop-wide" style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="flex-between">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            🛡️ {isSuperAdmin
              ? (lang === 'ne' ? 'सुपर एडमिन कन्ट्रोल सेन्टर' : 'Super Admin Control Center')
              : (lang === 'ne' ? 'घरको डाक्टर एडमिन र डिस्प्याच प्यानल' : 'GharkoDoctor Admin Dispatch Panel')}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
            {lang === 'ne' ? 'लगइन प्रयोगकर्ता:' : 'Logged in as:'} {currentUser?.name} ({currentUser?.role?.toUpperCase()})
          </span>
        </div>
        <button onClick={loadData} className="btn btn-outline" style={{ width: 'auto', padding: '6px 12px' }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Overview Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.pendingVerifications}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'विचाराधीन प्रदायक' : 'Pending Providers'}</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{stats.verifiedProviders}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'प्रमाणीकृत प्रदायक' : 'Verified Providers'}</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary-hover)' }}>{stats.activeBookings}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'सक्रिय भिजिटहरू' : 'Active Visits'}</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '12px' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>रु. {stats.totalRevenue}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'प्रमाणीकृत राजस्व' : 'Verified Revenue'}</div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('pending')}
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <ShieldCheck size={16} />
          <span>{lang === 'ne' ? 'प्रमाणीकरण' : 'Verifications'} ({pendingProviders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-outline'}`}
          style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <Calendar size={16} />
          <span>{lang === 'ne' ? 'बुकिङ र रिपोर्टहरू' : 'Bookings & Reports'} ({allBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('phonein')}
          className={`btn ${activeTab === 'phonein' ? 'btn-primary' : 'btn-outline'}`}
          style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <PhoneCall size={16} />
          <span>{lang === 'ne' ? 'फोन बुकिङ डिस्प्याच' : 'Phone Dispatch'}</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`btn ${activeTab === 'telemetry' ? 'btn-primary' : 'btn-outline'}`}
          style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
        >
          <Radio size={16} />
          <span>{lang === 'ne' ? 'FlapMain उपकरण परीक्षण' : 'FlapMain IoT Test'}</span>
        </button>

        {isSuperAdmin && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <Users size={16} />
              <span>{lang === 'ne' ? 'यूजर र एडमिन प्रबन्धन' : 'User Roles'}</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <History size={16} />
              <span>{lang === 'ne' ? 'अडिट तथा सिस्टम लग' : 'Audit Logs'}</span>
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Pending Provider Verifications */}
      {activeTab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'विचाराधीन प्रमाणीकरण आवेदनहरू (Pending Verifications)' : 'Pending Verification Applications'}
          </h3>

          {pendingProviders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              {lang === 'ne' ? 'कुनै नयाँ आवेदन बाँकी छैन।' : 'No pending applications.'}
            </div>
          ) : (
            pendingProviders.map(p => (
              <div key={p._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="flex-between">
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{p.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                      🏥 {p.category?.displayName?.[lang] || p.category?.displayName?.ne || p.category?.name}
                    </span>
                  </div>
                  <StatusBadge status={p.verificationStatus} type="verification" />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>📞 {lang === 'ne' ? 'फोन:' : 'Phone:'} {p.phone}</div>
                  <div>📍 {lang === 'ne' ? 'ठेगाना:' : 'Address:'} {p.address}, {lang === 'ne' ? 'वडा' : 'Ward'} {p.ward}</div>
                  <div>💳 {lang === 'ne' ? 'नागरिकता नं:' : 'Citizenship No:'} {p.verificationDocs?.citizenshipId || 'N/A'}</div>
                  <div>📜 {lang === 'ne' ? 'लाइसेन्स दर्ता नं:' : 'License No:'} {p.verificationDocs?.licenseNumber || 'N/A'}</div>
                  {p.communityReference && <div style={{ gridColumn: 'span 2' }}>🏛️ {lang === 'ne' ? 'समुदाय सिफारिस:' : 'Community Ref:'} {p.communityReference}</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button onClick={() => handleVerify(p._id, 'verified')} className="btn btn-primary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    <Check size={16} />
                    <span>{lang === 'ne' ? 'स्वीकृत गर्नुहोस् (Approve)' : 'Approve Application'}</span>
                  </button>
                  <button onClick={() => handleVerify(p._id, 'rejected')} className="btn btn-danger" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    <X size={16} />
                    <span>{lang === 'ne' ? 'अस्वीकृत गर्नुहोस् (Reject)' : 'Reject Application'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Bookings & Medical Reports + Payment Verification */}
      {activeTab === 'bookings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'सबै बुकिङहरू, मेडिकल रिपोर्ट र भुक्तानी प्रमाणीकरण' : 'All Bookings, Medical Reports & Payment Verification'}
          </h3>

          {allBookings.map(b => (
            <div key={b._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="flex-between">
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{b.serviceType?.displayName?.[lang] || b.serviceType?.displayName?.ne}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'बिरामी:' : 'Patient:'} {b.patient?.name} ({b.patient?.phone})</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <StatusBadge status={b.status} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: b.paymentStatus === 'paid' ? 'var(--success)' : 'var(--warning-hover)' }}>
                    💳 Payment: {b.paymentStatus.toUpperCase()} (रु. {b.amount})
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div>📅 {new Date(b.scheduledTime).toLocaleString(lang === 'ne' ? 'ne-NP' : 'en-US')}</div>
                <div>📍 {b.address}, {lang === 'ne' ? 'वडा' : 'Ward'} {b.ward}</div>
                {b.provider && <div>👨‍⚕️ <strong>{lang === 'ne' ? 'तोकिएको प्रदायक:' : 'Assigned Provider:'}</strong> {b.provider.name} ({b.provider.phone})</div>}
              </div>

              {/* Super Admin Payment Verification Controls */}
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {lang === 'ne' ? 'भुक्तानी स्थिति प्रमाणीकरण:' : 'Verify Payment Status:'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {b.paymentStatus !== 'paid' && (
                    <button
                      onClick={() => handleVerifyPayment(b._id, 'paid')}
                      className="btn btn-outline"
                      style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem', color: 'var(--success)', borderColor: 'var(--success)' }}
                    >
                      <CreditCard size={14} />
                      <span>{lang === 'ne' ? `भुक्तानी भयो (रु. ${b.amount})` : `Mark Paid (रु. ${b.amount})`}</span>
                    </button>
                  )}
                  {b.paymentStatus !== 'pending' && (
                    <button
                      onClick={() => handleVerifyPayment(b._id, 'pending')}
                      className="btn btn-outline"
                      style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem', color: 'var(--warning)', borderColor: 'var(--warning)' }}
                    >
                      <span>{lang === 'ne' ? 'बाँकी राख्नुहोस्' : 'Mark Pending'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* View Attached Medical Visit Report & Uploaded Files */}
              {b.visitReport && (b.visitReport.summary || b.visitReport.documents?.length > 0 || b.visitReport.completedTasks?.length > 0) && (
                <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                  <div className="flex-between">
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={16} />
                      {lang === 'ne' ? 'चिकित्सकीय रिपोर्ट तथा फाइल' : 'Medical Visit Report & Files'}
                    </span>
                    <button
                      onClick={() => setSelectedBookingDetails(selectedBookingDetails?._id === b._id ? null : b)}
                      className="btn btn-outline"
                      style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                      {selectedBookingDetails?._id === b._id ? (lang === 'ne' ? 'लुकाउनुहोस्' : 'Hide') : (lang === 'ne' ? 'हेर्नुहोस् (Inspect)' : 'Inspect Report')}
                    </button>
                  </div>

                  {selectedBookingDetails?._id === b._id && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      {b.visitReport.vitalSigns && (
                        <div>
                          <strong>🩺 Vitals:</strong> BP: {b.visitReport.vitalSigns.bp || 'N/A'}, Pulse: {b.visitReport.vitalSigns.pulse || 'N/A'}, Temp: {b.visitReport.vitalSigns.temp || 'N/A'}, SpO2: {b.visitReport.vitalSigns.spo2 || 'N/A'}
                        </div>
                      )}
                      {b.visitReport.summary && (
                        <div><strong>📋 Clinical Notes:</strong> {b.visitReport.summary}</div>
                      )}
                      {b.visitReport.documents && b.visitReport.documents.length > 0 && (
                        <div>
                          <strong>📎 Attached Medical Photos & Files ({b.visitReport.documents.length}):</strong>
                          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '6px' }}>
                            {b.visitReport.documents.map((doc, idx) => (
                              <a key={idx} href={doc.fileData} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--primary)' }}>
                                {doc.fileData?.startsWith('data:image/') ? (
                                  <img src={doc.fileData} alt="Document" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                ) : (
                                  <div style={{ width: '60px', height: '60px', background: 'var(--primary-light)', borderRadius: '4px', display: 'grid', placeItems: 'center', fontSize: '1.2rem' }}>📄</div>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Dispatch provider assignment */}
              {b.status === 'requested' && (
                <div style={{ background: '#fffbeb', padding: '10px', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    {lang === 'ne' ? 'स्वास्थ्यकर्मी असाइन गर्नुहोस्:' : 'Assign Verified Provider:'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      className="form-select"
                      style={{ fontSize: '0.85rem', padding: '6px' }}
                      onChange={(e) => e.target.value && handleAssignProvider(b._id, e.target.value)}
                    >
                      <option value="">{lang === 'ne' ? 'प्रदायक छान्नुहोस्...' : 'Select Provider...'}</option>
                      {verifiedProviders.map(vp => (
                        <option key={vp._id} value={vp._id}>
                          {vp.name} ({vp.category?.displayName?.[lang] || vp.category?.displayName?.ne})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Phone-in Booking Creation */}
      {activeTab === 'phonein' && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall color="var(--secondary)" size={20} />
            <span>{lang === 'ne' ? 'फोन मार्फत बुकिङ दर्ता (Call-in Dispatcher Booking)' : 'Phone Call Dispatcher Booking'}</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {lang === 'ne'
              ? 'इन्टरनेट नभएका वा फोन गरेर बुकिङ गर्न चाहने बिरामीको विवरण भरिदिनुहोस्।'
              : 'Enter visit booking details for patients calling over phone helpline.'}
          </p>

          {phoneSubmitSuccess && (
            <div style={{ background: 'var(--success-light)', color: '#15803d', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '12px' }}>
              ✅ {phoneSubmitSuccess}
            </div>
          )}

          {phoneSubmitError && (
            <div style={{ background: 'var(--accent-light)', color: 'var(--accent-hover)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '12px' }}>
              ⚠️ {phoneSubmitError}
            </div>
          )}

          <form onSubmit={handlePhoneBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'बिरामीको नाम *' : 'Patient Name *'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ne' ? 'उदा: राम बहादुर श्रेष्ठ' : 'e.g. Ram Shrestha'}
                  value={phoneForm.patientName}
                  onChange={e => setPhoneForm({ ...phoneForm, patientName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'सम्पर्क फोन नम्बर *' : 'Contact Phone No *'}</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="98XXXXXXXX"
                  value={phoneForm.patientPhone}
                  onChange={e => setPhoneForm({ ...phoneForm, patientPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'सेवा प्रकार *' : 'Service Type *'}</label>
                <select
                  className="form-select"
                  value={phoneForm.serviceType}
                  onChange={e => setPhoneForm({ ...phoneForm, serviceType: e.target.value })}
                  required
                >
                  {serviceTypes.map(st => (
                    <option key={st._id} value={st._id}>
                      {st.displayName?.[lang] || st.displayName?.ne} ({st.icon})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'भिजिट समय *' : 'Scheduled Visit Time *'}</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={phoneForm.scheduledTime}
                  onChange={e => setPhoneForm({ ...phoneForm, scheduledTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>{lang === 'ne' ? 'ठेगाना विवरण' : 'Address Details'}</label>
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="btn btn-outline"
                style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Map size={14} />
                <span>🗺️ {lang === 'ne' ? 'नक्सामा छान्नुहोस्' : 'Choose on Map'}</span>
              </button>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'ठेगाना *' : 'Street Address *'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ne' ? 'उदा: बालुवाटार' : 'e.g. Baluwatar'}
                  value={phoneForm.address}
                  onChange={e => setPhoneForm({ ...phoneForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{lang === 'ne' ? 'वडा नम्बर *' : 'Ward No. *'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="4"
                  value={phoneForm.ward}
                  onChange={e => setPhoneForm({ ...phoneForm, ward: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{lang === 'ne' ? 'थप टिप्पणी' : 'Caller Notes'}</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder={lang === 'ne' ? 'फोनमा भनिएको बिरामीको अवस्था वा विशेष जानकारी...' : 'Special notes or symptoms mentioned over phone...'}
                value={phoneForm.notes}
                onChange={e => setPhoneForm({ ...phoneForm, notes: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-secondary" disabled={phoneSubmitLoading}>
              <PlusCircle size={18} />
              <span>{phoneSubmitLoading ? (lang === 'ne' ? 'बुकिङ बन्दैछ...' : 'Creating...') : (lang === 'ne' ? 'फोन बुकिङ सुरक्षित गर्नुहोस्' : 'Save Phone Booking')}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: User & Role Management (Super Admin) */}
      {activeTab === 'users' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'यूजर, प्रदायक र एडमिन प्रबन्धन' : 'User Roles & Admin Delegation'}
          </h3>

          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
              👑 Admins & Super Admins ({usersList.admins?.length || 0})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usersList.admins?.map(adm => (
                <div key={adm._id} className="flex-between" style={{ padding: '8px', background: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <strong>{adm.name}</strong> ({adm.email})
                    <span className="badge badge-verified" style={{ marginLeft: '8px' }}>{adm.role}</span>
                  </div>
                  {adm._id !== currentUser?._id && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {adm.role !== 'superadmin' && (
                        <button onClick={() => handlePromoteUser(adm._id, 'superadmin', 'admin')} className="btn btn-outline" style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}>
                          Make SuperAdmin
                        </button>
                      )}
                      {adm.role !== 'dispatcher' && (
                        <button onClick={() => handlePromoteUser(adm._id, 'dispatcher', 'admin')} className="btn btn-outline" style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}>
                          Set Dispatcher
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
              🏥 Verified Health Providers ({usersList.providers?.length || 0})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usersList.providers?.map(prov => (
                <div key={prov._id} className="flex-between" style={{ padding: '8px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <div>
                    <strong>{prov.name}</strong> ({prov.phone}) — {prov.address}
                  </div>
                  <button onClick={() => handlePromoteUser(prov._id, 'admin', 'provider')} className="btn btn-outline" style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}>
                    Grant Admin Access
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
              👤 Registered Patients ({usersList.patients?.length || 0})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {usersList.patients?.map(pat => (
                <div key={pat._id} className="flex-between" style={{ padding: '8px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <div>
                    <strong>{pat.name}</strong> ({pat.phone})
                  </div>
                  <button onClick={() => handlePromoteUser(pat._id, 'admin', 'patient')} className="btn btn-outline" style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem' }}>
                    Grant Admin Access
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Audit & System Logs (Super Admin) */}
      {activeTab === 'audit' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
            {lang === 'ne' ? 'अडिट ट्रेल तथा सिस्टम लग' : 'System Audit Trail & Event Logs'}
          </h3>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                {lang === 'ne' ? 'अझै कुनै अडिट लगहरू दर्ता भएका छैनन्।' : 'No audit logs recorded yet.'}
              </div>
            ) : (
              auditLogs.map(log => (
                <div key={log._id} style={{ padding: '10px', borderRadius: 'var(--radius-sm)', background: '#f8fafc', borderLeft: '3px solid var(--primary)', fontSize: '0.85rem' }}>
                  <div className="flex-between">
                    <strong style={{ color: 'var(--primary-hover)' }}>⚡ {log.action}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(log.createdAt).toLocaleString(lang === 'ne' ? 'ne-NP' : 'en-US')}
                    </span>
                  </div>

                  <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    <span>👨‍💼 <strong>{lang === 'ne' ? 'कर्ता:' : 'By:'}</strong> {log.performedBy?.name} ({log.performedBy?.role})</span>
                    {log.target?.label && <span style={{ marginLeft: '12px' }}>🎯 <strong>{lang === 'ne' ? 'लक्ष्य:' : 'Target:'}</strong> {log.target.label}</span>}
                  </div>

                  {log.details && (
                    <pre style={{ marginTop: '4px', background: '#f1f5f9', padding: '6px', borderRadius: '4px', fontSize: '0.75rem', overflowX: 'auto' }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: FlapMain IoT & Sensor Telemetry Test Suite */}
      {activeTab === 'telemetry' && (
        <FlapMainTestPanel />
      )}

      <LocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectLocation={handleLocationSelected}
      />
    </div>
  );
};
