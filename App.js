import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { UserProvider, useUser } from './context/UserContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const AppLightTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#FFFFFF' } };
const AppDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#000000', card: '#1A1A1A', text: '#FFFFFF', border: '#1F2937' },
};

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import AuthOptionsScreen from './screens/AuthOptionsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import MainAppNavigator from './screens/MainAppNavigator';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { userData, firebaseUser, loading, onboardingSeen } = useUser();
  const { isDark } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FF3131" />
      </View>
    );
  }

  const isSignedIn = !!firebaseUser;
  const profileComplete = userData?.profileCompleted === true;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false }}>
      {isSignedIn && profileComplete ? (
        // Authenticated: only main app reachable
        <Stack.Screen name="MainApp" component={MainAppNavigator} />
      ) : isSignedIn && !profileComplete ? (
        // Authenticated but needs profile setup (new Google user)
        <>
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
          <Stack.Screen name="MainApp" component={MainAppNavigator} />
        </>
      ) : (
        // Signed out: onboarding first time, then auth screens
        <>
          {!onboardingSeen && <Stack.Screen name="Welcome" component={WelcomeScreen} />}
          <Stack.Screen name="AuthOptions" component={AuthOptionsScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Fredoka-SemiBold': require('./assets/Fredoka-SemiBold.ttf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#FF3131" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <UserProvider>
        <AppNavigation />
      </UserProvider>
    </ThemeProvider>
  );
}

function AppNavigation() {
  const { isDark } = useTheme();
  return (
    <NavigationContainer theme={isDark ? AppDarkTheme : AppLightTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}