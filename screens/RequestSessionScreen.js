import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, SafeAreaView, Platform, ActionSheetIOS,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { requestSession } from '../services/sessionService';

const SESSION_TYPES = [
  { label: '1-on-1 (Private)', value: '1-on-1' },
  { label: 'Group Session', value: 'group' },
];

const TIME_SLOTS = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
];

export default function RequestSessionScreen({ navigation, route }) {
  const { tutor } = route.params;
  const { userData, firebaseUser } = useUser();

  const [course, setCourse] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [sessionType, setSessionType] = useState('1-on-1');
  const [maxStudents, setMaxStudents] = useState('5');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = course.trim() && date.trim() && time && !loading;

  const pickTime = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...TIME_SLOTS], cancelButtonIndex: 0 },
        (index) => { if (index > 0) setTime(TIME_SLOTS[index - 1]); }
      );
    } else {
      Alert.alert('Pick a time', '', [
        ...TIME_SLOTS.map((t) => ({ text: t, onPress: () => setTime(t) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const pickType = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...SESSION_TYPES.map((t) => t.label)], cancelButtonIndex: 0 },
        (index) => { if (index > 0) setSessionType(SESSION_TYPES[index - 1].value); }
      );
    } else {
      Alert.alert('Session type', '', [
        ...SESSION_TYPES.map((t) => ({ text: t.label, onPress: () => setSessionType(t.value) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await requestSession({
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentId: firebaseUser.uid,
        studentName: userData.name,
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

  const typeLabel = SESSION_TYPES.find((t) => t.value === sessionType)?.label || '';
  const initials = tutor.name.split(' ').map((p) => p[0]).join('').slice(0, 2);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="flex-row items-center px-6 pt-4 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#090F43" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-primary flex-1">Request a Session</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-6 pb-10" style={{ gap: 20 }}>

          {/* Tutor card */}
          <View className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-100">
            <View className="w-12 h-12 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: '#FF313115' }}>
              <Text className="text-accent font-bold text-base">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-primary">{tutor.name}</Text>
              <Text className="text-textSecondary text-sm">{tutor.department || tutor.university}</Text>
            </View>
            {tutor.rating > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text className="text-primary text-sm font-semibold ml-1">{tutor.rating}</Text>
              </View>
            )}
          </View>

          {/* Course */}
          <View>
            <Text className="text-textSecondary text-sm mb-1 font-medium">Course / Subject *</Text>
            <TextInput
              className="bg-cardLight px-4 py-3 rounded-2xl text-primary"
              placeholder="e.g. PHY 212, Calculus, Organic Chemistry"
              placeholderTextColor="#9CA3AF"
              value={course}
              onChangeText={setCourse}
              editable={!loading}
            />
          </View>

          {/* Date */}
          <View>
            <Text className="text-textSecondary text-sm mb-1 font-medium">Preferred Date *</Text>
            <TextInput
              className="bg-cardLight px-4 py-3 rounded-2xl text-primary"
              placeholder="e.g. Monday 19 May, or this weekend"
              placeholderTextColor="#9CA3AF"
              value={date}
              onChangeText={setDate}
              editable={!loading}
            />
          </View>

          {/* Time */}
          <View>
            <Text className="text-textSecondary text-sm mb-1 font-medium">Preferred Time *</Text>
            <TouchableOpacity
              className="bg-cardLight px-4 py-3 rounded-2xl flex-row items-center justify-between"
              onPress={pickTime}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className={time ? 'text-primary' : 'text-gray-400'}>{time || 'Select a time'}</Text>
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Session Type */}
          <View>
            <Text className="text-textSecondary text-sm mb-1 font-medium">Session Type</Text>
            <TouchableOpacity
              className="bg-cardLight px-4 py-3 rounded-2xl flex-row items-center justify-between"
              onPress={pickType}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-primary">{typeLabel}</Text>
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Max students — only for group */}
          {sessionType === 'group' && (
            <View>
              <Text className="text-textSecondary text-sm mb-1 font-medium">Max Students</Text>
              <TextInput
                className="bg-cardLight px-4 py-3 rounded-2xl text-primary"
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
            <Text className="text-textSecondary text-sm mb-1 font-medium">Note to tutor (optional)</Text>
            <TextInput
              className="bg-cardLight px-4 py-3 rounded-2xl text-primary"
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
