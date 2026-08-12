import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ServiceCard } from '../components/ServiceCard';
import { SEO } from '../components/SEO';
import { ShieldCheck, Phone, HeartHandshake, Clock, Sparkles } from 'lucide-react';

export const HomePage = () => {
  const { lang, user } = useAuth();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords="home doctor kathmandu, home nurse nepal, home IV injection kathmandu, blood sample collection home, elderly care home visit kathmandu, घरमा डाक्टर सेवा"
        canonicalPath="/"
      />

      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0d9488, #0f766e)',
          color: 'white',
          padding: '24px 20px',
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
          <ShieldCheck size={16} />
          <span>{lang === 'ne' ? 'भरपर्दो र प्रमाणीकृत स्वास्थ्य सेवा' : 'Verified & Trusted Home Care'}</span>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.2 }}>
          {lang === 'ne'
            ? 'तपाईंको घरमै डाक्टर र नर्सको सेवा'
            : 'Doctor & Nurse Visits Right at Your Doorstep'}
        </h1>

        <p style={{ fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.4 }}>
          {lang === 'ne'
            ? 'ज्वरो जाँच, IV इन्जेक्सन, घाउ मलमपट्टी, र ज्येष्ठ नागरिक हेरचाह — काठमाडौं उपत्यकाभरि विश्वसनीय स्वास्थ्य प्रदायकसँग।'
            : 'Fever checkups, IV injections, wound dressings, and elder care by verified medical professionals across Kathmandu Valley.'}
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <RouterLink
            to="/services"
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
          >
            {lang === 'ne' ? 'सेवा बुक गर्नुहोस्' : 'Book a Visit'}
          </RouterLink>
          <a
            href="tel:9800000000"
            className="btn btn-outline"
            style={{ color: 'white', borderColor: 'white', padding: '12px', width: 'auto' }}
            title="Call GharkoDoctor Hotline"
          >
            <Phone size={18} />
          </a>
        </div>
      </section>

      {/* Trust Highlights */}
      <section className="container grid-2" style={{ gap: '10px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
          <ShieldCheck color="var(--primary)" size={24} />
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{lang === 'ne' ? '100% प्रमाणीकृत प्रदायक' : '100% Verified Providers'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'नागरिकता र काउन्सिल इजाजतपत्र' : 'Govt ID & Council License'}</span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
          <HeartHandshake color="var(--secondary)" size={24} />
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{lang === 'ne' ? 'नगद वा eSewa भुक्तानी' : 'Cash or Digital Payment'}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lang === 'ne' ? 'भिजिट पछि मात्र तिर्नुहोस्' : 'Pay after visit option'}</span>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="container">
        <div className="flex-between" style={{ marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {lang === 'ne' ? 'उपलब्ध घर स्वास्थ्य सेवाहरू (Home Care Services)' : 'Available Home Services in Kathmandu'}
          </h2>
          <RouterLink to="/services" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            {lang === 'ne' ? 'सबै हेर्नुहोस्' : 'View All'}
          </RouterLink>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            {lang === 'ne' ? 'सेवाहरू लोड हुँदैछ...' : 'Loading services...'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* Call Center / Phone Booking Notice */}
      <section className="container">
        <div className="card card-gradient" style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <Phone size={32} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            {lang === 'ne' ? 'फोनबाट पनि सिधै बुकिङ गर्न सकिन्छ' : 'Book Easily Over Phone Call'}
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            {lang === 'ne'
              ? 'यदि स्मार्टफोन वा इन्टरनेट उपलब्ध नभएमा हाम्रो हटलाइनमा सिधै फोन गर्नुहोस्।'
              : 'If you prefer calling over using the app, our dispatch team will schedule your home visit over the phone.'}
          </p>
          <a
            href="tel:9800000000"
            className="btn"
            style={{ background: 'white', color: 'var(--primary-hover)', width: 'auto', padding: '10px 24px', fontWeight: 700 }}
          >
            📞 9800000000 मा कल गर्नुहोस्
          </a>
        </div>
      </section>
    </div>
  );
};
