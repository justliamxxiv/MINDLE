import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { friendlyAuthError } from '../utils/authErrors';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from '../components/PasswordInput';

export default function SignupScreen({ navigation }) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password validation checks
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const handleSignup = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (!hasMinLength || !hasUpperCase || !hasNumber || !hasSpecialChar) {
      Alert.alert('Error', 'Password does not meet all requirements');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Firebase signup
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save basic user info immediately. The auth listener in UserContext
      // then routes to ProfileSetup, which reads the name from context.
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: name.trim(),
        profileCompleted: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Sign up failed', friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <View className="px-8 pt-16 pb-8">
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold mb-2" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Create Account</Text>
          <Text className="text-lg" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
            Join{' '}
            <Text style={{ fontFamily: 'Fredoka-SemiBold', color: '#FF3131' }}>
              mindle
            </Text>
            {' '}today
          </Text>
        </View>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Full Name</Text>
          <TextInput
            className={`px-4 py-4 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
            style={{ color: isDark ? '#FFFFFF' : '#000000' }}
            placeholder="John Doe"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
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
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Password Input */}
        <PasswordInput
          label="Password"
          placeholder="Create a strong password"
          value={password}
          onChangeText={setPassword}
          editable={!loading}
          containerClassName="mb-4"
        />

        {/* Confirm Password Input */}
        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!loading}
          containerClassName="mb-2"
        />

        {/* Password Requirements */}
        <View className="mb-6 space-y-2">
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full mr-2 ${hasMinLength ? 'bg-success' : 'bg-gray-300'}`} />
            <Text className="text-sm" style={{ color: hasMinLength ? '#4CAF50' : isDark ? '#9CA3AF' : '#666666' }}>
              At least 8 characters
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full mr-2 ${hasUpperCase ? 'bg-success' : 'bg-gray-300'}`} />
            <Text className="text-sm" style={{ color: hasUpperCase ? '#4CAF50' : isDark ? '#9CA3AF' : '#666666' }}>
              One uppercase letter
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full mr-2 ${hasNumber ? 'bg-success' : 'bg-gray-300'}`} />
            <Text className="text-sm" style={{ color: hasNumber ? '#4CAF50' : isDark ? '#9CA3AF' : '#666666' }}>
              One number
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full mr-2 ${hasSpecialChar ? 'bg-success' : 'bg-gray-300'}`} />
            <Text className="text-sm" style={{ color: hasSpecialChar ? '#4CAF50' : isDark ? '#9CA3AF' : '#666666' }}>
              One special character (!@#$%^&*)
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full mr-2 ${passwordsMatch ? 'bg-success' : 'bg-gray-300'}`} />
            <Text className="text-sm" style={{ color: passwordsMatch ? '#4CAF50' : isDark ? '#9CA3AF' : '#666666' }}>
              Passwords match
            </Text>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          className="bg-accent py-4 rounded-xl mb-4"
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Sign up
            </Text>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          className="mt-4"
          disabled={loading}
        >
          <Text className="text-center" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
            Already have an account?{' '}
            <Text className="text-accent font-semibold">Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}