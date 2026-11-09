import React from 'react';

const TRACK_STEPS = [
  { key: 'requested', ne: 'अनुरोध', en: 'Requested' },
  { key: 'confirmed', ne: 'पक्का', en: 'Confirmed' },
  { key: 'en_route', ne: 'बाटोमा', en: 'On the way' },
  { key: 'completed', ne: 'सम्पन्न', en: 'Done' }
];

// Four-step visit progress indicator. Hidden for cancelled bookings.
export const BookingTracker = ({ status, lang }) => {
  if (status === 'cancelled') return null;
  const currentIdx = TRACK_STEPS.findIndex(s => s.key === status);
  return (
    <ol className="tracker" aria-label={lang === 'ne' ? 'बुकिङको अवस्था' : 'Booking progress'} style={{ listStyle: 'none', padding: 0 }}>
      {TRACK_STEPS.map((step, i) => {
        const state = i < currentIdx || status === 'completed' ? 'done' : i === currentIdx ? 'current' : '';
        return (
          <li key={step.key} className={`tracker-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="tracker-dot">{state === 'done' ? '✓' : i + 1}</span>
            <span className="tracker-label">{step[lang] || step.ne}</span>
          </li>
        );
      })}
    </ol>
  );
};
