import React from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function GroupsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1 px-6">
        <View className="pt-4 pb-8">
          <Text className="text-3xl font-bold text-primary mb-2">Study Groups</Text>
          <Text className="text-textSecondary text-lg mb-8">
            Find and join study groups
          </Text>
          
          {/* We'll build this out next */}
          <View className="bg-cardLight p-6 rounded-xl">
            <Text className="text-textPrimary">
              Groups list coming soon...
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}