import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Alert, Modal, Platform, ActionSheetIOS, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import {
  subscribeStudentSessions, studentConfirmSession, cancelSession, dismissSession, SESSION_STATUS,
} from '../services/sessionService';
import { subscribeGroups } from '../services/groupService';
import { openWhatsApp } from '../utils/whatsapp';
import { computeTutorProgress } from '../utils/tutorProgress';

const { width } = Dimensions.get('window');

const SESSION_COLORS = ['#FF3131', '#FFB800', '#4CAF50', '#2196F3', '#9C27B0', '#090F43'];

export default function HomeScreen({ navigation }) {
  const { userData, firebaseUser } = useUser();
  const { isDark } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [ratingModal, setRatingModal] = useState({ visible: false, sessionId: null, tutorId: null, tutorName: '' });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
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

  useEffect(() => {
    const unsub = subscribeGroups(
      (data) => setGroups(data),
      (error) => console.error('Groups listener error:', error),
    );
    return unsub;
  }, []);

  // Surface groups relevant to the student: prefer their campus/department,
  // fall back to any groups so the section is never empty when groups exist.
  const relevantGroups = (() => {
    const mine = groups.filter(
      (g) => g.university === userData?.university || g.department === userData?.department
    );
    return (mine.length > 0 ? mine : groups).slice(0, 3);
  })();

  const openGroupLink = (group) => {
    if (!group.whatsappLink) return;
    Linking.openURL(group.whatsappLink).catch(() =>
      Alert.alert('Error', 'Could not open WhatsApp link.')
    );
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const upcomingSessions = sessions.filter((s) => s.status === SESSION_STATUS.ACCEPTED);
  const needsConfirmation = sessions.filter((s) => s.status === SESSION_STATUS.TUTOR_CONFIRMED);
  const pendingRequests = sessions.filter((s) => s.status === SESSION_STATUS.PENDING);
  const closedRequests = sessions.filter(
    (s) => (s.status === SESSION_STATUS.DECLINED || s.status === SESSION_STATUS.CANCELLED) && !s.studentDismissed
  );

  const handleConfirmSession = (session) => {
    Alert.alert(
      'Confirm session',
      `Did your session with ${session.tutorName} take place?`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, rate & confirm',
          onPress: () => {
            if (Platform.OS === 'ios') {
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  title: `Rate ${session.tutorName}`,
                  message: 'How would you rate this session?',
                  options: ['Cancel', '1 — Poor', '2 — Fair', '3 — Good', '4 — Great', '5 — Excellent', 'Skip rating'],
                  cancelButtonIndex: 0,
                },
                async (index) => {
                  if (index === 0) return;
                  const rating = index <= 5 ? index : null;
                  try {
                    await studentConfirmSession(session.id, session.tutorId, rating);
                  } catch {
                    Alert.alert('Error', 'Could not confirm session. Please try again.');
                  }
                },
              );
            } else {
              setRatingModal({ visible: true, sessionId: session.id, tutorId: session.tutorId, tutorName: session.tutorName });
            }
          },
        },
      ]
    );
  };

  const handleRatingSubmit = async (rating) => {
    const { sessionId, tutorId } = ratingModal;
    setRatingModal({ visible: false, sessionId: null, tutorId: null, tutorName: '' });
    try {
      await studentConfirmSession(sessionId, tutorId, rating);
    } catch {
      Alert.alert('Error', 'Could not confirm session. Please try again.');
    }
  };

  const handleCancelSession = (session) => {
    const isPending = session.status === SESSION_STATUS.PENDING;
    Alert.alert(
      isPending ? 'Cancel request' : 'Cancel session',
      isPending
        ? `Cancel your session request to ${session.tutorName}?`
        : `Cancel your session with ${session.tutorName}? They will see it was cancelled.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Yes, cancel', style: 'destructive',
          onPress: async () => {
            try {
              await cancelSession(session.id, 'student');
            } catch {
              Alert.alert('Error', 'Could not cancel. Please try again.');
            }
          },
        },
      ]
    );
  };

  // "Your Progress" = every tutor you've had confirmed sessions with, active or completed
  const tutorProgress = computeTutorProgress(sessions).map((t, i) => ({
    id: t.tutorId,
    course: t.course,
    tutor: t.tutorName,
    sessions: t.count,
    hasActive: t.hasActive,
    color: SESSION_COLORS[i % SESSION_COLORS.length],
  }));

  const firstName = userData?.name?.split(' ')[0] || 'Student!';

  // Streak: count consecutive days (ending today) with at least one COMPLETED session
  const completedSessions = sessions.filter((s) => s.status === SESSION_STATUS.COMPLETED);
  const streak = (() => {
    if (completedSessions.length === 0) return 0;
    const dayStrings = new Set(
      completedSessions.map((s) => {
        // Prefer completedAt (when the session actually happened); older docs only have createdAt
        const raw = s.completedAt || s.createdAt;
        const ts = raw?.toDate ? raw.toDate() : new Date(raw);
        return ts.toDateString();
      })
    );
    let count = 0;
    const cursor = new Date();
    while (dayStrings.has(cursor.toDateString())) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  })();

  // Avg score: mean of scores tutors gave on completed sessions
  const scoredSessions = completedSessions.filter((s) => s.score != null);
  const avgScore = scoredSessions.length > 0
    ? (scoredSessions.reduce((sum, s) => sum + s.score, 0) / scoredSessions.length).toFixed(1)
    : '—';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row justify-between items-start mb-6">
            <View className="flex-1">
              <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                {getGreeting()}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-4xl font-bold mr-2" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                  {firstName}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className={`p-3 rounded-full ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-outline" size={24} color={isDark ? '#FFFFFF' : '#090F43'} />
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View className="flex-row mb-6" style={{ gap: 12 }}>
            <View className="flex-1 bg-accent p-4 rounded-2xl">
              <Ionicons name="flame" size={28} color="#FFFFFF" />
              <Text className="text-white text-3xl font-bold mt-2">{streak}</Text>
              <Text className="text-white text-sm opacity-90">Day Streak</Text>
            </View>

            <View className={`flex-1 p-4 rounded-2xl ${isDark ? 'bg-cardDark' : 'bg-primary'}`}>
              <Ionicons name="trending-up" size={28} color="#FFFFFF" />
              <Text className="text-white text-3xl font-bold mt-2">{avgScore}</Text>
              <Text className="text-white text-sm opacity-90">Avg Score</Text>
            </View>
          </View>
        </View>

        {/* Tutor Progress Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Your Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StudentTabs', { screen: 'Tutors' })}>
              <Text className="text-accent font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {tutorProgress.length > 0 ? (
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

                  <View className="flex-row items-center">
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
                </View>
              ))}
            </View>
          ) : (
            <View className={`p-8 rounded-2xl items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
              <Ionicons name="school-outline" size={48} color="#CCCCCC" />
              <Text className="text-center mt-3" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                Start learning with a tutor to track your progress
              </Text>
            </View>
          )}
        </View>

        {/* Needs confirmation */}
        {needsConfirmation.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Confirm Your Sessions</Text>
            <View style={{ gap: 10 }}>
              {needsConfirmation.map((session) => (
                <View key={session.id} className={`rounded-2xl p-4 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                  <View className="flex-row items-center mb-3">
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFB80018', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="checkmark-circle-outline" size={24} color="#FFB800" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{session.course}</Text>
                      <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>with {session.tutorName} · {session.date}</Text>
                      <Text className="text-xs mt-0.5" style={{ color: isDark ? '#FBBF24' : '#CA8A04' }}>Tutor marked this as done</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-accent py-2.5 rounded-xl"
                    onPress={() => handleConfirmSession(session)}
                    activeOpacity={0.85}
                  >
                    <Text className="text-white text-center text-sm font-semibold">Confirm session</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Your Requests — pending, declined, and cancelled session requests */}
        {(pendingRequests.length > 0 || closedRequests.length > 0) && (
          <View className="px-6 mb-6">
            <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Your Requests</Text>
            <View style={{ gap: 10 }}>
              {pendingRequests.map((session) => (
                <View key={session.id} className={`rounded-2xl p-4 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                  <View className="flex-row items-center mb-3">
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#2196F318', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="hourglass-outline" size={22} color="#2196F3" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{session.course}</Text>
                      <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>to {session.tutorName} · {session.date} at {session.time}</Text>
                      <View className="self-start px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: isDark ? '#2196F330' : '#DBEAFE' }}>
                        <Text className="text-xs font-semibold" style={{ color: isDark ? '#93C5FD' : '#1D4ED8' }}>Waiting for tutor</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    className={`py-2.5 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                    onPress={() => handleCancelSession(session)}
                    activeOpacity={0.85}
                  >
                    <Text className="text-center text-sm font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Cancel request</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {closedRequests.map((session) => {
                const label = session.status === SESSION_STATUS.DECLINED
                  ? 'Declined by tutor'
                  : session.cancelledBy === 'tutor' ? 'Cancelled by tutor' : 'Cancelled';
                return (
                  <View key={session.id} className={`rounded-2xl p-4 border flex-row items-center ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#9CA3AF18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="close-circle-outline" size={22} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{session.course}</Text>
                      <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>with {session.tutorName}</Text>
                      <View className="self-start px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}>
                        <Text className="text-xs font-semibold" style={{ color: isDark ? '#D1D5DB' : '#6B7280' }}>{label}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                      onPress={() => dismissSession(session.id).catch(() => {})}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color={isDark ? '#9CA3AF' : '#666666'} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Upcoming Sessions */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Today's Sessions</Text>
          </View>

          {upcomingSessions.length > 0 ? (
            <View style={{ gap: 12 }}>
              {upcomingSessions.map((session, i) => (
                <View
                  key={session.id}
                  className={`rounded-2xl p-4 shadow-sm border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}
                >
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: SESSION_COLORS[i % SESSION_COLORS.length] + '20' }}
                    >
                      <Ionicons name="time" size={24} color={SESSION_COLORS[i % SESSION_COLORS.length]} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{session.course}</Text>
                      <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                        {session.time} · {session.date} · {session.tutorName}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row" style={{ gap: 10 }}>
                    {session.tutorWhatsapp ? (
                      <TouchableOpacity
                        className="flex-1 py-2.5 rounded-xl flex-row items-center justify-center"
                        style={{ backgroundColor: '#25D36618' }}
                        onPress={() => openWhatsApp(session.tutorWhatsapp)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="logo-whatsapp" size={16} color="#128C7E" />
                        <Text className="text-sm font-semibold ml-2" style={{ color: '#128C7E' }}>Message tutor</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      className={`flex-1 py-2.5 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                      onPress={() => handleCancelSession(session)}
                      activeOpacity={0.85}
                    >
                      <Text className="text-center text-sm font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className={`p-6 rounded-2xl items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
              <Text className="text-center" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>No upcoming sessions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentTabs', { screen: 'Tutors' })} className="mt-2">
                <Text className="text-accent font-semibold text-sm">Find a tutor →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Study Groups Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Study Groups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StudentTabs', { screen: 'Groups' })}>
              <Text className="text-accent font-semibold">Explore</Text>
            </TouchableOpacity>
          </View>

          {relevantGroups.length > 0 ? (
            <View style={{ gap: 10 }}>
              {relevantGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  className={`rounded-2xl p-4 flex-row items-center border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}
                  onPress={() => openGroupLink(group)}
                  activeOpacity={0.85}
                >
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#25D36618', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }} numberOfLines={1}>{group.name}</Text>
                    <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }} numberOfLines={1}>
                      {group.course}{group.university ? ` · ${group.university}` : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View
              className={`rounded-3xl p-6 items-center ${isDark ? '' : 'bg-primary'}`}
              style={isDark ? { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' } : undefined}
            >
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="rounded-2xl p-3 mb-3">
                <Ionicons name="people" size={28} color="#FFFFFF" />
              </View>
              <Text className="text-white text-lg font-bold mb-2">
                Find Your Study Crew
              </Text>
              <Text className="text-white text-center text-sm opacity-90 mb-4">
                Join groups in your courses and study smarter together
              </Text>
              <TouchableOpacity
                className="bg-white px-6 py-3 rounded-xl"
                onPress={() => navigation.navigate('StudentTabs', { screen: 'Groups' })}
                activeOpacity={0.8}
              >
                <Text className="text-accent font-bold">Browse Groups</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View className="px-6 pb-8">
          <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Quick Stats</Text>
          <View className={`rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
            <View className="flex-row justify-between items-center mb-4">
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{tutorProgress.length}</Text>
                <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Tutors</Text>
              </View>
              <View className={`w-px h-10 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{upcomingSessions.length}</Text>
                <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Upcoming</Text>
              </View>
              <View className={`w-px h-10 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{completedSessions.length}</Text>
                <Text className="text-xs mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Completed</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Android tutor rating modal */}
      <Modal visible={ratingModal.visible} transparent animationType="slide" onRequestClose={() => setRatingModal({ visible: false, sessionId: null, tutorId: null, tutorName: '' })}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className={`rounded-t-3xl px-6 pt-5 pb-10 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
            <Text className="text-2xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Rate {ratingModal.tutorName}</Text>
            <Text className="mb-5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>How would you rate this session?</Text>
            <View style={{ gap: 10 }}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  className={`rounded-2xl py-3 px-4 flex-row items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                  onPress={() => handleRatingSubmit(rating)}
                  activeOpacity={0.85}
                >
                  <View className="flex-row mr-3">
                    {[...Array(rating)].map((_, i) => (
                      <Ionicons key={i} name="star" size={16} color="#FFB800" />
                    ))}
                  </View>
                  <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{rating} — {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className={`rounded-2xl py-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                onPress={() => handleRatingSubmit(null)}
                activeOpacity={0.85}
              >
                <Text className="text-center font-semibold" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Skip rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}