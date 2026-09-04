import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { subscribeTutors, subscribeStudentSessions } from '../services/sessionService';
import { computeTutorProgress } from '../utils/tutorProgress';
import { openWhatsApp } from '../utils/whatsapp';
import { formatHourlyRate } from '../utils/currency';
import DismissKeyboardView from '../components/DismissKeyboardView';

const SUBJECT_FILTERS = ['All', 'Top Rated', 'Free', 'STEM', 'Exam Prep'];

const ACCENT_COLORS = ['#FF3131', '#4CAF50', '#090F43', '#FFB800', '#2196F3', '#9C27B0'];
const PROGRESS_COLORS = ['#FF3131', '#FFB800', '#4CAF50', '#2196F3', '#9C27B0', '#090F43'];

export default function TutorsScreen({ navigation }) {
  const { userData, firebaseUser } = useUser();
  const { isDark } = useTheme();
  const [activeFilter, setActiveFilter] = useState('All');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState([]);

  const firstName = userData?.name?.split(' ')[0] || 'Student';

  useEffect(() => {
    const unsub = subscribeTutors(
      (data) => {
        // Honor the tutor's availability toggle and privacy setting
        setTutors(data.filter((t) => t.isAvailable !== false && t.privacy_appearInSearch !== false));
        setLoading(false);
      },
      (error) => {
        console.error('Tutors listener error:', error);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const unsub = subscribeStudentSessions(
      firebaseUser.uid,
      (data) => setSessions(data),
      (error) => console.error('Sessions listener error:', error),
    );
    return unsub;
  }, [firebaseUser?.uid]);

  const tutorProgress = computeTutorProgress(sessions).map((t, i) => ({
    id: t.tutorId,
    course: t.course,
    tutor: t.tutorName,
    whatsapp: t.tutorWhatsapp,
    sessions: t.count,
    hasActive: t.hasActive,
    color: PROGRESS_COLORS[i % PROGRESS_COLORS.length],
  }));

  const STEM_KEYWORDS = ['science', 'technology', 'engineering', 'mathematics', 'maths', 'math', 'physics', 'chemistry', 'biology', 'computer', 'statistics', 'calculus', 'software', 'electrical', 'mechanical', 'civil', 'biochemistry'];
  const EXAM_KEYWORDS = ['exam', 'waec', 'jamb', 'neco', 'utme', 'revision', 'test prep', 'past questions', 'gce'];

  const filtered = tutors.filter((t) => {
    const matchesSearch = search.trim() === '' ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.department?.toLowerCase().includes(search.toLowerCase()) ||
      t.bio?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === 'Free') return !t.hourlyRate || t.hourlyRate.toLowerCase().includes('free');
    if (activeFilter === 'Top Rated') return (t.rating || 0) >= 4;
    if (activeFilter === 'STEM') {
      const haystack = `${t.department} ${t.bio}`.toLowerCase();
      return STEM_KEYWORDS.some((kw) => haystack.includes(kw));
    }
    if (activeFilter === 'Exam Prep') {
      const haystack = `${t.bio} ${t.availability}`.toLowerCase();
      return EXAM_KEYWORDS.some((kw) => haystack.includes(kw));
    }
    return true;
  });

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <DismissKeyboardView>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-4 pb-8">

          {/* Header */}
          <View className="mb-6">
            <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Tutors</Text>
            <Text className="text-3xl font-bold mb-2" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Learn with the right guide</Text>
            <Text className="text-base leading-6" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
              Browse trusted tutors, compare rates, and find support that fits how you like to study, {firstName}.
            </Text>
          </View>

          {/* Search */}
          <View className={`rounded-2xl px-4 py-3 flex-row items-center mb-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
            <Ionicons name="search-outline" size={20} color={isDark ? '#9CA3AF' : '#666666'} />
            <TextInput
              placeholder="Search tutors, courses, or skills"
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3"
              style={{ color: isDark ? '#FFFFFF' : '#000000' }}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ paddingRight: 8 }}>
            {SUBJECT_FILTERS.map((filter) => {
              const active = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  className={`mr-3 px-4 py-2 rounded-full ${active ? 'bg-primary' : isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.85}
                >
                  <Text
                    className="font-semibold text-sm"
                    style={{ color: active ? '#FFFFFF' : isDark ? '#FFFFFF' : '#090F43' }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Spotlight */}
          <View className="bg-accent rounded-3xl p-6 mb-6">
            <View className="flex-row justify-between items-start mb-5">
              <View className="flex-1 pr-4">
                <Text className="text-white text-sm opacity-80 mb-1">Tutor Spotlight</Text>
                <Text className="text-white text-2xl font-bold mb-2">Get unstuck faster</Text>
                <Text className="text-white opacity-90 leading-6">
                  Book focused help for difficult courses, exam prep, or project work.
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="rounded-2xl p-3">
                <Ionicons name="school" size={24} color="#FFFFFF" />
              </View>
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">{loading ? '—' : tutors.length}</Text>
                <Text className="text-white opacity-80 text-sm mt-1">Available tutors</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">
                  {loading || tutors.length === 0 ? '—' : (tutors.reduce((s, t) => s + (t.rating || 0), 0) / tutors.length).toFixed(1)}
                </Text>
                <Text className="text-white opacity-80 text-sm mt-1">Average rating</Text>
              </View>
            </View>
          </View>

          {/* Your Progress */}
          {tutorProgress.length > 0 && (
            <View className="mb-6">
              <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Your Progress</Text>
              <View style={{ gap: 12 }}>
                {tutorProgress.map((item) => (
                  <View
                    key={item.id}
                    className={`rounded-2xl p-4 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                          {item.course}
                        </Text>
                        <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                          with {item.tutor}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                        <Text className="text-xs font-semibold" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                          {item.sessions} sessions
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-3">
                      <View className={`h-2 rounded-full flex-1 mr-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        <View className="h-2 rounded-full w-full" style={{ backgroundColor: item.color, opacity: 0.3 }} />
                      </View>
                      <Text
                        className="text-xs font-semibold"
                        style={{ color: item.hasActive ? item.color : (isDark ? '#9CA3AF' : '#666666') }}
                      >
                        {item.hasActive ? 'In progress' : 'Completed'}
                      </Text>
                    </View>

                    {item.whatsapp ? (
                      <TouchableOpacity
                        className="flex-row items-center justify-center py-2.5 rounded-xl"
                        style={{ backgroundColor: '#25D36618' }}
                        onPress={() => openWhatsApp(item.whatsapp)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="logo-whatsapp" size={16} color="#128C7E" />
                        <Text className="text-sm font-semibold ml-2" style={{ color: '#128C7E' }}>Message on WhatsApp</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tutor list */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
              {activeFilter === 'All' ? 'All tutors' : activeFilter}
            </Text>
            <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{filtered.length} found</Text>
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#FF3131" />
              <Text className="mt-3" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Loading tutors...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className={`rounded-2xl p-10 items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
              <Ionicons name="school-outline" size={48} color="#CCCCCC" />
              <Text className="text-center mt-3 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>No tutors found</Text>
              <Text className="text-xs text-center mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                Try a different search or filter
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }} className="mb-6">
              {filtered.map((tutor, index) => {
                const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
                const initials = tutor.name?.split(' ').map((p) => p[0]).join('').slice(0, 2) || '?';
                return (
                  <View key={tutor.id} className={`rounded-3xl p-5 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                    {/* Top row */}
                    <View className="flex-row items-start mb-4">
                      <View className="w-14 h-14 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: accent + '18' }}>
                        <Text className="text-lg font-bold" style={{ color: accent }}>{initials}</Text>
                      </View>
                      <View className="flex-1 pr-3">
                        <Text className="text-lg font-bold mb-0.5" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{tutor.name}</Text>
                        <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{tutor.department}</Text>
                        <View className="flex-row items-center">
                          {tutor.rating > 0 && (
                            <>
                              <Ionicons name="star" size={14} color="#FFB800" />
                              <Text className="text-sm font-semibold ml-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{tutor.rating}</Text>
                              <Text className="text-sm mx-2" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>·</Text>
                            </>
                          )}
                          <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{tutor.university}</Text>
                        </View>
                      </View>
                      <View className={`px-3 py-2 rounded-full ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                        <Text className="text-xs font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                          {formatHourlyRate(tutor.hourlyRate)}
                        </Text>
                      </View>
                    </View>

                    {/* Bio */}
                    {tutor.bio ? (
                      <Text className="leading-6 mb-4" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{tutor.bio}</Text>
                    ) : null}

                    {/* Availability */}
                    {tutor.availability ? (
                      <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={16} color={isDark ? '#9CA3AF' : '#666666'} />
                          <Text className="text-sm ml-2" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{tutor.availability}</Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Actions */}
                    <TouchableOpacity
                      className="bg-accent rounded-2xl py-3"
                      activeOpacity={0.85}
                      onPress={() => navigation.navigate('RequestSession', { tutor })}
                    >
                      <Text className="text-white text-center font-semibold">Request a Session</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      </DismissKeyboardView>
    </SafeAreaView>
  );
}
