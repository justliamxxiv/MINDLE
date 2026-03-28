import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

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
      console.error('Login error:', error);
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'Invalid email or password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Invalid email address.');
      } else {
        Alert.alert('Error', 'Failed to log in. Please try again.');
      }
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
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
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
      <TouchableOpacity className="mb-8" disabled={loading}>
        <Text className="text-accent text-right">Forgot password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity
        className="bg-accent py-4 rounded-xl mb-4"
        onPress={handleLogin}
        disabled={loading}
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