import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { subscribeTutorSessions, completeSession, SESSION_STATUS } from '../services/sessionService';

const FILTERS = ['All', 'Active', 'Completed'];
const COLORS = ['#FF3131', '#FFB800', '#4CAF50', '#2196F3', '#9C27B0', '#090F43'];

export default function TutorStudentsScreen() {
  const { firebaseUser } = useUser();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeTutorSessions(firebaseUser.uid, (data) => {
      setSessions(data);
      setLoading(false);
    });
    return unsub;
  }, [firebaseUser?.uid]);

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
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-3xl font-bold text-primary mb-1">My Students</Text>
          <Text className="text-textSecondary">
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
              style={{ backgroundColor: activeFilter === filter ? '#FF3131' : '#F3F4F6' }}
            >
              <Text className="font-semibold text-sm" style={{ color: activeFilter === filter ? '#FFFFFF' : '#374151' }}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-6" style={{ gap: 12, paddingBottom: 32 }}>
          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator color="#FF3131" />
              <Text className="text-textSecondary mt-3">Loading students...</Text>
            </View>
          ) : filtered.length > 0 ? (
            filtered.map((student, index) => {
              const color = COLORS[index % COLORS.length];
              const initials = student.studentName?.split(' ').map((p) => p[0]).join('').slice(0, 2) || '?';
              return (
                <View key={student.studentId} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <View className="flex-row items-center">
                    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: color + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color, fontWeight: '700', fontSize: 15 }}>{initials}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-bold text-primary">{student.studentName}</Text>
                        <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: student.status === 'active' ? '#4CAF5020' : '#F3F4F6' }}>
                          <Text className="text-xs font-semibold" style={{ color: student.status === 'active' ? '#4CAF50' : '#9CA3AF' }}>
                            {student.status === 'active' ? 'Active' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-textSecondary text-sm mt-0.5">{student.lastCourse}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                      <Text className="text-textSecondary text-xs ml-1">
                        {student.sessionCount} session{student.sessionCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    {student.lastDate ? (
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                        <Text className="text-textSecondary text-xs ml-1">{student.lastDate}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-cardLight rounded-2xl p-10 items-center mt-4">
              <Ionicons name="people-outline" size={48} color="#CCCCCC" />
              <Text className="text-textSecondary text-center mt-3 font-medium">No students yet</Text>
              <Text className="text-textSecondary text-xs text-center mt-1">
                Make sure your profile is complete and you're marked as available
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
