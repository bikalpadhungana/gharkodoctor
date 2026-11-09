import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { LocationPickerModal } from '../components/LocationPickerModal';
import { FlapMainTestPanel } from '../components/FlapMainTestPanel';
import { ShieldCheck, Users, Calendar, Check, X, PhoneCall, RefreshCw, Map, CreditCard, FileText, History, Radio, Inbox, Search, Phone, Clock, MapPin, Star } from 'lucide-react';
import { useFlash } from '../components/Flash';
import { serviceName, friendlyTime, ageLabel, minutesSince } from '../utils/booking';
import { ADMIN_ROLES } from '../config';

// A request unassigned for longer than this is flagged in the dispatch queue.
const QUEUE_ALERT_MINUTES = 30;
const BOOKING_FILTERS = [
  { key: '', ne: 'सबै', en: 'All' },
  { key: 'requested', ne: 'अनुरोध', en: 'Requested' },
  { key: 'confirmed,en_route', ne: 'सक्रिय', en: 'Active' },
  { key: 'completed', ne: 'सम्पन्न', en: 'Completed' },
  { key: 'cancelled', ne: 'रद्द', en: 'Cancelled' }
];

export const AdminDashboardPage = () => {
  const { lang, token, user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  // Dispatchers run the queue and phone bookings; trust decisions and tooling are admin-only (matches backend RBAC).
  const isAdminRole = ADMIN_ROLES.includes(currentUser?.role);
  const [flash, showFlash] = useFlash();

  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'pending' | 'bookings' | 'phonein' | 'telemetry' | 'users' | 'audit'
  const [queue, setQueue] = useState([]);
  const [activeVisits, setActiveVisits] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('');
  const [search, setSearch] = useState('');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab, bookingFilter]);

  // Keep the dispatch queue fresh while it's on screen.
  useEffect(() => {
    if (activeTab !== 'queue') return;
    const t = setInterval(() => document.visibilityState === 'visible' && loadData(), 45000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const none = Promise.resolve({ success: false });
      const [statsRes, pendingRes, bookingsRes, verifiedRes, servicesRes, queueRes, activeRes] = await Promise.all([
        api.getAdminStats(token),
        isAdminRole ? api.getPendingProviders(token) : none,
        activeTab === 'bookings' ? api.getAllBookings(token, bookingFilter, 100) : none,
        api.getAllProviders(token, 'verified'),
        api.getServices(),
        api.getAllBookings(token, 'requested', 200),
        api.getAllBookings(token, 'confirmed,en_route', 200)
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (pendingRes.success) setPendingProviders(pendingRes.providers);
      if (bookingsRes.success) setAllBookings(bookingsRes.bookings);
      // Oldest request first: it has been waiting longest.
      if (queueRes.success) setQueue([...queueRes.bookings].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      if (activeRes.success) setActiveVisits([...activeRes.bookings].sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime)));
      if (verifiedRes.success) setVerifiedProviders(verifiedRes.providers);
      if (servicesRes.success) {
        setServiceTypes(servicesRes.serviceTypes);
        if (servicesRes.serviceTypes.length > 0) {
          setPhoneForm(prev => ({ ...prev, serviceType: prev.serviceType || servicesRes.serviceTypes[0]._id }));
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

  const handleVerify = async (provider, status) => {
    let notes = 'Admin reviewed';
    if (status === 'rejected') {
      // The provider sees this reason on their dashboard, so ask for something actionable.
      const reason = window.prompt(lang === 'ne' ? 'अस्वीकृत गर्ने कारण (स्वास्थ्यकर्मीले देख्नुहुनेछ):' : 'Reason for rejection (shown to the provider):');
      if (reason === null) return;
      notes = reason || 'Documents could not be verified';
    } else if (!window.confirm(lang === 'ne' ? `${provider.name} लाई स्वीकृत गर्ने? उहाँले बिरामीको घरमा भिजिट गर्न सक्नुहुनेछ।` : `Approve ${provider.name}? They will be able to visit patients' homes.`)) {
      return;
    }
    const res = await api.verifyProvider(provider._id, status, notes, token);
    if (res.success) {
      showFlash(status === 'verified' ? `✓ ${provider.name} ${lang === 'ne' ? 'स्वीकृत' : 'approved'}` : `${provider.name} ${lang === 'ne' ? 'अस्वीकृत' : 'rejected'}`);
      loadData();
    } else {
      showFlash(res.message || 'Failed', 'error');
    }
  };

  const handleAssignProvider = async (bookingId, providerId) => {
    const res = await api.assignProvider(bookingId, providerId, token);
    if (res.success) {
      showFlash(lang === 'ne' ? `✓ ${res.booking.provider?.name} तोकियो — दुवैलाई SMS गयो` : `✓ Assigned ${res.booking.provider?.name} — both notified by SMS`);
      loadData();
    } else {
      showFlash(res.message || 'Assignment failed', 'error');
    }
  };

  const handleVerifyPayment = async (bookingId, paymentStatus) => {
    const res = await api.verifyPayment(bookingId, paymentStatus, 'cash', 0, 'Verified by Admin', token);
    if (res.success) {
      showFlash(lang === 'ne' ? 'भुक्तानी अपडेट भयो' : 'Payment updated');
      loadData();
    } else {
      showFlash(res.message || 'Failed', 'error');
    }
  };

  // Providers offering this booking's service first; the patient's preferred provider at the top.
  const providersFor = (b) => {
    const stId = b.serviceType?._id || b.serviceType;
    const matching = verifiedProviders.filter(vp => (vp.category?._id || vp.category) === stId);
    const others = verifiedProviders.filter(vp => !matching.includes(vp));
    const prefId = b.preferredProvider?._id;
    const sortPref = (list) => [...list].sort((x, y) => (y._id === prefId) - (x._id === prefId));
    return { matching: sortPref(matching), others };
  };

  const AssignControl = ({ b }) => {
    const { matching, others } = providersFor(b);
    const label = (vp) => `${vp._id === b.preferredProvider?._id ? '★ ' : ''}${vp.name} · ${vp.ward ? `${lang === 'ne' ? 'वडा' : 'Ward'} ${vp.ward} · ` : ''}⭐${vp.rating || '-'}${vp.isNewProvider ? ' · NEW' : ''}`;
    return (
      <select
        className="form-select"
        aria-label={lang === 'ne' ? 'स्वास्थ्यकर्मी तोक्नुहोस्' : 'Assign provider'}
        style={{ fontSize: '0.88rem', padding: '8px' }}
        defaultValue=""
        onChange={(e) => e.target.value && handleAssignProvider(b._id, e.target.value)}
      >
        <option value="">{lang === 'ne' ? 'स्वास्थ्यकर्मी तोक्नुहोस्…' : 'Assign a provider…'}</option>
        {matching.length > 0 && (
          <optgroup label={lang === 'ne' ? 'यो सेवा दिने' : 'Offers this service'}>
            {matching.map(vp => <option key={vp._id} value={vp._id}>{label(vp)}</option>)}
          </optgroup>
        )}
        {others.length > 0 && (
          <optgroup label={lang === 'ne' ? 'अन्य प्रमाणित' : 'Other verified'}>
            {others.map(vp => <option key={vp._id} value={vp._id}>{label(vp)}</option>)}
          </optgroup>
        )}
      </select>
    );
  };

  const q = search.trim().toLowerCase();
  const filteredBookings = q
    ? allBookings.filter(b => [b.patient?.name, b.patient?.phone, b.provider?.name, b.address, b._id]
        .some(v => v && v.toString().toLowerCase().includes(q)))
    : allBookings;
  const overdueCount = queue.filter(b => minutesSince(b.createdAt) > QUEUE_ALERT_MINUTES).length;

  const handlePromoteUser = async (userId, targetRole, userType) => {
    try {
      const res = await api.updateUserRole(userId, targetRole, userType, token);
      if (res.success) {
        showFlash(lang === 'ne' ? `भूमिका परिवर्तन भयो: ${targetRole}` : `Role updated to ${targetRole}`);
        loadData();
      } else {
        showFlash(res.message || 'Failed', 'error');
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

  const TabBtn = ({ id, icon: Icon, ne, en, count, warn }) => (
    <button role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)}>
      <Icon size={15} /> {lang === 'ne' ? ne : en}
      {count > 0 && <span className={`count-pill ${warn ? 'warn' : ''}`}>{count}</span>}
    </button>
  );

  return (
    <div className="container desktop-wide dash">
      <div className="section-head">
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            {isSuperAdmin
              ? (lang === 'ne' ? 'सुपर एडमिन' : 'Super Admin')
              : currentUser?.role === 'dispatcher'
                ? (lang === 'ne' ? 'डिस्प्याच डेस्क' : 'Dispatch Desk')
                : (lang === 'ne' ? 'एडमिन प्यानल' : 'Admin Panel')}
          </h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {currentUser?.name} · <span className="badge badge-verified">{currentUser?.role}</span>
          </span>
        </div>
        <button onClick={loadData} className="icon-btn" aria-label="Refresh" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* Overview: every tile jumps to where you act on it */}
      <div className="stat-grid">
        <button className={`stat-tile ${overdueCount > 0 ? 'attn' : ''}`} onClick={() => setActiveTab('queue')}>
          <div className="v" style={{ color: queue.length ? '#b45309' : 'var(--text-main)' }}>{queue.length}</div>
          <div className="l">
            {lang === 'ne' ? 'तोक्न बाँकी' : 'Awaiting assignment'}
            {overdueCount > 0 && <strong style={{ color: '#b91c1c' }}> · {overdueCount} {lang === 'ne' ? 'ढिलो' : 'overdue'}</strong>}
          </div>
        </button>
        <button className="stat-tile" onClick={() => setActiveTab('queue')}>
          <div className="v" style={{ color: 'var(--primary)' }}>{activeVisits.length}</div>
          <div className="l">{lang === 'ne' ? 'सक्रिय भिजिट' : 'Active visits'}</div>
        </button>
        {isAdminRole ? (
          <button className={`stat-tile ${pendingProviders.length ? 'attn' : ''}`} onClick={() => setActiveTab('pending')}>
            <div className="v">{stats?.pendingVerifications ?? '–'}</div>
            <div className="l">{lang === 'ne' ? 'प्रमाणीकरण बाँकी' : 'Providers to verify'}</div>
          </button>
        ) : (
          <div className="stat-tile">
            <div className="v">{stats?.verifiedProviders ?? '–'}</div>
            <div className="l">{lang === 'ne' ? 'प्रमाणित स्वास्थ्यकर्मी' : 'Verified providers'}</div>
          </div>
        )}
        <div className="stat-tile">
          <div className="v" style={{ color: 'var(--success)' }}>रु. {stats?.totalRevenue ?? 0}</div>
          <div className="l">{lang === 'ne' ? 'प्रमाणित आम्दानी' : 'Verified revenue'}</div>
        </div>
      </div>

      <div className="segmented" role="tablist">
        <TabBtn id="queue" icon={Inbox} ne="डिस्प्याच" en="Dispatch" count={queue.length} warn={overdueCount > 0} />
        <TabBtn id="phonein" icon={PhoneCall} ne="फोन बुकिङ" en="Phone booking" />
        <TabBtn id="bookings" icon={Calendar} ne="सबै बुकिङ" en="All bookings" />
        {isAdminRole && <TabBtn id="pending" icon={ShieldCheck} ne="प्रमाणीकरण" en="Verify" count={pendingProviders.length} warn />}
        {isAdminRole && <TabBtn id="audit" icon={History} ne="अडिट" en="Audit" />}
        {isSuperAdmin && <TabBtn id="users" icon={Users} ne="भूमिका" en="Roles" />}
        {isAdminRole && <TabBtn id="telemetry" icon={Radio} ne="IoT" en="IoT test" />}
      </div>

      {/* Tab 0: Dispatch queue — the dispatcher's main screen */}
      {activeTab === 'queue' && (
        <div className="dispatch-grid">
          <section>
            <div className="section-head" style={{ marginBottom: '8px' }}>
              <h2>{lang === 'ne' ? 'तोक्न बाँकी अनुरोधहरू' : 'Requests to assign'} <span className={`count-pill ${overdueCount ? 'danger' : 'warn'}`}>{queue.length}</span></h2>
            </div>
            {queue.length === 0 ? (
              <div className="card empty-state">
                <div className="e">✅</div>
                <h3>{lang === 'ne' ? 'सबै अनुरोधमा स्वास्थ्यकर्मी तोकिएको छ' : 'All caught up'}</h3>
                <p>{lang === 'ne' ? 'नयाँ अनुरोध आउँदा यहाँ देखिनेछ (४५ सेकेन्डमा रिफ्रेस हुन्छ)।' : 'New requests appear here (refreshes every 45s).'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {queue.map(b => {
                  const overdue = minutesSince(b.createdAt) > QUEUE_ALERT_MINUTES;
                  return (
                    <div key={b._id} className={`card visit-card ${overdue ? 'attention' : ''}`}>
                      <div className="vc-top">
                        <div className="vc-icon">{b.serviceType?.icon || '🏥'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex-between" style={{ gap: '8px', flexWrap: 'wrap' }}>
                            <div className="vc-title">{serviceName(b, lang)}</div>
                            <span className={`age-tag ${overdue ? 'old' : ''}`}>{ageLabel(b.createdAt, lang)}</span>
                          </div>
                          <div className="vc-meta">
                            <span><Clock size={13} style={{ verticalAlign: '-2px' }} /> <strong style={{ color: 'var(--text-main)' }}>{friendlyTime(b.scheduledTime, lang)}</strong></span>
                            <span><MapPin size={13} style={{ verticalAlign: '-2px' }} /> {b.address}{b.ward ? `, ${lang === 'ne' ? 'वडा' : 'Ward'} ${b.ward}` : ''}{b.municipality ? `, ${b.municipality}` : ''}</span>
                            <span>
                              👤 {b.patient?.name} · <a href={`tel:${b.patient?.phone}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{b.patient?.phone}</a>
                              {b.source === 'phone' && <span className="badge badge-pending" style={{ marginLeft: '6px' }}>📞 {lang === 'ne' ? 'फोन' : 'phone'}</span>}
                            </span>
                            {b.notes && <span>📝 {b.notes}</span>}
                            {b.preferredProvider && (
                              <span style={{ color: '#92400e' }}>
                                <Star size={13} style={{ verticalAlign: '-2px' }} /> {lang === 'ne' ? 'बिरामीको रोजाइ:' : 'Patient chose:'} <strong>{b.preferredProvider.name}</strong> {lang === 'ne' ? '(स्वीकार गर्न बाँकी)' : '(not yet accepted)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <AssignControl b={b} />
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="section-head" style={{ marginBottom: '8px' }}>
              <h2>{lang === 'ne' ? 'सक्रिय भिजिटहरू' : 'Visits in progress'} <span className="count-pill">{activeVisits.length}</span></h2>
            </div>
            {activeVisits.length === 0 ? (
              <div className="card empty-state"><p>{lang === 'ne' ? 'अहिले कुनै सक्रिय भिजिट छैन' : 'No visits in progress'}</p></div>
            ) : (
              <div className="row-list">
                {activeVisits.map(b => (
                  <div key={b._id} className="row-item">
                    <span style={{ fontSize: '1.3rem' }}>{b.serviceType?.icon || '🏥'}</span>
                    <div className="ri-main">
                      <div className="ri-title">{b.patient?.name} → {b.provider?.name || '—'}</div>
                      <div className="ri-sub">{serviceName(b, lang)} · {friendlyTime(b.scheduledTime, lang)}</div>
                    </div>
                    <StatusBadge status={b.status} />
                    {b.provider?.phone && (
                      <a href={`tel:${b.provider.phone}`} className="icon-btn" aria-label={`Call ${b.provider.name}`}><Phone size={18} /></a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

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
                  <button onClick={() => handleVerify(p, 'verified')} className="btn btn-primary" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    <Check size={16} />
                    <span>{lang === 'ne' ? 'स्वीकृत गर्नुहोस् (Approve)' : 'Approve Application'}</span>
                  </button>
                  <button onClick={() => handleVerify(p, 'rejected')} className="btn btn-danger" style={{ padding: '8px', fontSize: '0.85rem' }}>
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
            {lang === 'ne' ? 'सबै बुकिङहरू, मेडिकल रिपोर्ट र भुक्तानी' : 'All bookings, reports & payments'}
          </h3>

          <div className="admin-toolbar">
            <div style={{ position: 'relative', flex: '1 1 220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="search"
                className="form-input"
                style={{ paddingLeft: '36px', width: '100%' }}
                placeholder={lang === 'ne' ? 'नाम, फोन, ठेगाना वा ID खोज्नुहोस्' : 'Search name, phone, address or ID'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="chip-row">
              {BOOKING_FILTERS.map(f => (
                <button key={f.key} type="button" className="chip" aria-pressed={bookingFilter === f.key} onClick={() => setBookingFilter(f.key)}>
                  {lang === 'ne' ? f.ne : f.en}
                </button>
              ))}
            </div>
          </div>

          {!loading && filteredBookings.length === 0 && (
            <div className="card empty-state"><div className="e">🔍</div><h3>{lang === 'ne' ? 'कुनै बुकिङ भेटिएन' : 'No bookings match'}</h3></div>
          )}

          {filteredBookings.map(b => (
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
                  <AssignControl b={b} />
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
      {flash}
    </div>
  );
};
