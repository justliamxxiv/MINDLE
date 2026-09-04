import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { friendlyAuthError } from '../utils/authErrors';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/PasswordInput';
import DismissKeyboardView from '../components/DismissKeyboardView';

export default function LoginScreen({ navigation }) {
  const { isDark } = useTheme();
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
      await signInWithEmailAndPassword(auth, email, password);
      // UserContext's auth listener routes to MainApp or ProfileSetup
    } catch (error) {
      Alert.alert('Login failed', friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DismissKeyboardView>
    <View className={`flex-1 px-8 justify-center ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View className="mb-12">
        <Text className="text-4xl font-bold mb-2" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Welcome back</Text>
        <Text className="text-lg" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Log in to continue</Text>
      </View>

      {/* Email Input */}
      <View className="mb-4">
        <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Email</Text>
        <TextInput
          className={`px-4 py-4 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
          style={{ color: isDark ? '#FFFFFF' : '#000000' }}
          placeholder="your.email@university.edu"
          placeholderTextColor="#9CA3AF"
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
      <PasswordInput
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />

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
                  } catch (error) {
                    Alert.alert('Could not send email', friendlyAuthError(error));
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
        <Text className="text-center" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
          Don't have an account?{' '}
          <Text className="text-accent font-semibold">Sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
    </DismissKeyboardView>
  );
}