import React from 'react';
import { PhoneCall } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmergencyButton = () => {
  const { lang } = useAuth();
  const emergencyPhone = '9800000000'; // Hotline number stub

  return (
    <a
      href={`tel:${emergencyPhone}`}
      className="emergency-fab"
      title="Emergency Helpline / आपतकालीन फोन"
    >
      <PhoneCall size={18} />
      <span>{lang === 'ne' ? 'आपतकालीन सहयोग' : 'Emergency Help'}</span>
    </a>
  );
};
