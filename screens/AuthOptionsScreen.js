import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// NOTE: Google sign-in is parked for now. Re-enabling it requires:
//   1. Restore the GoogleSignin import, configure() call, and button
//      (see git history of this file for the working v16 implementation)
//   2. Rebuild the native app: npx expo run:ios
// The RNGoogleSignin native module crashes the JS runtime at startup if the
// installed binary was built without it, so don't restore the import alone.

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
