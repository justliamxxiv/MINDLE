import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { subscribeTutorSessions, SESSION_STATUS } from '../services/sessionService';
import { getUserAvatars } from '../services/userService';
import { openWhatsApp } from '../utils/whatsapp';

const FILTERS = ['All', 'Active', 'Completed'];
const COLORS = ['#FF3131', '#FFB800', '#4CAF50', '#2196F3', '#9C27B0', '#090F43'];

export default function TutorStudentsScreen() {
  const { firebaseUser } = useUser();
  const { isDark } = useTheme();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [avatars, setAvatars] = useState({});

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

  // Sessions only carry a denormalized name/whatsapp for the student, not their
  // avatar (it can change, and it's a large blob we don't want on every session).
  useEffect(() => {
    const studentIds = sessions
      .filter((s) => s.status === SESSION_STATUS.ACCEPTED || s.status === SESSION_STATUS.COMPLETED)
      .map((s) => s.studentId);
    if (studentIds.length === 0) return;
    getUserAvatars(studentIds).then(setAvatars).catch(() => {});
  }, [sessions]);

  // Deduplicate into student records, aggregating their sessions
  const studentMap = {};
  sessions
    .filter((s) => s.status === SESSION_STATUS.ACCEPTED || s.status === SESSION_STATUS.COMPLETED)
    .forEach((s) => {
      if (!studentMap[s.studentId]) {
        studentMap[s.studentId] = {
          studentId: s.studentId,
          studentName: s.studentName,
          sessions: [],
        };
      }
      studentMap[s.studentId].sessions.push(s);
    });

  const students = Object.values(studentMap).map((student) => {
    const lastSession = student.sessions.sort((a, b) => {
      const ta = a.createdAt?.seconds || 0;
      const tb = b.createdAt?.seconds || 0;
      return tb - ta;
    })[0];
    const hasActive = student.sessions.some((s) => s.status === SESSION_STATUS.ACCEPTED);
    return {
      ...student,
      status: hasActive ? 'active' : 'completed',
      lastCourse: lastSession?.course || '',
      sessionCount: student.sessions.length,
      lastDate: lastSession?.date || '',
      whatsapp: lastSession?.studentWhatsapp || '',
    };
  });

  const filtered = students.filter((s) => {
    if (activeFilter === 'All') return true;
    return s.status === activeFilter.toLowerCase();
  });

  const activeCount = students.filter((s) => s.status === 'active').length;
  const totalSessions = sessions.filter(
    (s) => s.status === SESSION_STATUS.ACCEPTED || s.status === SESSION_STATUS.COMPLETED
  ).length;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-3xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>My Students</Text>
          <Text style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
            {activeCount} active · {totalSessions} total sessions
          </Text>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-4" contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: activeFilter === filter ? '#FF3131' : (isDark ? '#2A2A2A' : '#F3F4F6') }}
            >
              <Text className="font-semibold text-sm" style={{ color: activeFilter === filter ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#374151') }}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-6" style={{ gap: 12, paddingBottom: 32 }}>
          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color="#FF3131" />
              <Text className="mt-3" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Loading students...</Text>
            </View>
          ) : filtered.length > 0 ? (
            filtered.map((student, index) => {
              const color = COLORS[index % COLORS.length];
              const initials = student.studentName?.split(' ').map((p) => p[0]).join('').slice(0, 2) || '?';
              return (
                <View key={student.studentId} className={`rounded-2xl p-4 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                  <View className="flex-row items-center">
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
                      {avatars[student.studentId] ? (
                        <Image source={{ uri: avatars[student.studentId] }} style={{ width: 48, height: 48 }} />
                      ) : (
                        <Text style={{ color, fontWeight: '700', fontSize: 15 }}>{initials}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{student.studentName}</Text>
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: student.status === 'active' ? '#4CAF5020' : (isDark ? '#2A2A2A' : '#F3F4F6') }}>
                          <Text className="text-xs font-semibold" style={{ color: student.status === 'active' ? '#4CAF50' : '#9CA3AF' }}>
                            {student.status === 'active' ? 'Active' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-sm mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{student.lastCourse}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? '#1F2937' : '#F3F4F6' }}>
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                      <Text className="text-xs ml-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                        {student.sessionCount} session{student.sessionCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    {student.lastDate ? (
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                        <Text className="text-xs ml-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{student.lastDate}</Text>
                      </View>
                    ) : null}
                  </View>

                  {student.whatsapp ? (
                    <TouchableOpacity
                      className="flex-row items-center justify-center py-2.5 rounded-xl mt-3"
                      style={{ backgroundColor: '#25D36618' }}
                      onPress={() => openWhatsApp(student.whatsapp)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#128C7E" />
                      <Text className="text-sm font-semibold ml-2" style={{ color: '#128C7E' }}>Message on WhatsApp</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          ) : (
            <View className={`rounded-2xl p-10 items-center mt-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
              <Ionicons name="people-outline" size={48} color="#CCCCCC" />
              <Text className="text-center mt-3 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>No students yet</Text>
              <Text className="text-xs text-center mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                Make sure your profile is complete and you're marked as available
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
