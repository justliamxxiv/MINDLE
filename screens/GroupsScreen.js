import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { subscribeGroups, createGroup, updateGroup, deleteGroup } from '../services/groupService';
import { COURSE_CODE_OPTIONS } from '../utils/academicOptions';
import SearchableSelect from '../components/SearchableSelect';
import DismissKeyboardView from '../components/DismissKeyboardView';

const FILTERS = ['All', 'My Campus', 'My Department', 'My Course'];
const PAGE_SIZE = 5;

export default function GroupsScreen() {
  const { userData, firebaseUser } = useUser();
  const { isDark } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const firstName = userData?.name?.split(' ')[0] || 'there';
  const isTutor = userData?.accountType === 'tutor';

  // Reset paging to the first page whenever the list being shown changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, activeFilter]);

  useEffect(() => {
    const unsub = subscribeGroups(
      (data) => {
        setGroups(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  const filtered = groups.filter((g) => {
    const matchesSearch = search.trim() === '' ||
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.course?.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'My Campus') return g.university === userData?.university;
    if (activeFilter === 'My Department') return g.department === userData?.department;
    if (activeFilter === 'My Course') return g.course?.toLowerCase().includes(userData?.department?.toLowerCase());
    return true;
  });

  const myCampusCount = groups.filter((g) => g.university === userData?.university).length;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <DismissKeyboardView>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View className="px-6 pt-4 pb-8">

          {/* Header */}
          <View className="mb-6">
            <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>WhatsApp Study Groups</Text>
            <Text className="text-3xl font-bold mb-2" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Find your people, {firstName}</Text>
            <Text className="text-base leading-6" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
              Browse active WhatsApp groups for your courses and connect with students on your campus.
            </Text>
          </View>

          {/* Search */}
          <View className={`rounded-2xl px-4 py-3 flex-row items-center mb-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
            <Ionicons name="search-outline" size={20} color={isDark ? '#9CA3AF' : '#666666'} />
            <TextInput
              placeholder="Search by course, topic, or campus"
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
            {FILTERS.map((filter) => {
              const active = filter === activeFilter;
              return (
                <TouchableOpacity
                  key={filter}
                  className={`mr-3 px-4 py-2 rounded-full ${active ? 'bg-accent' : isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
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

          {/* Stats card */}
          <View
            className={`rounded-3xl p-6 mb-6 ${isDark ? '' : 'bg-primary'}`}
            style={isDark ? { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' } : undefined}
          >
            <View className="flex-row justify-between items-start mb-5">
              <View className="flex-1 pr-4">
                <Text className="text-white text-sm opacity-80 mb-1">How It Works</Text>
                <Text className="text-white text-2xl font-bold mb-2">Join real WhatsApp communities</Text>
                <Text className="text-white opacity-90 leading-6">
                  MINDLE helps students discover relevant WhatsApp groups for revision, course updates, and shared resources.
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="rounded-2xl p-3">
                <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
              </View>
            </View>
            <View className="flex-row" style={{ gap: 12 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">{loading ? '—' : groups.length}</Text>
                <Text className="text-white opacity-80 text-sm mt-1">WhatsApp groups</Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="flex-1 rounded-2xl p-4">
                <Text className="text-white text-2xl font-bold">{loading ? '—' : myCampusCount}</Text>
                <Text className="text-white opacity-80 text-sm mt-1">On your campus</Text>
              </View>
            </View>
          </View>

          {/* Group list */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
              {activeFilter === 'All' ? 'All groups' : activeFilter}
            </Text>
            <Text className="text-sm" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{filtered.length} found</Text>
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#FF3131" />
              <Text className="mt-3" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Loading groups...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className={`rounded-2xl p-10 items-center mb-6 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
              <Ionicons name="people-outline" size={48} color="#CCCCCC" />
              <Text className="text-center mt-3 font-medium" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>No groups found</Text>
              <Text className="text-xs text-center mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                {activeFilter !== 'All'
                  ? 'Try a different filter'
                  : isTutor ? 'Be the first to add a group below' : 'Check back soon for new groups'}
              </Text>
            </View>
          ) : (
            <View className="mb-6">
              <View style={{ gap: 14 }}>
                {filtered.slice(0, visibleCount).map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isOwner={group.createdBy === firebaseUser?.uid}
                    onEdit={() => setEditingGroup(group)}
                  />
                ))}
              </View>

              {filtered.length > visibleCount && (
                <TouchableOpacity
                  className="mt-4 py-3 flex-row items-center justify-center"
                  onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  activeOpacity={0.7}
                >
                  <Text className="text-accent font-semibold text-center mr-1">
                    View more ({filtered.length - visibleCount})
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#FF3131" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Add group CTA — tutors only */}
          {isTutor && (
            <View className={`rounded-3xl p-5 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
              <View className="flex-row items-center mb-3">
                <View className={`rounded-2xl p-3 mr-3 ${isDark ? 'bg-cardDark' : 'bg-white'}`}>
                  <Ionicons name="add-circle-outline" size={22} color="#FF3131" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>List your WhatsApp group</Text>
                  <Text className="leading-5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                    Add your existing group so coursemates can discover and join it.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-accent rounded-2xl py-3"
                activeOpacity={0.85}
                onPress={() => setShowAddModal(true)}
              >
                <Text className="text-white text-center text-base font-semibold">Add WhatsApp Group</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
      </DismissKeyboardView>

      <AddGroupModal
        visible={showAddModal || !!editingGroup}
        onClose={() => { setShowAddModal(false); setEditingGroup(null); }}
        userData={userData}
        firebaseUser={firebaseUser}
        group={editingGroup}
      />
    </SafeAreaView>
  );
}

function GroupCard({ group, isOwner, onEdit }) {
  const { isDark } = useTheme();

  const handleJoin = () => {
    if (!group.whatsappLink) {
      Alert.alert('No link', 'This group has not provided a join link.');
      return;
    }
    Linking.openURL(group.whatsappLink).catch(() =>
      Alert.alert('Error', 'Could not open WhatsApp link.')
    );
  };

  return (
    <View className={`rounded-3xl p-5 border ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-4">
          <Text className="text-lg font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{group.name}</Text>
          {group.description ? (
            <Text className="leading-5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{group.description}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View className={`px-3 py-1.5 rounded-full ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
            <Text className="text-xs font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{group.course}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
              onPress={onEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={16} color={isDark ? '#FFFFFF' : '#090F43'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {group.schedule ? (
        <Text className="text-sm mb-3" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{group.schedule}</Text>
      ) : null}

      <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
        <View className={`rounded-full px-3 py-1.5 flex-row items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
          <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
          <Text className="text-xs ml-1.5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>WhatsApp</Text>
        </View>
        {group.adminName ? (
          <View className={`rounded-full px-3 py-1.5 flex-row items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
            <Ionicons name="shield-checkmark-outline" size={13} color={isDark ? '#9CA3AF' : '#666666'} />
            <Text className="text-xs ml-1.5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Admin: {group.adminName}</Text>
          </View>
        ) : null}
        {group.university ? (
          <View className={`rounded-full px-3 py-1.5 flex-row items-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
            <Ionicons name="school-outline" size={13} color={isDark ? '#9CA3AF' : '#666666'} />
            <Text className="text-xs ml-1.5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{group.university}</Text>
          </View>
        ) : null}
      </View>

      {!isOwner && (
        <TouchableOpacity className="bg-accent rounded-2xl py-3" onPress={handleJoin} activeOpacity={0.85}>
          <Text className="text-white text-center font-semibold text-sm">Join WhatsApp Group</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function AddGroupModal({ visible, onClose, userData, firebaseUser, group }) {
  const { isDark } = useTheme();
  const isEditing = !!group;
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [adminName, setAdminName] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill on open: the group's values when editing, the user's defaults when creating
  useEffect(() => {
    if (!visible) return;
    setName(group?.name || '');
    setCourse(group?.course || '');
    setUniversity(group?.university ?? userData?.university ?? '');
    setDepartment(group?.department ?? userData?.department ?? '');
    setAdminName(group?.adminName ?? userData?.name ?? '');
    setWhatsappLink(group?.whatsappLink || '');
    setDescription(group?.description || '');
    setSchedule(group?.schedule || '');
  }, [visible, group]);

  const canSubmit = name.trim() && course.trim() && whatsappLink.trim() && !saving;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const fields = {
        name: name.trim(),
        course: course.trim(),
        university: university.trim(),
        department: department.trim(),
        adminName: adminName.trim(),
        whatsappLink: whatsappLink.trim(),
        description: description.trim(),
        schedule: schedule.trim(),
      };
      if (isEditing) {
        await updateGroup(group.id, fields);
        Alert.alert('Group updated', 'Your changes are live.');
      } else {
        await createGroup({ ...fields, createdBy: firebaseUser?.uid });
        Alert.alert('Group added!', 'Your group is now listed and students can discover it.');
      }
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} group. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete group', 'Remove this group from MINDLE? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(group.id);
            onClose();
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to delete group. Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <DismissKeyboardView>
      <View className="flex-1 bg-black/40 justify-end">
        <View className={`rounded-t-3xl px-6 pt-5 pb-8 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} style={{ maxHeight: '90%' }}>
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{isEditing ? 'Edit Group' : 'Add WhatsApp Group'}</Text>
              <Text className="mt-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                {isEditing ? 'Update your group details.' : 'List your group so students can discover it.'}
              </Text>
            </View>
            <TouchableOpacity
              className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#090F43'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <FormField label="Group Name *" placeholder="e.g. CSC 301 Night Prep" value={name} onChangeText={setName} />
            <SearchableSelect
              label="Course Code *"
              value={course}
              placeholder="Select a course"
              modalTitle="Select Course"
              searchPlaceholder="Search courses..."
              options={COURSE_CODE_OPTIONS}
              onChange={setCourse}
              containerClassName="mb-4"
            />
            <FormField label="WhatsApp Invite Link *" placeholder="Paste group invite link" value={whatsappLink} onChangeText={setWhatsappLink} />
            <FormField label="University" placeholder="Your university" value={university} onChangeText={setUniversity} />
            <FormField label="Department" placeholder="Your department" value={department} onChangeText={setDepartment} />
            <FormField label="Admin Name" placeholder="e.g. Sarah A." value={adminName} onChangeText={setAdminName} />
            <FormField label="Short Description" placeholder="What is this group for?" value={description} onChangeText={setDescription} multiline />
            <FormField label="Posting Rhythm" placeholder="e.g. Daily revision drops" value={schedule} onChangeText={setSchedule} />

            <View className="flex-row mt-2 mb-2" style={{ gap: 12 }}>
              <TouchableOpacity className={`flex-1 rounded-2xl py-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`} onPress={onClose} activeOpacity={0.85}>
                <Text className="text-center font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-accent rounded-2xl py-3"
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={{ opacity: canSubmit ? 1 : 0.4 }}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text className="text-white text-center font-semibold">{isEditing ? 'Save Changes' : 'Submit Group'}</Text>
                }
              </TouchableOpacity>
            </View>

            {isEditing && (
              <TouchableOpacity className="py-3 mb-2" onPress={handleDelete} activeOpacity={0.7} disabled={saving}>
                <Text className="text-center text-sm font-semibold" style={{ color: '#FF3131' }}>Delete group</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
      </DismissKeyboardView>
    </Modal>
  );
}

function FormField({ label, placeholder, value, onChangeText, multiline }) {
  const { isDark } = useTheme();
  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>{label}</Text>
      <TextInput
        className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
        style={{ color: isDark ? '#FFFFFF' : '#000000' }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
