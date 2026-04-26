import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';

const MOCK_GROUPS = [
  {
    id: '1',
    name: 'CSC 301 Problem Solvers',
    course: 'CSC 301',
    schedule: 'Daily revision drops',
    members: 24,
    platform: 'WhatsApp',
    admin: 'Sarah A.',
    description: 'Past questions, assignment help, voice-note explanations, and exam prep inside one active WhatsApp group.',
    highlight: true,
  },
  {
    id: '2',
    name: '200 Level Chemistry Circle',
    course: 'CHM 201',
    schedule: 'Mon, Wed, Fri updates',
    members: 18,
    platform: 'WhatsApp',
    admin: 'David O.',
    description: 'A focused chemistry group for lab reminders, summaries, and quick revision support.',
  },
  {
    id: '3',
    name: 'Final Year Project Sprint',
    course: 'Project Studio',
    schedule: 'Weekend accountability',
    members: 12,
    platform: 'WhatsApp',
    admin: 'Mariam N.',
    description: 'For project students sharing milestones, asking questions, and keeping each other on track.',
  },
];

const FILTERS = ['All', 'My Campus', 'My Department', 'Exam Prep', 'Active'];

export default function GroupsScreen() {
  const { userData } = useUser();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const firstName = userData?.name?.split(' ')[0] || 'there';
  const department = userData?.department || 'your department';
  const university = userData?.university || 'your campus';

  const recommendedGroups = useMemo(() => MOCK_GROUPS, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-8">
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-1">WhatsApp Study Groups</Text>
            <Text className="text-3xl font-bold text-primary mb-2">
              Find your people, {firstName}
            </Text>
            <Text className="text-textSecondary text-base leading-6">
              Browse active WhatsApp groups around {department}, connect with students on {university}, and study together outside the app.
            </Text>
          </View>

          <View className="bg-cardLight rounded-2xl px-4 py-3 flex-row items-center mb-4">
            <Ionicons name="search-outline" size={20} color="#666666" />
            <TextInput
              placeholder="Search by course code, topic, or campus"
              placeholderTextColor="#666666"
              className="flex-1 ml-3 text-textPrimary"
              editable={false}
            />
            <Ionicons name="options-outline" size={20} color="#090F43" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ paddingRight: 8 }}
          >
            {FILTERS.map((filter) => {
              const active = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  className={`mr-3 px-4 py-2 rounded-full ${active ? 'bg-accent' : 'bg-cardLight'}`}
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

          <View className="bg-primary rounded-3xl p-6 mb-6">
            <View className="flex-row justify-between items-start mb-5">
              <View className="flex-1 pr-4">
                <Text className="text-white text-sm opacity-80 mb-1">How It Works</Text>
                <Text className="text-white text-2xl font-bold mb-2">
                  Join real WhatsApp communities
                </Text>
                <Text className="text-white opacity-90 leading-6">
                  MINDLE helps students discover relevant WhatsApp groups for revision, course updates, accountability, and shared resources.
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="rounded-2xl p-3">
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
              </View>
            </View>

            <View className="flex-row" style={{ gap: 12 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">18</Text>
                <Text className="text-white opacity-80 text-sm mt-1">WhatsApp groups</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">240+</Text>
                <Text className="text-white opacity-80 text-sm mt-1">Students inside</Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">Recommended groups</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text className="text-accent font-semibold">See all</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 14 }} className="mb-6">
            {recommendedGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                className={`rounded-3xl p-5 border ${group.highlight ? 'bg-white border-accent' : 'bg-white border-gray-100'}`}
                activeOpacity={0.86}
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 pr-4">
                    <Text className="text-lg font-bold text-primary mb-1">{group.name}</Text>
                    <Text className="text-textSecondary">{group.description}</Text>
                  </View>
                  <View className={`${group.highlight ? 'bg-accent' : 'bg-cardLight'} px-3 py-2 rounded-full`}>
                    <Text className={`${group.highlight ? 'text-white' : 'text-primary'} text-xs font-semibold`}>
                      {group.course}
                    </Text>
                  </View>
                </View>

                <Text className="text-textSecondary text-sm mb-3">
                  {group.schedule} • {group.members} members
                </Text>

                <View className="flex-row flex-wrap mb-4" style={{ gap: 10 }}>
                  <View className="bg-cardLight rounded-full px-3 py-2 flex-row items-center">
                    <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                    <Text className="text-textSecondary text-xs ml-2">{group.platform}</Text>
                  </View>
                  <View className="bg-cardLight rounded-full px-3 py-2 flex-row items-center">
                    <Ionicons name="shield-checkmark-outline" size={14} color="#666666" />
                    <Text className="text-textSecondary text-xs ml-2">Admin: {group.admin}</Text>
                  </View>
                </View>

                <View>
                  <Text className="text-accent font-semibold mb-3">Invite link available</Text>
                  <TouchableOpacity className="self-start bg-accent rounded-2xl px-4 py-3" activeOpacity={0.85}>
                    <Text className="text-white font-semibold text-sm">Join WhatsApp Group</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View className="bg-cardLight rounded-3xl p-5">
            <View className="flex-row items-center mb-3">
              <View className="bg-white rounded-2xl p-3 mr-3">
                <Ionicons name="add-circle-outline" size={22} color="#FF3131" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-primary">List your WhatsApp group</Text>
                <Text className="text-textSecondary leading-5">
                  Add your existing group so coursemates can discover it and join through MINDLE.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-accent rounded-2xl py-3"
              activeOpacity={0.85}
              onPress={() => setShowAddModal(true)}
            >
              <Text className="text-white text-center text-base font-semibold">
                Add WhatsApp Group
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-background rounded-t-3xl px-6 pt-5 pb-8" style={{ maxHeight: '90%' }}>
            <View className="flex-row items-center justify-between mb-5">
              <View>
                <Text className="text-2xl font-bold text-primary">Add WhatsApp Group</Text>
                <Text className="text-textSecondary mt-1">
                  List an existing group so students can discover it.
                </Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-cardLight items-center justify-center"
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={20} color="#090F43" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FormField label="Group Name" placeholder="e.g. CSC 301 Night Prep" />
              <FormField label="Course Code or Topic" placeholder="e.g. CSC 301" />
              <FormField label="University" placeholder="e.g. University of Lagos" defaultValue={userData?.university} />
              <FormField label="Department" placeholder="e.g. Computer Science" defaultValue={userData?.department} />
              <FormField label="Admin Name" placeholder="e.g. Sarah A." />
              <FormField label="WhatsApp Invite Link" placeholder="Paste group invite link" />
              <FormField label="Short Description" placeholder="What is this group for?" multiline numberOfLines={4} />
              <FormField label="Posting Rhythm" placeholder="e.g. Daily revision drops" />

              <View className="bg-cardLight rounded-2xl p-4 mb-5">
                <Text className="text-primary font-semibold mb-1">What students should see</Text>
                <Text className="text-textSecondary leading-6">
                  Keep it clear and practical: course focus, who the group is for, and what kind of help or updates people can expect inside.
                </Text>
              </View>

              <View className="flex-row" style={{ gap: 12 }}>
                <TouchableOpacity
                  className="flex-1 bg-cardLight rounded-2xl py-3"
                  onPress={() => setShowAddModal(false)}
                  activeOpacity={0.85}
                >
                  <Text className="text-primary text-center font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-accent rounded-2xl py-3" activeOpacity={0.85}>
                  <Text className="text-white text-center font-semibold">Submit Group</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, multiline = false, numberOfLines, defaultValue, placeholder }) {
  return (
    <View className="mb-4">
      <Text className="text-textPrimary mb-2 font-medium">{label}</Text>
      <TextInput
        className="bg-cardLight px-4 py-4 rounded-2xl text-textPrimary"
        placeholder={placeholder}
        placeholderTextColor="#666666"
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        defaultValue={defaultValue}
      />
    </View>
  );
}
