import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const SESSION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  TUTOR_CONFIRMED: 'tutor_confirmed', // tutor marked done, waiting for student
  COMPLETED: 'completed',             // both sides confirmed
};

// Student requests a session from a tutor
export async function requestSession({ tutorId, tutorName, studentId, studentName, course, date, time, type, maxStudents, note }) {
  return addDoc(collection(db, 'sessions'), {
    tutorId,
    tutorName,
    studentId,
    studentName,
    course,
    date,
    time,
    type,           // '1-on-1' | 'group'
    maxStudents: type === 'group' ? maxStudents : 1,
    enrolledStudents: [studentId],
    status: SESSION_STATUS.PENDING,
    note: note || '',
    createdAt: serverTimestamp(),
  });
}

// Tutor accepts or declines a session request
export async function updateSessionStatus(sessionId, status) {
  return updateDoc(doc(db, 'sessions', sessionId), { status });
}

// Tutor marks their side done — moves to tutor_confirmed, optionally with a score (1-5)
export async function tutorConfirmSession(sessionId, score) {
  const data = { status: SESSION_STATUS.TUTOR_CONFIRMED };
  if (score != null) data.score = score;
  return updateDoc(doc(db, 'sessions', sessionId), data);
}

// Student confirms — moves to completed, optionally with a tutor rating (1-5)
export async function studentConfirmSession(sessionId, tutorRating) {
  const data = { status: SESSION_STATUS.COMPLETED };
  if (tutorRating != null) data.tutorRating = tutorRating;
  return updateDoc(doc(db, 'sessions', sessionId), data);
}

// Live listener — tutor sees all their sessions
export function subscribeTutorSessions(tutorId, callback) {
  const q = query(
    collection(db, 'sessions'),
    where('tutorId', '==', tutorId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Live listener — student sees all their sessions
export function subscribeStudentSessions(studentId, callback) {
  const q = query(
    collection(db, 'sessions'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Live listener — fetch all tutors (users with accountType === 'tutor')
export function subscribeTutors(callback) {
  const q = query(
    collection(db, 'users'),
    where('accountType', '==', 'tutor'),
    where('profileCompleted', '==', true)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
