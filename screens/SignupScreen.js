import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export default function SignupScreen({ navigation }) {
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
  
  // Save basic user info immediately
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    name: name.trim(),
    profileCompleted: false,
    createdAt: new Date().toISOString(),
  });
  
  // Navigate to profile setup
  navigation.replace('ProfileSetup', { userName: name });
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'This email is already registered. Please login instead.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'Password is too weak. Please use a stronger password.');
      } else {
        Alert.alert('Error', 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-8 pt-16 pb-8">
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-primary mb-2">Create Account</Text>
          <Text className="text-textSecondary text-lg">
            Join{' '}
            <Text style={{ fontFamily: 'Fredoka-SemiBold', color: '#FF3131' }}>
              mindle
            </Text>
            {' '}today
          </Text>
        </View>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-textPrimary mb-2 font-medium">Full Name</Text>
          <TextInput
            className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
        </View>

        {/* Email Input */}
        <View className="mb-4">
          <Text className="text-textPrimary mb-2 font-medium">Email</Text>
          <TextInput
            className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
            placeholder="your.email@university.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Password Input */}
        <View className="mb-4">
          <Text className="text-textPrimary mb-2 font-medium">Password</Text>
          <TextInput
            className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
            placeholder="Create a strong password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          
          {/* Password Requirements */}
          <View className="mt-3 space-y-2">
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${hasMinLength ? 'bg-success' : 'bg-gray-300'}`} />
              <Text className={`text-sm ${hasMinLength ? 'text-success' : 'text-textSecondary'}`}>
                At least 8 characters
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${hasUpperCase ? 'bg-success' : 'bg-gray-300'}`} />
              <Text className={`text-sm ${hasUpperCase ? 'text-success' : 'text-textSecondary'}`}>
                One uppercase letter
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${hasNumber ? 'bg-success' : 'bg-gray-300'}`} />
              <Text className={`text-sm ${hasNumber ? 'text-success' : 'text-textSecondary'}`}>
                One number
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`w-3 h-3 rounded-full mr-2 ${hasSpecialChar ? 'bg-success' : 'bg-gray-300'}`} />
              <Text className={`text-sm ${hasSpecialChar ? 'text-success' : 'text-textSecondary'}`}>
                One special character (!@#$%^&*)
              </Text>
            </View>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View className="mb-6">
          <Text className="text-textPrimary mb-2 font-medium">Confirm Password</Text>
          <TextInput
            className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
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
          <Text className="text-textSecondary text-center">
            Already have an account?{' '}
            <Text className="text-accent font-semibold">Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}