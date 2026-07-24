import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [colorScheme, setColorScheme] = useState('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load saved preference on app start
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setColorScheme(saved);
      }
      setIsReady(true);
    });
  }, []);

  const toggleTheme = async () => {
    const next = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(next);
    await AsyncStorage.setItem('theme', next);
  };

  const isDark = colorScheme === 'dark';

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isReady }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
