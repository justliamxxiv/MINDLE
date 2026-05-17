import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

// Required for expo-auth-session to close the browser after OAuth
WebBrowser.maybeCompleteAuthSession();

// TODO: Replace with your actual Google OAuth Web Client ID from Firebase Console
// Firebase Console → Project Settings → General → Your apps → Web app → OAuth 2.0 Client IDs
// Also add your Expo client ID if testing in Expo Go (from console.cloud.google.com)
const GOOGLE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com'; // optional, for native iOS
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com'; // optional, for native Android

export default function AuthOptionsScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const [_request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication.idToken, response.authentication.accessToken);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
      setLoading(false);
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (idToken, accessToken) => {
    try {
      setLoading(true);
      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().profileCompleted) {
        navigation.replace('MainApp');
      } else {
        navigation.replace('ProfileSetup', {
          userName: user.displayName || '',
          userEmail: user.email || '',
        });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await promptAsync();
    // If useEffect won't fire (no response type), stop spinning
    if (!result || (result.type !== 'success' && result.type !== 'error')) {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-8 justify-center">
      <StatusBar style="dark" />

      {/* Logo */}
      <View className="items-center mb-16">
        <Image
          source={require('../assets/Logo.png')}
          style={{ width: 200, height: 70 }}
          resizeMode="contain"
        />
      </View>

      {/* Google Sign In Button */}
      <TouchableOpacity
        className="bg-white border-2 border-gray-300 w-full py-4 rounded-xl mb-4 flex-row items-center justify-center"
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#DB4437" />
        ) : (
          <>
            <AntDesign name="google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
            <Text className="text-textPrimary text-lg font-semibold">
              Continue with Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-4 text-textSecondary">OR</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Email Signup Button */}
      <TouchableOpacity
        className="bg-primary w-full py-4 rounded-xl mb-4"
        onPress={() => navigation.replace('Signup')}
        disabled={loading}
      >
        <Text className="text-white text-center text-lg font-semibold">
          Sign up with Email
        </Text>
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity
        onPress={() => navigation.replace('Login')}
        className="mt-4"
        disabled={loading}
      >
        <Text className="text-textSecondary text-center">
          Already have an account?{' '}
          <Text className="text-accent font-semibold">Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}