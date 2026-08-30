import { SESSION_STATUS } from '../services/sessionService';

// A student's history with each tutor: every session that was actually
// confirmed to happen (active or completed) — not pending/declined/cancelled.
export function computeTutorProgress(sessions) {
  const map = {};
  sessions
    .filter((s) => [SESSION_STATUS.ACCEPTED, SESSION_STATUS.TUTOR_CONFIRMED, SESSION_STATUS.COMPLETED].includes(s.status))
    .forEach((s) => {
      if (!map[s.tutorId]) {
        map[s.tutorId] = {
          tutorId: s.tutorId,
          tutorName: s.tutorName,
          tutorWhatsapp: s.tutorWhatsapp,
          course: s.course,
          count: 0,
          hasActive: false,
        };
      }
      map[s.tutorId].count += 1;
      if (s.status !== SESSION_STATUS.COMPLETED) {
        map[s.tutorId].hasActive = true;
      }
    });
  return Object.values(map);
}
