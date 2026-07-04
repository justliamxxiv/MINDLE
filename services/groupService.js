import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
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

// Only the creator can update/delete — enforced by Firestore rules
export async function updateGroup(groupId, updates) {
  return updateDoc(doc(db, 'groups', groupId), updates);
}

export async function deleteGroup(groupId) {
  return deleteDoc(doc(db, 'groups', groupId));
}

export function subscribeGroups(callback, onError) {
  const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, onError);
}
