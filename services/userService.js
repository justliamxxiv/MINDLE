import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { normalizePhone } from '../utils/whatsapp';

// Saves profile updates while claiming the WhatsApp number in the
// `phones/{normalizedNumber}` registry, atomically. Because the number is the
// document ID, two accounts can never hold the same one — this is what makes
// phone numbers unique like emails. Throws { code: 'phone-taken' } if another
// account already owns the number.
export async function updateUserWithUniquePhone(uid, newNumber, oldNumber, updates) {
  const newKey = normalizePhone(newNumber);
  const oldKey = normalizePhone(oldNumber);
  const userRef = doc(db, 'users', uid);

  return runTransaction(db, async (tx) => {
    const phoneRef = doc(db, 'phones', newKey);
    const phoneSnap = await tx.get(phoneRef);
    if (phoneSnap.exists() && phoneSnap.data().uid !== uid) {
      const err = new Error('This WhatsApp number is already linked to another account.');
      err.code = 'phone-taken';
      throw err;
    }

    // Release the previously claimed number when it changes
    let oldRef = null;
    if (oldKey && oldKey !== newKey) {
      oldRef = doc(db, 'phones', oldKey);
      const oldSnap = await tx.get(oldRef);
      if (!oldSnap.exists() || oldSnap.data().uid !== uid) oldRef = null;
    }

    tx.set(phoneRef, { uid });
    if (oldRef) tx.delete(oldRef);
    tx.set(
      userRef,
      { ...updates, whatsappNumber: (newNumber || '').trim(), whatsappNormalized: newKey },
      { merge: true }
    );
  });
}
