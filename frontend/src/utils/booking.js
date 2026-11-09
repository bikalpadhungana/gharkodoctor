// Shared booking display helpers.

export const ACTIVE_STATUSES = ['requested', 'confirmed', 'en_route'];

export const isActive = (b) => ACTIVE_STATUSES.includes(b.status);

export const serviceName = (b, lang) =>
  b.serviceType?.displayName?.[lang] || b.serviceType?.displayName?.ne || b.serviceType?.name || '';

const locale = (lang) => (lang === 'ne' ? 'ne-NP' : 'en-US');

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const isToday = (date) => sameDay(new Date(date), new Date());

// "Today, 10:00 AM" / "Tomorrow, 2:00 PM" / "Fri, 14 Nov, 9:00 AM"
export const friendlyTime = (date, lang) => {
  const d = new Date(date);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const time = d.toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' });
  if (sameDay(d, now)) return `${lang === 'ne' ? 'आज' : 'Today'}, ${time}`;
  if (sameDay(d, tomorrow)) return `${lang === 'ne' ? 'भोलि' : 'Tomorrow'}, ${time}`;
  return `${d.toLocaleDateString(locale(lang), { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
};

// "5 min ago" / "3 hr ago" — used for dispatch queue ageing.
export const ageLabel = (date, lang) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 60) return lang === 'ne' ? `${mins} मिनेट अघि` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return lang === 'ne' ? `${hrs} घण्टा अघि` : `${hrs} hr ago`;
  return lang === 'ne' ? `${Math.round(hrs / 24)} दिन अघि` : `${Math.round(hrs / 24)} days ago`;
};

export const minutesSince = (date) => (Date.now() - new Date(date).getTime()) / 60000;

export const greeting = (lang) => {
  const h = new Date().getHours();
  if (lang === 'ne') return h < 12 ? 'शुभ प्रभात' : h < 17 ? 'नमस्ते' : 'शुभ सन्ध्या';
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const mapsLink = (b) => {
  const q = [b.address, b.ward && `Ward ${b.ward}`, b.municipality, 'Nepal'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};
