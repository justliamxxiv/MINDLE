import { DAYS_OF_WEEK } from './academicOptions';

export function buildAvailabilityString({ days, hoursMode, fromTime, toTime }) {
  const daysLabel = days.length === 7 ? 'Every day' : days.join(', ');
  const hoursLabel = hoursMode === 'always'
    ? 'Always free'
    : hoursMode === 'appointment'
    ? 'By appointment only'
    : `${fromTime}–${toTime}`;
  return `${daysLabel} · ${hoursLabel}`;
}

export function parseAvailabilityString(str) {
  const fallback = { days: [], hoursMode: 'always', fromTime: '', toTime: '' };
  if (!str) return fallback;

  const parts = str.split(' · ');
  if (parts.length !== 2) return fallback;
  const [daysPart, hoursPart] = parts;

  const days = daysPart === 'Every day'
    ? [...DAYS_OF_WEEK]
    : daysPart.split(', ').filter((d) => DAYS_OF_WEEK.includes(d));

  if (hoursPart === 'Always free') return { days, hoursMode: 'always', fromTime: '', toTime: '' };
  if (hoursPart === 'By appointment only') return { days, hoursMode: 'appointment', fromTime: '', toTime: '' };

  const timeParts = hoursPart.split('–');
  if (timeParts.length === 2) {
    return { days, hoursMode: 'selected', fromTime: timeParts[0].trim(), toTime: timeParts[1].trim() };
  }
  return fallback;
}
