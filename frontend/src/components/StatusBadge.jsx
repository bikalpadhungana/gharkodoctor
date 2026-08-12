import React from 'react';
import { ShieldCheck, Sparkles, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StatusBadge = ({ status, type = 'booking' }) => {
  const { lang } = useAuth();

  if (type === 'verification') {
    if (status === 'verified') {
      return (
        <span className="badge badge-verified">
          <ShieldCheck size={14} />
          {lang === 'ne' ? 'प्रमाणीकृत' : 'Verified'}
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="badge badge-pending">
          <Clock size={14} />
          {lang === 'ne' ? 'प्रमाणीकरण विचाराधीन' : 'Verification Pending'}
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="badge badge-rejected">
          <XCircle size={14} />
          {lang === 'ne' ? 'अस्वीकृत' : 'Rejected'}
        </span>
      );
    }
  }

  if (type === 'isNew') {
    return (
      <span className="badge badge-new" title="First 10 visits - vetted community provider">
        <Sparkles size={14} />
        {lang === 'ne' ? 'नयाँ स्वास्थ्य प्रदायक' : 'New Provider'}
      </span>
    );
  }

  // Booking statuses
  const statusConfig = {
    requested: {
      labelNe: 'अनुरोध गरिएको',
      labelEn: 'Requested',
      icon: Clock,
      class: 'status-requested'
    },
    confirmed: {
      labelNe: 'स्वीकृत',
      labelEn: 'Confirmed',
      icon: CheckCircle,
      class: 'status-confirmed'
    },
    en_route: {
      labelNe: 'आउँदै हुनुहुन्छ',
      labelEn: 'En Route',
      icon: Truck,
      class: 'status-en_route'
    },
    completed: {
      labelNe: 'सम्पन्न',
      labelEn: 'Completed',
      icon: CheckCircle,
      class: 'status-completed'
    },
    cancelled: {
      labelNe: 'रद्द गरिएको',
      labelEn: 'Cancelled',
      icon: XCircle,
      class: 'status-cancelled'
    }
  };

  const config = statusConfig[status] || {
    labelNe: status,
    labelEn: status,
    icon: Clock,
    class: 'status-requested'
  };

  const Icon = config.icon;

  return (
    <span className={`badge ${config.class}`}>
      <Icon size={14} />
      {lang === 'ne' ? config.labelNe : config.labelEn}
    </span>
  );
};
