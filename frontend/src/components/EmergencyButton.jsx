import React, { useState } from 'react';
import { PhoneCall, Ambulance, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HOTLINE, HOTLINE_DISPLAY, AMBULANCE } from '../config';

// Emergency / panic contact (readme §6). Opens a two-option sheet so a life-threatening case
// goes straight to 102 instead of waiting on our dispatch line.
export const EmergencyButton = () => {
  const { lang, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const ne = lang === 'ne';

  // Staff are the dispatch line; the patient-facing panic button would only cover their queue.
  if (isStaff) return null;

  return (
    <>
      <button
        type="button"
        className="emergency-fab"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={ne ? 'आपतकालीन सहयोग' : 'Emergency help'}
      >
        <PhoneCall size={18} />
        <span>{ne ? 'आपतकालीन सहयोग' : 'Emergency Help'}</span>
      </button>

      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={ne ? 'आपतकालीन सम्पर्क' : 'Emergency contacts'}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{ne ? 'आपतकालीन सम्पर्क' : 'Emergency contacts'}</h3>
              <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label={ne ? 'बन्द गर्नुहोस्' : 'Close'}>
                <X size={20} />
              </button>
            </div>

            <a href={`tel:${AMBULANCE}`} className="sheet-action sheet-action-danger">
              <Ambulance size={22} />
              <div>
                <strong>{ne ? `एम्बुलेन्स — ${AMBULANCE}` : `Ambulance — ${AMBULANCE}`}</strong>
                <span>{ne ? 'सास फेर्न गाह्रो, बेहोस, छाती दुखाइ, धेरै रगत बग्नु' : 'Breathing trouble, unconscious, chest pain, heavy bleeding'}</span>
              </div>
            </a>

            <a href={`tel:${HOTLINE}`} className="sheet-action">
              <PhoneCall size={22} />
              <div>
                <strong>{ne ? `घरको डाक्टर डिस्प्याच — ${HOTLINE_DISPLAY}` : `GharkoDoctor dispatch — ${HOTLINE_DISPLAY}`}</strong>
                <span>{ne ? 'भिजिटमा समस्या, स्वास्थ्यकर्मीबारे गुनासो, फोनबाट बुकिङ' : 'Problem during a visit, provider concern, book by phone'}</span>
              </div>
            </a>
          </div>
        </div>
      )}
    </>
  );
};
