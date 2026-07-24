import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { requestSession } from '../services/sessionService';
import SearchableSelect from '../components/SearchableSelect';

const SESSION_TYPES = [
  { label: '1-on-1 (Private)', value: '1-on-1' },
  { label: 'Group Session', value: 'group' },
];

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
].map((t) => ({ label: t, value: t }));

export default function RequestSessionScreen({ navigation, route }) {
  const { tutor } = route.params;
  const { userData, firebaseUser } = useUser();
  const { isDark } = useTheme();

  const [course, setCourse] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sessionType, setSessionType] = useState('1-on-1');
  const [maxStudents, setMaxStudents] = useState('5');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = course.trim() && date.trim() && time && !loading;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestSession({
        tutorId: tutor.id,
        tutorName: tutor.name,
        tutorWhatsapp: tutor.whatsappNumber,
        studentId: firebaseUser.uid,
        studentName: userData.name,
        studentWhatsapp: userData.whatsappNumber,
        course: course.trim(),
        date: date.trim(),
        time,
        type: sessionType,
        maxStudents: sessionType === 'group' ? parseInt(maxStudents) || 5 : 1,
        note: note.trim(),
      });
      Alert.alert(
        'Request sent!',
        `${tutor.name} will review your request and get back to you.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initials = tutor.name.split(' ').map((p) => p[0]).join('').slice(0, 2);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View className={`flex-row items-center px-6 pt-4 pb-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#090F43'} />
        </TouchableOpacity>
        <Text className="text-xl font-bold flex-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Request a Session</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-6 pb-10" style={{ gap: 20 }}>

          {/* Tutor card */}
          <View className={`rounded-2xl p-4 flex-row items-center border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#FF313115' }}>
              <Text className="text-accent font-bold text-base">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{tutor.name}</Text>
              <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{tutor.department || tutor.university}</Text>
            </View>
            {tutor.rating > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text className="text-sm font-semibold ml-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{tutor.rating}</Text>
              </View>
            )}
          </View>

          {/* Course */}
          <View>
            <Text className="text-sm mb-1 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Course / Subject *</Text>
            <TextInput
              className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
              style={{ color: isDark ? '#FFFFFF' : '#090F43' }}
              placeholder="e.g. PHY 212, Calculus, Organic Chemistry"
              placeholderTextColor="#9CA3AF"
              value={course}
              onChangeText={setCourse}
              editable={!loading}
            />
          </View>

          {/* Date */}
          <View>
            <Text className="text-sm mb-1 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Preferred Date *</Text>
            <TextInput
              className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
              style={{ color: isDark ? '#FFFFFF' : '#090F43' }}
              placeholder="e.g. Monday 19 May, or this weekend"
              placeholderTextColor="#9CA3AF"
              value={date}
              onChangeText={setDate}
              editable={!loading}
            />
          </View>

          {/* Time */}
          <SearchableSelect
            label="Preferred Time *"
            value={time}
            placeholder="Select a time"
            modalTitle="Select Time"
            searchPlaceholder="Search times..."
            options={TIME_SLOTS}
            onChange={setTime}
            disabled={loading}
            containerClassName=""
          />

          {/* Session Type */}
          <SearchableSelect
            label="Session Type"
            value={sessionType}
            placeholder="Select session type"
            modalTitle="Select Session Type"
            searchPlaceholder="Search..."
            options={SESSION_TYPES}
            onChange={setSessionType}
            disabled={loading}
            containerClassName=""
          />

          {/* Max students — only for group */}
          {sessionType === 'group' && (
            <View>
              <Text className="text-sm mb-1 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Max Students</Text>
              <TextInput
                className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                style={{ color: isDark ? '#FFFFFF' : '#090F43' }}
                placeholder="e.g. 5"
                placeholderTextColor="#9CA3AF"
                value={maxStudents}
                onChangeText={setMaxStudents}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
          )}

          {/* Note */}
          <View>
            <Text className="text-sm mb-1 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Note to tutor (optional)</Text>
            <TextInput
              className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
              style={{ color: isDark ? '#FFFFFF' : '#090F43' }}
              placeholder="What do you need help with? Any specific topics?"
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            className="bg-accent py-4 rounded-2xl"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.4 }}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white text-center text-base font-semibold">Send Request</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
