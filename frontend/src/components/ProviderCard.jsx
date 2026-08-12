import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Star, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProviderCard = ({ provider, onSelect }) => {
  const { lang } = useAuth();
  const categoryTitle = provider.category?.displayName?.[lang] || provider.category?.displayName?.ne || '';

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            fontSize: '1.4rem',
            fontWeight: 700,
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0
          }}
        >
          {provider.name.charAt(0)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{provider.name}</h4>
            <StatusBadge status={provider.verificationStatus} type="verification" />
            {provider.isNewProvider && <StatusBadge type="isNew" />}
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {categoryTitle}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--secondary-hover)', fontWeight: 600 }}>
              <Star size={14} fill="var(--secondary)" color="var(--secondary)" />
              <span>{provider.rating > 0 ? provider.rating : (lang === 'ne' ? 'नयाँ' : 'New')}</span>
              {provider.totalRatings > 0 && <span style={{ color: 'var(--text-muted)' }}>({provider.totalRatings})</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={14} color="var(--primary)" />
              <span>{provider.completedVisits} {lang === 'ne' ? 'भिजिट सम्पन्न' : 'visits'}</span>
            </div>
          </div>
        </div>
      </div>

      {provider.communityReference && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}
        >
          <strong>{lang === 'ne' ? 'समुदाय सिफारिस:' : 'Community Ref:'}</strong> {provider.communityReference}
        </div>
      )}

      {onSelect && (
        <button
          onClick={() => onSelect(provider)}
          className="btn btn-primary"
          style={{ padding: '8px 14px', fontSize: '0.85rem' }}
        >
          {lang === 'ne' ? 'यो प्रदायक छान्नुहोस्' : 'Select Provider'}
        </button>
      )}
    </div>
  );
};
