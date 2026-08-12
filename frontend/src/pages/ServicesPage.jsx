import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ServiceCard } from '../components/ServiceCard';
import { SEO } from '../components/SEO';
import { Stethoscope } from 'lucide-react';

export const ServicesPage = () => {
  const { lang } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServices();
        if (res.success) {
          setServices(res.serviceTypes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const seoTitle = lang === 'ne'
    ? 'सबै गृह स्वास्थ्य सेवाहरू — नर्स भिजिट, IV, घाउ मलमपट्टी'
    : 'Home Medical Care Services — Nurse Visit, IV & Lab Sample Nepal';

  const seoDesc = lang === 'ne'
    ? 'काठमाडौंमा घरमै पाइने सबै स्वास्थ्य सेवाहरू: नर्स भिजिट, IV इन्जेक्सन, घाउ ड्रेसिङ, रगत नमूना सङ्कलन र ज्येष्ठ नागरिक स्वास्थ्य जाँच।'
    : 'Browse all at-home health services in Kathmandu: nurse home visits, IV injections, wound dressings, lab sample collection & elder care.';

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <SEO
        title={seoTitle}
        description={seoDesc}
        keywords="home nurse services kathmandu, IV injection home care, home lab blood sample collection, wound dressing home service nepal, घरमै स्वास्थ्य सेवा"
        canonicalPath="/services"
      />

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
          {lang === 'ne' ? 'सबै घर स्वास्थ्य सेवाहरू' : 'All Home Health Services'}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {lang === 'ne' ? 'तपाईंलाई चाहिएको सेवा छान्नुहोस् र घरमै स्वास्थ्य प्रदायक बोलाउनुहोस्' : 'Select a service and book a professional home visit'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          {lang === 'ne' ? 'सेवाहरू लोड हुँदैछ...' : 'Loading services...'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {services.map(s => (
            <ServiceCard key={s._id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
};
