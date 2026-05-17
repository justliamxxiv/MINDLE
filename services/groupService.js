import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export async function createGroup({ name, course, university, department, adminName, whatsappLink, description, schedule, createdBy }) {
  return addDoc(collection(db, 'groups'), {
    name,
    course,
    university,
    department,
    adminName,
    whatsappLink,
    description,
    schedule,
    createdBy,
    members: 1,
    createdAt: serverTimestamp(),
  });
}

export function subscribeGroups(callback, onError) {
  const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}
