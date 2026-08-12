import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ServiceCard } from '../components/ServiceCard';
import { SEO } from '../components/SEO';
import {
  ShieldCheck, Phone, HeartHandshake, Clock, Sparkles, MapPin,
  CheckCircle2, UserCheck, Activity, Star, Calendar, ArrowRight,
  Stethoscope, FileText, ChevronRight, Award, Zap
} from 'lucide-react';

export const HomePage = () => {
  const { lang } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Book Widget state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickWard, setQuickWard] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await api.getServices();
        if (data.success) {
          setServices(data.serviceTypes);
          if (data.serviceTypes.length > 0) {
            setSelectedServiceId(data.serviceTypes[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load services', err);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const handleQuickBook = (e) => {
    e.preventDefault();
    if (selectedServiceId) {
      navigate(`/book?service=${selectedServiceId}`);
    } else {
      navigate('/services');
    }
  };

  const seoTitle = lang === 'ne'
    ? 'घरमा डाक्टर र नर्स सेवा काठमाडौं उपत्यका — GharkoDoctor'
    : 'Doctor & Nurse Home Visits Kathmandu Nepal — GharkoDoctor';

  const seoDesc = lang === 'ne'
    ? 'काठमाडौं, भक्तपुर र ललितपुरमा घरमै नर्स, डाक्टर, IV इन्जेक्सन, घाउ मलमपट्टी, रगत परीक्षण र ज्येष्ठ नागरिक हेरचाह। प्रमाणीकृत स्वास्थ्य प्रदायक।'
    : 'Book trusted home doctor & nurse visits in Kathmandu Valley. Fever checkups, IV injections, wound dressings & elder care at home.';

  const testimonials = [
    {
      id: 1,
      name: lang === 'ne' ? 'सुनिता श्रेष्ठ' : 'Sunita Shrestha',
      location: lang === 'ne' ? 'बालुवाटार, काठमाडौं (वडा ४)' : 'Baluwatar, Kathmandu (Ward 4)',
      comment: lang === 'ne'
        ? 'आमालाई घरमै सलाइन र सुई दिन नर्स चाहिएको थियो। ३० मिनेटभित्र नर्स घरमै आइपुग्नुभयो। सेवा निकै भरपर्दो र व्यावसायिक लाग्यो।'
        : 'Needed an IV nurse at home for my mother. A verified nurse arrived in 30 minutes. Extremely reliable and professional service.',
      service: lang === 'ne' ? 'नर्सिङ र IV सेवा' : 'Home Nursing & IV Care',
      rating: 5
    },
    {
      id: 2,
      name: lang === 'ne' ? 'राजेन्द्र पोखरेल' : 'Rajendra Pokharel',
      location: lang === 'ne' ? 'कुपण्डोल, ललितपुर (वडा १०)' : 'Kupandole, Lalitpur (Ward 10)',
      comment: lang === 'ne'
        ? 'बुबाको उच्च ज्वरो जाँचको लागि घरमै डाक्टर बोलाएका थियौं। भाइटल साइन जाँच गरी मेडिकल रिपोर्ट पनि तुरुन्तै उपलब्ध भयो। भुक्तानी पनि भिजिट पछि eSewa बाट गर्यौं।'
        : 'Booked a doctor checkup at home for my father\'s fever. Complete vital signs checkup and report logged digitally. Paid conveniently via eSewa.',
      service: lang === 'ne' ? 'सामान्य स्वास्थ्य परीक्षण' : 'General Health Checkup',
      rating: 5
    },
    {
      id: 3,
      name: lang === 'ne' ? 'सरिता ढकाल' : 'Sarita Dhakal',
      location: lang === 'ne' ? 'सूर्यविनायक, भक्तपुर (वडा ५)' : 'Suryabinayak, Bhaktapur (Ward 5)',
      comment: lang === 'ne'
        ? 'घरमै रगत नमूना संकलन (Blood Sample) गर्न प्रदायक समयमै आउनुभयो। प्रयोगशाला रिपोर्ट पनि पाउन सहज भयो।'
        : 'Blood sample collection at home was punctual. Lab reports delivered hassle-free.',
      service: lang === 'ne' ? 'रगत नमूना संकलन' : 'Blood Sample Collection',
      rating: 5
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '32px' }}>
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords="home doctor kathmandu, home nurse nepal, home IV injection kathmandu, blood sample collection home, elderly care home visit kathmandu, घरमा डाक्टर सेवा"
        canonicalPath="/"
      />

      {/* Hero Section */}
      <section
        className="hero-desktop-grid"
        style={{
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          color: 'white',
          padding: '32px 20px',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.18)', padding: '6px 14px', borderRadius: 'var(--radius-full)', width: 'fit-content', fontWeight: 600 }}>
            <ShieldCheck size={16} />
            <span>{lang === 'ne' ? 'काठमाडौं उपत्यकाभरि भरपर्दो र प्रमाणीकृत स्वास्थ्य सेवा' : 'Verified & Trusted Home Care in Kathmandu Valley'}</span>
          </div>

          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1.25 }}>
            {lang === 'ne'
              ? 'तपाईंको घरमै डाक्टर र नर्सको विश्वासिलो सेवा'
              : 'Trusted Doctor & Nurse Home Visits at Your Doorstep'}
          </h1>

          <p style={{ fontSize: '1rem', opacity: 0.95, lineHeight: 1.5 }}>
            {lang === 'ne'
              ? 'ज्वरो जाँच, IV इन्जेक्सन, घाउ मलमपट्टी, रगत संकलन र ज्येष्ठ नागरिक हेरचाह — काठमाडौं, ललितपुर र भक्तपुरमा प्रमाणीकृत स्वास्थ्य प्रदायकसँग।'
              : 'Fever checkups, IV injections, wound dressings, lab sample collection, and elder care by verified medical professionals across Kathmandu Valley.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <RouterLink
              to="/services"
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '180px', padding: '14px', fontSize: '0.95rem', fontWeight: 700 }}
            >
              <span>{lang === 'ne' ? 'सेवा बुक गर्नुहोस्' : 'Book a Visit'}</span>
              <ArrowRight size={18} />
            </RouterLink>
            <a
              href="tel:9800000000"
              className="btn btn-outline"
              style={{ color: 'white', borderColor: 'white', padding: '14px 20px', width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}
              title="Call GharkoDoctor Hotline"
            >
              <Phone size={18} />
              <span>9800000000</span>
            </a>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', pt: '10px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>500+</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{lang === 'ne' ? 'सम्पन्न भिजिटहरू' : 'Completed Visits'}</div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>100%</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{lang === 'ne' ? 'प्रमाणीकृत प्रदायक' : 'Verified Professionals'}</div>
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>&lt; 30 Min</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{lang === 'ne' ? 'द्रुत डिस्प्याच' : 'Quick Dispatch'}</div>
            </div>
          </div>
        </div>

        {/* Desktop Quick Booking Card Widget */}
        <div className="card" style={{ background: 'white', color: 'var(--text-main)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-hover)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={20} />
              <span>{lang === 'ne' ? 'तुरुन्तै घरमै सेवा बुक गर्नुहोस्' : 'Instant Home Care Booking'}</span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {lang === 'ne' ? 'सेवा र स्थान छानी नजिकैको नर्स वा डाक्टर बोलाउनुहोस्' : 'Select a service to match with nearest verified staff'}
            </span>
          </div>

          <form onSubmit={handleQuickBook} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{lang === 'ne' ? 'सेवा छान्नुहोस् (Select Service)' : 'Select Care Service'}</label>
              <select
                className="form-select"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                {services.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.displayName?.[lang] || s.displayName?.ne} ({s.icon})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{lang === 'ne' ? 'नगर / पालिका' : 'Municipality'}</label>
                <select
                  className="form-select"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                >
                  <option value="">काठमाडौं (Kathmandu)</option>
                  <option value="ललितपुर">ललितपुर (Lalitpur)</option>
                  <option value="भक्तपुर">भक्तपुर (Bhaktapur)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{lang === 'ne' ? 'वडा नम्बर' : 'Ward No.'}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="उदा: 4"
                  value={quickWard}
                  onChange={(e) => setQuickWard(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '0.95rem', fontWeight: 800, marginTop: '4px' }}>
              <span>{lang === 'ne' ? 'प्रदायक खोज्नुहोस् (Find Nearby Provider)' : 'Find Nearby Provider'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>

      {/* Trust Highlights Grid */}
      <section className="container grid-2 trust-desktop-grid">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <div className="icon-box-primary"><ShieldCheck size={24} /></div>
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{lang === 'ne' ? '100% प्रमाणीकृत प्रदायक' : '100% Verified Providers'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'नागरिकता र काउन्सिल इजाजतपत्र' : 'Govt ID & Council License'}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <div className="icon-box-secondary"><HeartHandshake size={24} /></div>
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{lang === 'ne' ? 'नगद वा eSewa भुक्तानी' : 'Cash or Digital Payment'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'भिजिट पछि मात्र तिर्नुहोस्' : 'Pay after visit completion'}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <div className="icon-box-primary"><Zap size={24} /></div>
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{lang === 'ne' ? 'द्रुत भिजिट डिस्प्याच' : 'Quick Visit Dispatch'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'नजिकको स्वास्थ्यकर्मी तोकिने' : 'Fast nearby provider match'}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <div className="icon-box-accent"><MapPin size={24} /></div>
          <div>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700 }}>{lang === 'ne' ? 'उपत्यकाव्यापी कभरेज' : 'Valley-Wide Coverage'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'काठमाडौं, भक्तपुर, ललितपुर' : 'Kathmandu, Bhaktapur, Lalitpur'}</span>
          </div>
        </div>
      </section>

      {/* Services List Section */}
      <section className="container">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {lang === 'ne' ? 'उपलब्ध घर स्वास्थ्य सेवाहरू' : 'Available Home Care Services'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {lang === 'ne' ? 'आवश्यकता अनुसार सेवा छानी घरमै स्वास्थ्यकर्मी बोलाउनुहोस्' : 'Select a care service to schedule a visit by a verified nurse or doctor'}
            </p>
          </div>
          <RouterLink to="/services" className="btn btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: '0.85rem' }}>
            {lang === 'ne' ? 'सबै हेर्नुहोस्' : 'View All Services'}
          </RouterLink>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {lang === 'ne' ? 'सेवाहरू लोड हुँदैछ...' : 'Loading services...'}
          </div>
        ) : (
          <div className="services-desktop-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* How GharkoDoctor Works Section */}
      <section className="container">
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'ne' ? '४ सरल चरणमा स्वास्थ्य सेवा' : 'How GharkoDoctor Works'}
            </span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '4px' }}>
              {lang === 'ne' ? 'घरमै स्वास्थ्यकर्मी बोलाउने प्रक्रिया' : 'Easy 4-Step Home Care Booking'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, marginBottom: '10px' }}>1</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                {lang === 'ne' ? 'सेवा र स्थान छान्नुहोस्' : 'Select Service & Location'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'ne' ? 'नर्स, सलाइन/सुई, घाउ मलमपट्टी वा चेकअप सेवा छान्नुहोस्।' : 'Choose from home nurse visits, IV injections, wound dressings, or checkups.'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'var(--secondary)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, marginBottom: '10px' }}>2</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                {lang === 'ne' ? 'नजिकको स्वास्थ्यकर्मी तोकिन्छ' : 'Matched With Local Provider'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'ne' ? 'सिस्टमले तपाईंको वडा नजिकको प्रमाणीकृत प्रदायक मिलाउँछ।' : 'System assigns nearest verified health staff within your ward area.'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'var(--primary-hover)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, marginBottom: '10px' }}>3</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                {lang === 'ne' ? 'घरमै उपचार र रिपोर्ट' : 'Doorstep Visit & Digital Report'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'ne' ? 'स्वास्थ्यकर्मी घरमै आई भाइटल साइन र रिपोर्ट दर्ता गर्नुहुन्छ।' : 'Health staff visits your home, checks vitals & logs a digital report.'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: '#10b981', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 800, marginBottom: '10px' }}>4</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>
                {lang === 'ne' ? 'भिजिट पछि मात्र भुक्तानी' : 'Pay After Visit'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {lang === 'ne' ? 'नगद वा eSewa बाट भिजिट पूरा भएपछि मात्र रकम तिर्नुहोस्।' : 'Conveniently pay via cash or eSewa only after the service is delivered.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Testimonials & Reviews Grid */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
            {lang === 'ne' ? 'बिरामी र परिवारको अनुभव' : 'Patient Testimonials'}
          </span>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '4px' }}>
            {lang === 'ne' ? 'हाम्रा सेवाग्राहीहरू के भन्नुहुन्छ' : 'What Our Patients Say'}
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {testimonials.map(t => (
            <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="flex-between">
                <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#f59e0b" />
                  ))}
                </div>
                <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>
                  <CheckCircle2 size={10} />
                  Verified Visit
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.4 }}>
                "{t.comment}"
              </p>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <div>
                  <strong>{t.name}</strong>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {t.location}</div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>{t.service}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Join as Health Provider Banner */}
      <section className="container">
        <div className="card" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge badge-verified" style={{ marginBottom: '6px' }}>
                <Award size={14} />
                {lang === 'ne' ? 'स्वास्थ्यकर्मी अवसर' : 'Healthcare Professional Network'}
              </span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>
                {lang === 'ne' ? 'नर्स, डाक्टर वा अहेव हुनुहुन्छ? घरको डाक्टरमा जोडिनुहोस्' : 'Are You a Nurse, Doctor or Paramedic? Join GharkoDoctor'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#166534', marginTop: '4px' }}>
                {lang === 'ne'
                  ? 'आफ्नो वडा क्षेत्रमा स्वतन्त्र रूपमा घर दैलो स्वास्थ्य सेवा प्रदान गरी राम्रो आम्दानी गर्नुहोस्।'
                  : 'Earn independently by delivering verified home nursing and doctor checkups in your local ward.'}
              </p>
            </div>

            <RouterLink
              to="/register-provider"
              className="btn btn-primary"
              style={{ width: 'auto', padding: '12px 24px', fontSize: '0.9rem', fontWeight: 700 }}
            >
              <span>{lang === 'ne' ? 'स्वास्थ्यकर्मी आवेदन दिनुहोस्' : 'Apply as Provider'}</span>
              <ArrowRight size={16} />
            </RouterLink>
          </div>
        </div>
      </section>

      {/* Call Center / Phone Dispatch Banner */}
      <section className="container">
        <div className="card card-gradient cta-desktop-card" style={{ textAlign: 'center', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={24} />
              <span>{lang === 'ne' ? 'फोनबाट पनि सिधै बुकिङ गर्न सकिन्छ' : 'Book Easily Over Phone Call'}</span>
            </h2>
            <p style={{ fontSize: '0.9rem', opacity: 0.95 }}>
              {lang === 'ne'
                ? 'यदि स्मार्टफोन वा इन्टरनेट उपलब्ध नभएमा हाम्रो हटलाइनमा सिधै फोन गर्नुहोस्। हाम्रो टोलीले फोनमै बुकिङ दर्ता गरिदिनेछ।'
                : 'If you prefer calling over using the web app, our helpline dispatch team will schedule your home visit immediately over the phone.'}
            </p>
          </div>

          <a
            href="tel:9800000000"
            className="btn"
            style={{ background: 'white', color: 'var(--primary-hover)', width: 'auto', padding: '12px 28px', fontWeight: 800, fontSize: '1rem', boxShadow: 'var(--shadow-md)' }}
          >
            📞 9800000000 मा कल गर्नुहोस्
          </a>
        </div>
      </section>
    </div>
  );
};
