import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

const SUBJECT_FILTERS = ['All', 'Top Rated', 'Free', 'STEM', 'Exam Prep'];

const MOCK_TUTORS = [
  {
    id: '1',
    name: 'Damilola Adebayo',
    title: 'Engineering Mathematics Tutor',
    university: 'University of Lagos',
    rate: 'N2,500/hr',
    rating: '4.9',
    availability: 'Weekdays, 5 PM - 9 PM',
    bio: 'Breaks down hard concepts into practical steps and exam strategies.',
    accent: '#FF3131',
  },
  {
    id: '2',
    name: 'Mariam Okonkwo',
    title: 'Organic Chemistry Tutor',
    university: 'University of Ibadan',
    rate: 'Free',
    rating: '4.8',
    availability: 'Weekends only',
    bio: 'Runs friendly review sessions with past-question drills and summaries.',
    accent: '#4CAF50',
  },
  {
    id: '3',
    name: 'Ifeanyi Nnaji',
    title: 'Programming & Algorithms',
    university: 'Covenant University',
    rate: 'N3,000/hr',
    rating: '4.7',
    availability: 'Mon, Wed, Fri',
    bio: 'Focuses on debugging mindset, coding exercises, and project support.',
    accent: '#090F43',
  },
];

export default function TutorsScreen() {
  const { userData } = useUser();
  const [activeFilter, setActiveFilter] = useState('All');

  const firstName = userData?.name?.split(' ')[0] || 'Student';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-8">
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-1">Tutors</Text>
            <Text className="text-3xl font-bold text-primary mb-2">
              Learn with the right guide
            </Text>
            <Text className="text-textSecondary text-base leading-6">
              Browse trusted tutors, compare rates, and find support that fits how you like to study, {firstName}.
            </Text>
          </View>

          <View className="bg-cardLight rounded-2xl px-4 py-3 flex-row items-center mb-4">
            <Ionicons name="search-outline" size={20} color="#666666" />
            <TextInput
              placeholder="Search tutors, courses, or skills"
              placeholderTextColor="#666666"
              className="flex-1 ml-3 text-textPrimary"
              editable={false}
            />
            <Ionicons name="funnel-outline" size={20} color="#090F43" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {SUBJECT_FILTERS.map((filter) => {
              const active = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  className={`mr-3 px-4 py-2 rounded-full ${active ? 'bg-primary' : 'bg-cardLight'}`}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.85}
                >
                  <Text className={`${active ? 'text-white' : 'text-primary'} font-semibold text-sm`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View className="bg-accent rounded-3xl p-6 mb-6">
            <View className="flex-row justify-between items-start mb-5">
              <View className="flex-1 pr-4">
                <Text className="text-white text-sm opacity-80 mb-1">Tutor Spotlight</Text>
                <Text className="text-white text-2xl font-bold mb-2">
                  Get unstuck faster
                </Text>
                <Text className="text-white opacity-90 leading-6">
                  Book focused help for difficult courses, exam prep, or project work when you need that extra push.
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="rounded-2xl p-3">
                <Ionicons name="school" size={24} color="#FFFFFF" />
              </View>
            </View>

            <View className="flex-row" style={{ gap: 12 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">36</Text>
                <Text className="text-white opacity-80 text-sm mt-1">Available tutors</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">4.8</Text>
                <Text className="text-white opacity-80 text-sm mt-1">Average rating</Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">Recommended tutors</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text className="text-accent font-semibold">See all</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 14 }} className="mb-6">
            {MOCK_TUTORS.map((tutor) => (
              <TouchableOpacity
                key={tutor.id}
                className="bg-white rounded-3xl p-5 border border-gray-100"
                activeOpacity={0.86}
              >
                <View className="flex-row items-start mb-4">
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${tutor.accent}15` }}
                  >
                    <Text
                      className="text-lg font-bold"
                      style={{ color: tutor.accent }}
                    >
                      {tutor.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                    </Text>
                  </View>

                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-bold text-primary mb-1">{tutor.name}</Text>
                    <Text className="text-textSecondary mb-2">{tutor.title}</Text>
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text className="text-primary text-sm font-semibold ml-1">{tutor.rating}</Text>
                      <Text className="text-textSecondary text-sm ml-3">{tutor.university}</Text>
                    </View>
                  </View>

                  <View className="bg-cardLight px-3 py-2 rounded-full">
                    <Text className="text-primary text-xs font-semibold">{tutor.rate}</Text>
                  </View>
                </View>

                <Text className="text-textSecondary leading-6 mb-4">{tutor.bio}</Text>

                <View className="bg-cardLight rounded-2xl p-4 mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="time-outline" size={16} color="#666666" />
                    <Text className="text-textSecondary text-sm ml-2">{tutor.availability}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="flash-outline" size={16} color="#666666" />
                    <Text className="text-textSecondary text-sm ml-2">Strong with revision, practice drills, and concept review</Text>
                  </View>
                </View>

                <View className="flex-row" style={{ gap: 12 }}>
                  <TouchableOpacity className="flex-1 bg-primary rounded-2xl py-3" activeOpacity={0.85}>
                    <Text className="text-white text-center font-semibold">View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity className="flex-1 bg-accent rounded-2xl py-3" activeOpacity={0.85}>
                    <Text className="text-white text-center font-semibold">Chat on WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-cardLight rounded-3xl p-5">
            <View className="flex-row items-center mb-3">
              <View className="bg-white rounded-2xl p-3 mr-3">
                <Ionicons name="sparkles-outline" size={22} color="#090F43" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-primary">Become a tutor</Text>
                <Text className="text-textSecondary leading-5">
                  Share what you know, help other students, and build your tutoring presence.
                </Text>
              </View>
            </View>

            <TouchableOpacity className="bg-white rounded-2xl py-4 border border-gray-200" activeOpacity={0.85}>
              <Text className="text-primary text-center text-base font-semibold">
                Set Up Tutor Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
