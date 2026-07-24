import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Switch, Alert, ActivityIndicator, Modal, Platform, ActionSheetIOS } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import {
  subscribeTutorSessions, updateSessionStatus, tutorConfirmSession, cancelSession, SESSION_STATUS,
} from '../services/sessionService';
import { openWhatsApp } from '../utils/whatsapp';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TutorHomeScreen({ navigation }) {
  const { userData, firebaseUser, refreshUserData } = useUser();
  const { isDark } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAvailable, setIsAvailable] = useState(userData?.isAvailable ?? true);
  const [activeDays, setActiveDays] = useState(userData?.activeDays ?? ['Mon', 'Wed', 'Fri']);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreModal, setScoreModal] = useState({ visible: false, sessionId: null });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeTutorSessions(
      firebaseUser.uid,
      (data) => {
        setSessions(data);
        setLoading(false);
      },
      (error) => {
        console.error('Sessions listener error:', error);
        setLoading(false);
      },
    );
    return unsub;
  }, [firebaseUser?.uid]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userData?.name?.split(' ')[0] || 'Tutor';

  const saveAvailability = async (available, days) => {
    if (!firebaseUser?.uid) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), { isAvailable: available, activeDays: days });
      await refreshUserData();
    } catch {
      Alert.alert('Error', 'Could not save availability. Please try again.');
    }
  };

  const toggleAvailable = (value) => {
    setIsAvailable(value);
    saveAvailability(value, activeDays);
  };

  const toggleDay = (day) => {
    const updated = activeDays.includes(day)
      ? activeDays.filter((d) => d !== day)
      : [...activeDays, day];
    setActiveDays(updated);
    saveAvailability(isAvailable, updated);
  };

  const handleAccept = async (sessionId) => {
    try {
      await updateSessionStatus(sessionId, SESSION_STATUS.ACCEPTED);
    } catch {
      Alert.alert('Error', 'Could not accept session. Please try again.');
    }
  };

  const handleDecline = (sessionId) => {
    Alert.alert('Decline request', 'Are you sure you want to decline this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          try {
            await updateSessionStatus(sessionId, SESSION_STATUS.DECLINED);
          } catch {
            Alert.alert('Error', 'Could not decline session. Please try again.');
          }
        },
      },
    ]);
  };

  const handleCancelSession = (session) => {
    Alert.alert(
      'Cancel session',
      `Cancel your session with ${session.studentName}? They will see it was cancelled.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Yes, cancel', style: 'destructive',
          onPress: async () => {
            try {
              await cancelSession(session.id, 'tutor');
            } catch {
              Alert.alert('Error', 'Could not cancel session. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleMarkDone = (sessionId) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Score this student (optional)',
          message: 'Rate their performance — they\'ll see their average score on their home screen.',
          options: ['Cancel', '⭐ 1 — Needs improvement', '⭐⭐ 2 — Below average', '⭐⭐⭐ 3 — Average', '⭐⭐⭐⭐ 4 — Good', '⭐⭐⭐⭐⭐ 5 — Excellent', 'Skip score'],
          cancelButtonIndex: 0,
        },
        async (index) => {
          if (index === 0) return;
          const score = index <= 5 ? index : null;
          try {
            await tutorConfirmSession(sessionId, score);
          } catch {
            Alert.alert('Error', 'Could not update session. Please try again.');
          }
        },
      );
    } else {
      setScoreModal({ visible: true, sessionId });
    }
  };

  const handleScoreSubmit = async (score) => {
    const { sessionId } = scoreModal;
    setScoreModal({ visible: false, sessionId: null });
    try {
      await tutorConfirmSession(sessionId, score);
    } catch {
      Alert.alert('Error', 'Could not update session. Please try again.');
    }
  };

  const pending = sessions.filter((s) => s.status === SESSION_STATUS.PENDING);
  const upcoming = sessions.filter((s) => s.status === SESSION_STATUS.ACCEPTED);
  const awaitingStudent = sessions.filter((s) => s.status === SESSION_STATUS.TUTOR_CONFIRMED);
  const uniqueStudents = [...new Set(sessions.filter((s) => s.status === SESSION_STATUS.ACCEPTED).map((s) => s.studentId))].length;

  const ratedSessions = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED && s.tutorRating != null);
  const avgRating = ratedSessions.length > 0
    ? (ratedSessions.reduce((sum, s) => sum + s.tutorRating, 0) / ratedSessions.length).toFixed(1)
    : '—';

  const stats = [
    { label: 'Students', value: uniqueStudents, icon: 'people-outline', color: '#FF3131' },
    { label: 'Rating', value: avgRating === '—' ? '—' : `${avgRating}/5`, icon: 'star-outline', color: '#FFB800' },
    { label: 'Sessions', value: upcoming.length, icon: 'calendar-outline', color: '#4CAF50' },
  ];

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{getGreeting()}</Text>
              <Text className="text-4xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{firstName}</Text>
              <Text className="text-sm mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{userData?.university || ''}</Text>
            </View>
            <TouchableOpacity className={`p-3 rounded-full ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={24} color={isDark ? '#FFFFFF' : '#090F43'} />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View className="flex-row" style={{ gap: 10 }}>
            {stats.map((stat) => (
              <View key={stat.label} className={`flex-1 rounded-2xl p-4 border items-center ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
                <Text className="text-2xl font-bold mt-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{stat.value}</Text>
                <Text className="text-xs mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Availability Toggle */}
        <View className="px-6 mb-6">
          <View className={`rounded-2xl p-5 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Available for sessions</Text>
                <Text className="text-xs mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                  {isAvailable ? 'Students can request sessions from you' : 'You are currently unavailable'}
                </Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={toggleAvailable}
                trackColor={{ false: '#E5E7EB', true: '#FF3131' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text className="text-xs mb-2 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>AVAILABLE DAYS</Text>
            <View className="flex-row justify-between">
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={{
                    width: 38, height: 38, borderRadius: 19,
                    backgroundColor: activeDays.includes(day) ? '#FF3131' : (isDark ? '#1A2065' : '#F3F4F6'),
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: activeDays.includes(day) ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Pending Requests */}
        {loading ? (
          <View className="px-6 py-8 items-center">
            <ActivityIndicator color="#FF3131" />
          </View>
        ) : (
          <>
            {pending.length > 0 && (
              <View className="px-6 mb-6">
                <View className="flex-row items-center mb-4">
                  <Text className="text-2xl font-bold flex-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>New Requests</Text>
                  <View className="bg-accent px-2.5 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">{pending.length}</Text>
                  </View>
                </View>
                <View style={{ gap: 10 }}>
                  {pending.map((session) => (
                    <View key={session.id} className={`rounded-2xl p-4 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                      <View className="flex-row items-start mb-3">
                        <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                          <Text className="font-bold text-sm" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                            {session.studentName?.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{session.studentName}</Text>
                          <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{session.course} · {session.type}</Text>
                          <Text className="text-xs mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{session.date} at {session.time}</Text>
                        </View>
                      </View>
                      {session.note ? (
                        <View className={`rounded-xl p-3 mb-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                          <Text className="text-sm italic" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>"{session.note}"</Text>
                        </View>
                      ) : null}
                      <View className="flex-row" style={{ gap: 10 }}>
                        <TouchableOpacity
                          className={`flex-1 py-2.5 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                          onPress={() => handleDecline(session.id)}
                          activeOpacity={0.8}
                        >
                          <Text className="text-center text-sm font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 bg-accent py-2.5 rounded-xl"
                          onPress={() => handleAccept(session.id)}
                          activeOpacity={0.8}
                        >
                          <Text className="text-white text-center text-sm font-semibold">Accept</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Awaiting student confirmation */}
            {awaitingStudent.length > 0 && (
              <View className="px-6 mb-6">
                <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Awaiting Student Confirmation</Text>
                <View style={{ gap: 10 }}>
                  {awaitingStudent.map((session) => (
                    <View key={session.id} className={`rounded-2xl p-4 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                      <View className="flex-row items-center">
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFB80018', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Ionicons name="time" size={22} color="#FFB800" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{session.studentName}</Text>
                          <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{session.course} · {session.date}</Text>
                          <View className="self-start px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: isDark ? '#FFB80030' : '#FEF9C3' }}>
                            <Text className="text-xs font-semibold" style={{ color: isDark ? '#FDE68A' : '#A16207' }}>Waiting for student</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Upcoming Sessions */}
            <View className="px-6 mb-8">
              <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Upcoming Sessions</Text>
              {upcoming.length > 0 ? (
                <View style={{ gap: 10 }}>
                  {upcoming.map((session) => (
                    <View key={session.id} className={`rounded-2xl p-4 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                      <View className="flex-row items-center mb-3">
                        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#FF313118', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                          <Ionicons name="person" size={22} color="#FF3131" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{session.studentName}</Text>
                          <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{session.course} · {session.date} at {session.time}</Text>
                          <View className="self-start px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: isDark ? '#4CAF5030' : '#DCFCE7' }}>
                            <Text className="text-xs font-semibold" style={{ color: isDark ? '#86EFAC' : '#15803D' }}>Confirmed</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex-row" style={{ gap: 10 }}>
                        {session.studentWhatsapp ? (
                          <TouchableOpacity
                            className="flex-1 py-2.5 rounded-xl flex-row items-center justify-center"
                            style={{ backgroundColor: '#25D36618' }}
                            onPress={() => openWhatsApp(session.studentWhatsapp)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="logo-whatsapp" size={16} color="#128C7E" />
                            <Text className="text-sm font-semibold ml-2" style={{ color: '#128C7E' }}>Message</Text>
                          </TouchableOpacity>
                        ) : null}
                        <TouchableOpacity
                          className={`flex-1 py-2.5 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                          onPress={() => handleMarkDone(session.id)}
                          activeOpacity={0.8}
                        >
                          <Text className="text-center text-sm font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Mark as done</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        className="mt-2 py-1.5"
                        onPress={() => handleCancelSession(session)}
                        activeOpacity={0.7}
                      >
                        <Text className="text-center text-xs font-semibold" style={{ color: '#FF3131' }}>Cancel session</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View className={`p-8 rounded-2xl items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                  <Ionicons name="calendar-outline" size={48} color="#CCCCCC" />
                  <Text className="text-center mt-3" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>No upcoming sessions</Text>
                  <Text className="text-xs text-center mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                    Make sure you're marked as available so students can find you
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* Android score picker modal */}
      <Modal visible={scoreModal.visible} transparent animationType="slide" onRequestClose={() => setScoreModal({ visible: false, sessionId: null })}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className={`rounded-t-3xl px-6 pt-5 pb-10 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
            <Text className="text-2xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Score this student</Text>
            <Text className="mb-5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Rate their performance for this session.</Text>
            <View style={{ gap: 10 }}>
              {[5, 4, 3, 2, 1].map((score) => (
                <TouchableOpacity
                  key={score}
                  className={`rounded-2xl py-3 px-4 flex-row items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                  onPress={() => handleScoreSubmit(score)}
                  activeOpacity={0.85}
                >
                  <Text className="text-lg mr-3">{'⭐'.repeat(score)}</Text>
                  <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{score} — {['', 'Needs improvement', 'Below average', 'Average', 'Good', 'Excellent'][score]}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className={`rounded-2xl py-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                onPress={() => handleScoreSubmit(null)}
                activeOpacity={0.85}
              >
                <Text className="text-center font-semibold" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Skip score</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
