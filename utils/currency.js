// Tutors type their rate free-form during profile setup ("2000", "2000/hour",
// "free", etc). Normalize it for display everywhere it's shown, without
// forcing a particular format while they're typing it.
export function formatHourlyRate(rate, emptyFallback = 'Free') {
  const trimmed = (rate || '').trim();
  if (!trimmed) return emptyFallback;
  if (/free/i.test(trimmed)) return trimmed;
  if (/[₦$€£]/.test(trimmed)) return trimmed;

  const numeric = trimmed.replace(/[^0-9.]/g, '');
  if (!numeric) return trimmed;

  const hasPerHour = /\/\s*hour|\/\s*hr|per\s*hour/i.test(trimmed);
  return `₦${Number(numeric).toLocaleString()}${hasPerHour ? '' : '/hour'}`;
}
