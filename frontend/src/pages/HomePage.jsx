import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ServiceCard } from '../components/ServiceCard';
import { SEO } from '../components/SEO';
import { ShieldCheck, Phone, HeartHandshake, Clock, Sparkles, MapPin, CheckCircle2, UserCheck, Activity } from 'lucide-react';

export const HomePage = () => {
  const { lang } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await api.getServices();
        if (data.success) {
          setServices(data.serviceTypes);
        }
      } catch (err) {
        console.error('Failed to load services', err);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const seoTitle = lang === 'ne'
    ? 'घरमा डाक्टर र नर्स सेवा काठमाडौं उपत्यका'
    : 'Doctor & Nurse Home Visits Kathmandu Nepal';

  const seoDesc = lang === 'ne'
    ? 'काठमाडौं, भक्तपुर र ललितपुरमा घरमै नर्स, डाक्टर, IV इन्जेक्सन, घाउ मलमपट्टी, रगत परीक्षण र ज्येष्ठ नागरिक हेरचाह। प्रमाणीकृत स्वास्थ्य प्रदायक।'
    : 'Book trusted home doctor & nurse visits in Kathmandu Valley. Fever checkups, IV injections, wound dressings & elder care at home.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords="home doctor kathmandu, home nurse nepal, home IV injection kathmandu, blood sample collection home, elderly care home visit kathmandu, घरमा डाक्टर सेवा"
        canonicalPath="/"
      />

      {/* Responsive Desktop & Mobile Hero Section */}
      <section
        className="hero-desktop-grid"
        style={{
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          color: 'white',
          padding: '28px 20px',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
            <ShieldCheck size={16} />
            <span>{lang === 'ne' ? 'भरपर्दो र प्रमाणीकृत स्वास्थ्य सेवा' : 'Verified & Trusted Home Care'}</span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25 }}>
            {lang === 'ne'
              ? 'तपाईंको घरमै डाक्टर र नर्सको विश्वासिलो सेवा'
              : 'Doctor & Nurse Visits Right at Your Doorstep'}
          </h1>

          <p style={{ fontSize: '1rem', opacity: 0.95, lineHeight: 1.5 }}>
            {lang === 'ne'
              ? 'ज्वरो जाँच, IV इन्जेक्सन, घाउ मलमपट्टी, रगत संकलन र ज्येष्ठ नागरिक हेरचाह — काठमाडौं उपत्यकाभरि प्रमाणीकृत स्वास्थ्य प्रदायकसँग।'
              : 'Fever checkups, IV injections, wound dressings, lab sample collection, and elder care by verified medical professionals across Kathmandu Valley.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <RouterLink
              to="/services"
              className="btn btn-secondary"
              style={{ flex: 1, minWidth: '180px', padding: '14px', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {lang === 'ne' ? 'सेवा बुक गर्नुहोस् (Book Visit)' : 'Book a Visit'}
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
        </div>

        {/* Desktop Showcase Visual Card */}
        <div className="card" style={{ background: 'rgba(255, 255, 255, 0.95)', color: 'var(--text-main)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={18} />
              {lang === 'ne' ? 'काठमाडौं उपत्यका कभरेज' : 'Kathmandu Valley Coverage'}
            </span>
            <span className="badge badge-verified">
              <CheckCircle2 size={12} />
              24/7 Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="icon-box-primary" style={{ width: '36px', height: '36px' }}><UserCheck size={18} /></div>
              <div>
                <strong>{lang === 'ne' ? 'इजाजतपत्र प्राप्त स्वास्थ्यकर्मी' : 'Govt License Verified Staff'}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nepal Nursing Council & Medical Council</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="icon-box-secondary" style={{ width: '36px', height: '36px' }}><MapPin size={18} /></div>
              <div>
                <strong>{lang === 'ne' ? '३० मिनेटभित्र सेवा पहुँच' : 'Fast Emergency Arrival'}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kathmandu, Lalitpur, Bhaktapur</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="icon-box-accent" style={{ width: '36px', height: '36px' }}><HeartHandshake size={18} /></div>
              <div>
                <strong>{lang === 'ne' ? 'घरमै नगद वा eSewa भुक्तानी' : 'Pay After Visit (Cash/eSewa)'}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No advance payment barrier</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Highlights — 4 Column Grid on Desktop */}
      <section className="container grid-2 trust-desktop-grid">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <ShieldCheck color="var(--primary)" size={28} />
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{lang === 'ne' ? '100% प्रमाणीकृत प्रदायक' : '100% Verified Providers'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'नागरिकता र इजाजतपत्र' : 'Govt ID & Council License'}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <HeartHandshake color="var(--secondary)" size={28} />
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{lang === 'ne' ? 'नगद वा eSewa भुक्तानी' : 'Cash or Digital Payment'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'भिजिट पछि मात्र तिर्नुहोस्' : 'Pay after visit option'}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <Clock color="var(--primary)" size={28} />
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{lang === 'ne' ? 'द्रुत भिजिट डिस्प्याच' : 'Quick Visit Dispatch'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'नजिकको स्वास्थ्यकर्मी तोकिने' : 'Fast provider matching'}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px' }}>
          <MapPin color="var(--accent)" size={28} />
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{lang === 'ne' ? 'उपत्यकाव्यापी कभरेज' : 'Valley-Wide Coverage'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'काठमाडौं, भक्तपुर, ललितपुर' : 'Kathmandu, Bhaktapur, Lalitpur'}</span>
          </div>
        </div>
      </section>

      {/* Services List — Responsive Multi-Column Desktop Grid */}
      <section className="container">
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {lang === 'ne' ? 'उपलब्ध घर स्वास्थ्य सेवाहरू' : 'Available Home Services in Kathmandu'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {lang === 'ne' ? 'आवश्यकता अनुसार सेवा छानी घरमै स्वास्थ्यकर्मी बोलाउनुहोस्' : 'Select a service to schedule a visit by a verified medical professional'}
            </p>
          </div>
          <RouterLink to="/services" className="btn btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: '0.85rem' }}>
            {lang === 'ne' ? 'सबै हेर्नुहोस्' : 'View All'}
          </RouterLink>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {lang === 'ne' ? 'सेवाहरू लोड हुँदैछ...' : 'Loading services...'}
          </div>
        ) : (
          <div className="services-desktop-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* Call Center / Phone Booking Notice — Desktop 2 Column Banner */}
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
