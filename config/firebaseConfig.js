import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBU4U2cglH37nxFO8f3L_mJ65s-0N1txBI",
  authDomain: "mindle-test.firebaseapp.com",
  projectId: "mindle-test",
  storageBucket: "mindle-test.firebasestorage.app",
  messagingSenderId: "661031411683",
  appId: "1:661031411683:web:b4110f8aa1a08c1d6a0ad6"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// initializeAuth can only be called once; on hot reload getAuth returns the existing instance
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

export default app;