import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const showEmailError = emailTouched && email.length > 0 && !isValidEmail;
  const canSubmit = isValidEmail && password.length > 0 && !loading;

  const handleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if user has completed their profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists() && userDoc.data().profileCompleted) {
        // Profile exists, go to main app
        navigation.replace('MainApp');
      } else {
        // Profile not completed, go to profile setup
        navigation.replace('ProfileSetup');
      }
      
    } catch (error) {
      Alert.alert('Login failed', 'The email or password you entered is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-8 justify-center">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="mb-12">
        <Text className="text-4xl font-bold text-primary mb-2">Welcome back</Text>
        <Text className="text-textSecondary text-lg">Log in to continue</Text>
      </View>

      {/* Email Input */}
      <View className="mb-4">
        <Text className="text-textPrimary mb-2 font-medium">Email</Text>
        <TextInput
          className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
          placeholder="your.email@university.edu"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setEmailTouched(true)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        {showEmailError && (
          <Text className="text-accent text-xs mt-1 ml-1">Please enter a valid email address</Text>
        )}
      </View>

      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-textPrimary mb-2 font-medium">Password</Text>
        <TextInput
          className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
      </View>

      {/* Forgot Password */}
      <TouchableOpacity
        className="mb-8"
        disabled={loading}
        onPress={() => {
          if (!isValidEmail) {
            Alert.alert('Enter your email first', 'Type your email address above so we know where to send the reset link.');
            return;
          }
          Alert.alert(
            'Reset password',
            `We'll send a reset link to ${email.trim()}.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Send link',
                onPress: async () => {
                  try {
                    await sendPasswordResetEmail(auth, email.trim());
                    Alert.alert('Email sent', 'Check your inbox for the password reset link.');
                  } catch {
                    Alert.alert('Could not send email', 'Make sure the email address is correct and try again.');
                  }
                },
              },
            ]
          );
        }}
      >
        <Text className="text-accent text-right">Forgot password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity
        className="bg-accent py-4 rounded-xl mb-4"
        onPress={handleLogin}
        disabled={!canSubmit}
        style={{ opacity: canSubmit ? 1 : 0.4 }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-white text-center text-lg font-semibold">
            Log in
          </Text>
        )}
      </TouchableOpacity>

      {/* Sign up Link */}
      <TouchableOpacity
        onPress={() => navigation.replace('Signup')}
        className="mt-4"
        disabled={loading}
      >
        <Text className="text-textSecondary text-center">
          Don't have an account?{' '}
          <Text className="text-accent font-semibold">Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}