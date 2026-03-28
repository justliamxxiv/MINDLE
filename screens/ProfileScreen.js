import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Welcome');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 px-6">
        <View className="pt-4 pb-8">
          <Text className="text-3xl font-bold text-primary mb-2">Profile</Text>
          <Text className="text-textSecondary text-lg mb-8">
            Manage your account
          </Text>
          
          {/* We'll build this out next */}
          <View className="bg-cardLight p-6 rounded-xl mb-4">
            <Text className="text-textPrimary mb-2 font-semibold">Email</Text>
            <Text className="text-textSecondary">{auth.currentUser?.email}</Text>
          </View>

          <TouchableOpacity
            className="bg-accent py-4 rounded-xl"
            onPress={handleLogout}
          >
            <Text className="text-white text-center text-lg font-semibold">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}