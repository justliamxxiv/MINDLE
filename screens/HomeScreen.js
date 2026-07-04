import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Alert, Modal, Platform, ActionSheetIOS } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../context/UserContext';
import {
  subscribeStudentSessions, studentConfirmSession, cancelSession, dismissSession, SESSION_STATUS,
} from '../services/sessionService';
import { openWhatsApp } from '../utils/whatsapp';

const { width } = Dimensions.get('window');

const SESSION_COLORS = ['#FF3131', '#FFB800', '#4CAF50', '#2196F3', '#9C27B0', '#090F43'];

export default function HomeScreen({ navigation }) {
  const { userData, firebaseUser } = useUser();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessions, setSessions] = useState([]);
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
                  options: ['Cancel', '⭐ 1 — Poor', '⭐⭐ 2 — Fair', '⭐⭐⭐ 3 — Good', '⭐⭐⭐⭐ 4 — Great', '⭐⭐⭐⭐⭐ 5 — Excellent', 'Skip rating'],
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

  // "Your Progress" = tutors you currently have active sessions with (not yet completed)
  const activeSessionTutorMap = {};
  sessions
    .filter((s) => [SESSION_STATUS.ACCEPTED, SESSION_STATUS.TUTOR_CONFIRMED].includes(s.status))
    .forEach((s) => {
      if (!activeSessionTutorMap[s.tutorId]) {
        activeSessionTutorMap[s.tutorId] = { tutorName: s.tutorName, course: s.course, count: 0 };
      }
      activeSessionTutorMap[s.tutorId].count += 1;
    });
  const tutorProgress = Object.entries(activeSessionTutorMap).map(([id, t], i) => ({
    id,
    course: t.course,
    tutor: t.tutorName,
    sessions: t.count,
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
              <Text className="text-white text-3xl font-bold mt-2">{streak}</Text>
              <Text className="text-white text-sm opacity-90">Day Streak</Text>
            </View>

            <View className="flex-1 bg-primary p-4 rounded-2xl">
              <Ionicons name="trending-up" size={28} color="#FFFFFF" />
              <Text className="text-white text-3xl font-bold mt-2">{avgScore}</Text>
              <Text className="text-white text-sm opacity-90">Avg Score</Text>
            </View>
          </View>
        </View>

        {/* Tutor Progress Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">Your Progress</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StudentTabs', { screen: 'Tutors' })}>
              <Text className="text-accent font-semibold">View All</Text>
            </TouchableOpacity>
          </View>

          {tutorProgress.length > 0 ? (
            <View style={{ gap: 12 }}>
              {tutorProgress.map((item) => (
                <View
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-gray-100"
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

                  <View className="flex-row items-center">
                    <View className="h-2 rounded-full flex-1 bg-gray-100 mr-3">
                      <View className="h-2 rounded-full w-full" style={{ backgroundColor: item.color, opacity: 0.3 }} />
                    </View>
                    <Text className="text-xs font-semibold" style={{ color: item.color }}>In progress</Text>
                  </View>
                </View>
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

        {/* Needs confirmation */}
        {needsConfirmation.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-2xl font-bold text-primary mb-4">Confirm Your Sessions</Text>
            <View style={{ gap: 10 }}>
              {needsConfirmation.map((session) => (
                <View key={session.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <View className="flex-row items-center mb-3">
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFB80018', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="checkmark-circle-outline" size={24} color="#FFB800" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-primary">{session.course}</Text>
                      <Text className="text-textSecondary text-sm">with {session.tutorName} · {session.date}</Text>
                      <Text className="text-yellow-600 text-xs mt-0.5">Tutor marked this as done</Text>
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
            <Text className="text-2xl font-bold text-primary mb-4">Your Requests</Text>
            <View style={{ gap: 10 }}>
              {pendingRequests.map((session) => (
                <View key={session.id} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <View className="flex-row items-center mb-3">
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#2196F318', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="hourglass-outline" size={22} color="#2196F3" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-primary">{session.course}</Text>
                      <Text className="text-textSecondary text-sm">to {session.tutorName} · {session.date} at {session.time}</Text>
                      <View className="bg-blue-100 self-start px-2 py-0.5 rounded-full mt-1">
                        <Text className="text-blue-700 text-xs font-semibold">Waiting for tutor</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-cardLight py-2.5 rounded-xl"
                    onPress={() => handleCancelSession(session)}
                    activeOpacity={0.85}
                  >
                    <Text className="text-primary text-center text-sm font-semibold">Cancel request</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {closedRequests.map((session) => {
                const label = session.status === SESSION_STATUS.DECLINED
                  ? 'Declined by tutor'
                  : session.cancelledBy === 'tutor' ? 'Cancelled by tutor' : 'Cancelled';
                return (
                  <View key={session.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex-row items-center">
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#9CA3AF18', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="close-circle-outline" size={22} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-primary">{session.course}</Text>
                      <Text className="text-textSecondary text-sm">with {session.tutorName}</Text>
                      <View className="bg-gray-100 self-start px-2 py-0.5 rounded-full mt-1">
                        <Text className="text-gray-500 text-xs font-semibold">{label}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="w-8 h-8 rounded-full bg-cardLight items-center justify-center"
                      onPress={() => dismissSession(session.id).catch(() => {})}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color="#666666" />
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
            <Text className="text-2xl font-bold text-primary">Today's Sessions</Text>
          </View>

          {upcomingSessions.length > 0 ? (
            <View style={{ gap: 12 }}>
              {upcomingSessions.map((session, i) => (
                <View
                  key={session.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                >
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: SESSION_COLORS[i % SESSION_COLORS.length] + '20' }}
                    >
                      <Ionicons name="time" size={24} color={SESSION_COLORS[i % SESSION_COLORS.length]} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-primary mb-1">{session.course}</Text>
                      <Text className="text-textSecondary text-sm">
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
                      className="flex-1 bg-cardLight py-2.5 rounded-xl"
                      onPress={() => handleCancelSession(session)}
                      activeOpacity={0.85}
                    >
                      <Text className="text-primary text-center text-sm font-semibold">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-cardLight p-6 rounded-2xl items-center">
              <Text className="text-textSecondary text-center">No upcoming sessions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentTabs', { screen: 'Tutors' })} className="mt-2">
                <Text className="text-accent font-semibold text-sm">Find a tutor →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Study Groups Section */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">Study Groups</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StudentTabs', { screen: 'Groups' })}>
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
              onPress={() => navigation.navigate('StudentTabs', { screen: 'Groups' })}
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
                <Text className="text-2xl font-bold text-primary">{Object.keys(activeSessionTutorMap).length}</Text>
                <Text className="text-textSecondary text-xs mt-1">Tutors</Text>
              </View>
              <View className="w-px h-10 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">{upcomingSessions.length}</Text>
                <Text className="text-textSecondary text-xs mt-1">Upcoming</Text>
              </View>
              <View className="w-px h-10 bg-gray-200" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-bold text-primary">{completedSessions.length}</Text>
                <Text className="text-textSecondary text-xs mt-1">Completed</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Android tutor rating modal */}
      <Modal visible={ratingModal.visible} transparent animationType="slide" onRequestClose={() => setRatingModal({ visible: false, sessionId: null, tutorId: null, tutorName: '' })}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl px-6 pt-5 pb-10">
            <Text className="text-2xl font-bold text-primary mb-1">Rate {ratingModal.tutorName}</Text>
            <Text className="text-textSecondary mb-5">How would you rate this session?</Text>
            <View style={{ gap: 10 }}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  className="bg-cardLight rounded-2xl py-3 px-4 flex-row items-center"
                  onPress={() => handleRatingSubmit(rating)}
                  activeOpacity={0.85}
                >
                  <Text className="text-lg mr-3">{'⭐'.repeat(rating)}</Text>
                  <Text className="text-primary font-semibold">{rating} — {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="bg-cardLight rounded-2xl py-3"
                onPress={() => handleRatingSubmit(null)}
                activeOpacity={0.85}
              >
                <Text className="text-textSecondary text-center font-semibold">Skip rating</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}