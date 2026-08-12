import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRight } from 'lucide-react';

export const ServiceCard = ({ service }) => {
  const { lang } = useAuth();
  const title = service.displayName?.[lang] || service.displayName?.ne || service.name;
  const description = service.description?.[lang] || service.description?.ne || '';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            fontSize: '1.8rem',
            width: '48px',
            height: '48px',
            background: 'var(--primary-light)',
            borderRadius: 'var(--radius-md)',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          {service.icon || '🏥'}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {title}
          </h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
            रु. {service.basePriceRange?.min} - {service.basePriceRange?.max}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
        {description}
      </p>

      <Link
        to={`/book?service=${service._id}`}
        className="btn btn-outline"
        style={{ padding: '8px 14px', fontSize: '0.85rem' }}
      >
        <span>{lang === 'ne' ? 'बुकिङ गर्नुहोस्' : 'Book Now'}</span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
};
