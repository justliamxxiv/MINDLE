import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AntDesign } from '@expo/vector-icons';

export default function AuthOptionsScreen({ navigation }) {
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
        onPress={() => {/* Google sign in - we'll add this later */}}
      >
        <AntDesign name="google" size={20} color="#DB4437" style={{ marginRight: 10 }} />
        <Text className="text-textPrimary text-lg font-semibold">
          Continue with Google
        </Text>
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
      >
        <Text className="text-white text-center text-lg font-semibold">
          Sign up with Email
        </Text>
      </TouchableOpacity>

      {/* Login Link */}
      <TouchableOpacity
        onPress={() => navigation.replace('Login')}
        className="mt-4"
      >
        <Text className="text-textSecondary text-center">
          Already have an account?{' '}
          <Text className="text-accent font-semibold">Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}