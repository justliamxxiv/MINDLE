import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { UserProvider } from './context/UserContext';

// Import screens
import WelcomeScreen from './screens/WelcomeScreen';
import AuthOptionsScreen from './screens/AuthOptionsScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import MainAppNavigator from './screens/MainAppNavigator';

const Stack = createNativeStackNavigator();

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
    <UserProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Welcome"
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
          }}
        >
          <Stack.Screen 
            name="Welcome" 
            component={WelcomeScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen 
            name="AuthOptions" 
            component={AuthOptionsScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen 
            name="ProfileSetup" 
            component={ProfileSetupScreen}
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen 
            name="MainApp" 
            component={MainAppNavigator}
            options={{ gestureEnabled: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}