import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { userData } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getGreetingEmoji = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '☀️';
    if (hour < 17) return '👋';
    return '🌙';
  };

  // Mock tutor progress data (we'll make this dynamic later)
  const tutorProgress = [
    { id: 1, course: 'PHY 212', tutor: 'Dr. Okonkwo', progress: 75, color: '#FF3131', sessions: 6 },
    { id: 2, course: 'CSC 301', tutor: 'Prof. Adebayo', progress: 45, color: '#FFB800', sessions: 3 },
    { id: 3, course: 'MTH 311', tutor: 'Mr. Ibrahim', progress: 90, color: '#4CAF50', sessions: 8 },
    { id: 4, course: 'ENG 205', tutor: 'Mrs. Okeke', progress: 30, color: '#2196F3', sessions: 2 },
  ];

  const upcomingSessions = [
    { id: 1, course: 'Physics', time: '2:00 PM', tutor: 'Dr. Okonkwo', color: '#FF3131' },
    { id: 2, course: 'Calculus', time: '4:30 PM', tutor: 'Prof. Adebayo', color: '#FFB800' },
  ];

  const firstName = userData?.name?.split(' ')[0] || 'Student!';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-textSecondary text-sm mb-1">
                {getGreeting()}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-4xl font-bold text-primary mr-2">
                  {firstName}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              className="bg-cardLight p-3 rounded-full"
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-outline" size={24} color="#090F43" />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View className="flex-row mb-6" style={{ gap: 12 }}>
            <View className="flex-1 bg-accent p-4 rounded-2xl">
              <Ionicons name="flame" size={28} color="#FFFFFF" />
              <Text className="text-white text-3xl font-bold mt-2">12</Text>
              <Text className="text-white text-sm opacity-90">Day Streak</Text>
            </View>
            
            <View className="flex-1 bg-primary p-4 rounded-2xl">
              <Ionicons name="trending-up" size={28} color="#FFFFFF" />
              <Text className="text-white text-3xl font-bold mt-2">8.5</Text>
              <Text className="text-white text-sm opacity-90">Avg Score</Text>
            </View>
          </View>
        </View>

        {/* Tutor Progress Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">Your Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tutors')}>
              <Text className="text-accent font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {tutorProgress.length > 0 ? (
            <View style={{ gap: 12 }}>
              {tutorProgress.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  activeOpacity={0.7}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-primary mb-1">
                        {item.course}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        with {item.tutor}
                      </Text>
                    </View>
                    <View className="bg-cardLight px-3 py-1 rounded-full">
                      <Text className="text-textPrimary text-xs font-semibold">
                        {item.sessions} sessions
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <View className="flex-1 bg-gray-200 h-2 rounded-full mr-3">
                      <View
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${item.progress}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </View>
                    <Text 
                      className="text-sm font-bold"
                      style={{ color: item.color }}
                    >
                      {item.progress}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-cardLight p-8 rounded-2xl items-center">
              <Ionicons name="school-outline" size={48} color="#CCCCCC" />
              <Text className="text-textSecondary text-center mt-3">
                Start learning with a tutor to track your progress
              </Text>
            </View>
          )}
        </View>

        {/* Upcoming Sessions */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">Today's Sessions</Text>
          </View>

          {upcomingSessions.length > 0 ? (
            <View style={{ gap: 12 }}>
              {upcomingSessions.map((session) => (
                <View
                  key={session.id}
                  className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm border border-gray-100"
                >
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: session.color + '20' }}
                  >
                    <Ionicons name="time" size={24} color={session.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-primary mb-1">
                      {session.course}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                      {session.time} • {session.tutor}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-cardLight p-6 rounded-2xl items-center">
              <Text className="text-textSecondary text-center">
                No sessions scheduled for today
              </Text>
            </View>
          )}
        </View>

        {/* Study Groups Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">Study Groups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
              <Text className="text-accent font-semibold">Explore</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-gradient-to-br from-accent to-primary rounded-2xl p-6 items-center">
            <Ionicons name="people" size={48} color="#FFFFFF" />
            <Text className="text-white text-lg font-bold mt-3 mb-2">
              Find Your Study Crew
            </Text>
            <Text className="text-white text-center text-sm opacity-90 mb-4">
              Join groups in your courses and study smarter together
            </Text>
            <TouchableOpacity
              className="bg-white px-6 py-3 rounded-xl"
              onPress={() => navigation.navigate('Groups')}
              activeOpacity={0.8}
            >
              <Text className="text-accent font-bold">Browse Groups</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-6 pb-8">
          <Text className="text-2xl font-bold text-primary mb-4">Quick Stats</Text>
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center mb-4">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-textSecondary text-xs mt-1">Groups</Text>
              </View>
              <View className="w-px h-10 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">4</Text>
                <Text className="text-textSecondary text-xs mt-1">Tutors</Text>
              </View>
              <View className="w-px h-10 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">19</Text>
                <Text className="text-textSecondary text-xs mt-1">Sessions</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}