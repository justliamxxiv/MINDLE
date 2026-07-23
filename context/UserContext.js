import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebaseConfig';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingSeen, setOnboardingSeen] = useState(false);

  useEffect(() => {
    let authResolved = false;
    let onboardingResolved = false;

    const tryFinish = () => {
      if (authResolved && onboardingResolved) setLoading(false);
    };

    AsyncStorage.getItem('onboarding_seen').then((value) => {
      setOnboardingSeen(value === 'true');
      onboardingResolved = true;
      tryFinish();
    });

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // Show spinner while we resolve user data to prevent screen flashes
      setLoading(true);
      setFirebaseUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          setUserData(userDoc.exists() ? userDoc.data() : null);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      authResolved = true;
      tryFinish();
    });

    return unsubscribe;
  }, []);

  const markOnboardingSeen = async () => {
    await AsyncStorage.setItem('onboarding_seen', 'true');
    setOnboardingSeen(true);
  };

  const refreshUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) setUserData(userDoc.data());
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  return (
    <UserContext.Provider value={{ userData, firebaseUser, loading, onboardingSeen, markOnboardingSeen, refreshUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};