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
  runTransaction,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const SESSION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  TUTOR_CONFIRMED: 'tutor_confirmed', // tutor marked done, waiting for student
  COMPLETED: 'completed',             // both sides confirmed
};

// Student requests a session from a tutor. Both WhatsApp numbers are stored
// on the session so contact can be revealed once the tutor accepts.
export async function requestSession({
  tutorId, tutorName, tutorWhatsapp,
  studentId, studentName, studentWhatsapp,
  course, date, time, type, maxStudents, note,
}) {
  return addDoc(collection(db, 'sessions'), {
    tutorId,
    tutorName,
    tutorWhatsapp: tutorWhatsapp || '',
    studentId,
    studentName,
    studentWhatsapp: studentWhatsapp || '',
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

// Either party cancels a pending or accepted session
export async function cancelSession(sessionId, cancelledBy) {
  return updateDoc(doc(db, 'sessions', sessionId), {
    status: SESSION_STATUS.CANCELLED,
    cancelledBy, // 'student' | 'tutor'
  });
}

// Student hides a declined/cancelled request from their home screen
export async function dismissSession(sessionId) {
  return updateDoc(doc(db, 'sessions', sessionId), { studentDismissed: true });
}

// Tutor marks their side done — moves to tutor_confirmed, optionally with a score (1-5)
export async function tutorConfirmSession(sessionId, score) {
  const data = { status: SESSION_STATUS.TUTOR_CONFIRMED };
  if (score != null) data.score = score;
  return updateDoc(doc(db, 'sessions', sessionId), data);
}

// Student confirms — moves to completed, optionally with a tutor rating (1-5).
// A rating is also rolled up onto the tutor's profile so it shows in tutor search.
export async function studentConfirmSession(sessionId, tutorId, tutorRating) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const data = { status: SESSION_STATUS.COMPLETED, completedAt: serverTimestamp() };
  if (tutorRating == null || !tutorId) {
    return updateDoc(sessionRef, data);
  }
  data.tutorRating = tutorRating;
  const tutorRef = doc(db, 'users', tutorId);
  return runTransaction(db, async (tx) => {
    const tutorSnap = await tx.get(tutorRef);
    tx.update(sessionRef, data);
    if (tutorSnap.exists()) {
      const ratingSum = (tutorSnap.data().ratingSum || 0) + tutorRating;
      const reviewsCount = (tutorSnap.data().reviewsCount || 0) + 1;
      tx.update(tutorRef, {
        ratingSum,
        reviewsCount,
        rating: Math.round((ratingSum / reviewsCount) * 10) / 10,
      });
    }
  });
}

// Live listener — tutor sees all their sessions
export function subscribeTutorSessions(tutorId, callback, onError) {
  const q = query(
    collection(db, 'sessions'),
    where('tutorId', '==', tutorId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

// Live listener — student sees all their sessions
export function subscribeStudentSessions(studentId, callback, onError) {
  const q = query(
    collection(db, 'sessions'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}

// Live listener — fetch all tutors (users with accountType === 'tutor')
export function subscribeTutors(callback, onError) {
  const q = query(
    collection(db, 'users'),
    where('accountType', '==', 'tutor'),
    where('profileCompleted', '==', true)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}
