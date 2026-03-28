import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBU4U2cglH37nxFO8f3L_mJ65s-0N1txBI",
  authDomain: "mindle-test.firebaseapp.com",
  projectId: "mindle-test",
  storageBucket: "mindle-test.firebasestorage.app",
  messagingSenderId: "661031411683",
  appId: "1:661031411683:web:b4110f8aa1a08c1d6a0ad6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore (we'll use this later for storing user data)
export const db = getFirestore(app);

export default app;