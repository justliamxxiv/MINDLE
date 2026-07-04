import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, SafeAreaView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { subscribeGroups, createGroup, updateGroup, deleteGroup } from '../services/groupService';

const FILTERS = ['All', 'My Campus', 'My Department', 'My Course'];

export default function GroupsScreen() {
  const { userData, firebaseUser } = useUser();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const firstName = userData?.name?.split(' ')[0] || 'there';

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

  const totalMembers = groups.reduce((sum, g) => sum + (g.members || 0), 0);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-8">

          {/* Header */}
          <View className="mb-6">
            <Text className="text-textSecondary text-sm mb-1">WhatsApp Study Groups</Text>
            <Text className="text-3xl font-bold text-primary mb-2">Find your people, {firstName}</Text>
            <Text className="text-textSecondary text-base leading-6">
              Browse active WhatsApp groups for your courses and connect with students on your campus.
            </Text>
          </View>

          {/* Search */}
          <View className="bg-cardLight rounded-2xl px-4 py-3 flex-row items-center mb-4">
            <Ionicons name="search-outline" size={20} color="#666666" />
            <TextInput
              placeholder="Search by course, topic, or campus"
              placeholderTextColor="#666666"
              className="flex-1 ml-3 text-textPrimary"
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
                  className={`mr-3 px-4 py-2 rounded-full ${active ? 'bg-accent' : 'bg-cardLight'}`}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.85}
                >
                  <Text className={`${active ? 'text-white' : 'text-primary'} font-semibold text-sm`}>{filter}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Stats card */}
          <View className="bg-primary rounded-3xl p-6 mb-6">
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
                <Text className="text-white text-2xl font-bold">{loading ? '—' : totalMembers}</Text>
                <Text className="text-white opacity-80 text-sm mt-1">Students inside</Text>
              </View>
            </View>
          </View>

          {/* Group list */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-primary">
              {activeFilter === 'All' ? 'All groups' : activeFilter}
            </Text>
            <Text className="text-textSecondary text-sm">{filtered.length} found</Text>
          </View>

          {loading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#FF3131" />
              <Text className="text-textSecondary mt-3">Loading groups...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="bg-cardLight rounded-2xl p-10 items-center mb-6">
              <Ionicons name="people-outline" size={48} color="#CCCCCC" />
              <Text className="text-textSecondary text-center mt-3 font-medium">No groups found</Text>
              <Text className="text-textSecondary text-xs text-center mt-1">
                {activeFilter !== 'All' ? 'Try a different filter or' : 'Be the first to'} add a group below
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }} className="mb-6">
              {filtered.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  isOwner={group.createdBy === firebaseUser?.uid}
                  onEdit={() => setEditingGroup(group)}
                />
              ))}
            </View>
          )}

          {/* Add group CTA */}
          <View className="bg-cardLight rounded-3xl p-5">
            <View className="flex-row items-center mb-3">
              <View className="bg-white rounded-2xl p-3 mr-3">
                <Ionicons name="add-circle-outline" size={22} color="#FF3131" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-primary">List your WhatsApp group</Text>
                <Text className="text-textSecondary leading-5">
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
        </View>
      </ScrollView>

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
    <View className="bg-white rounded-3xl p-5 border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-4">
          <Text className="text-lg font-bold text-primary mb-1">{group.name}</Text>
          {group.description ? (
            <Text className="text-textSecondary leading-5">{group.description}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View className="bg-cardLight px-3 py-1.5 rounded-full">
            <Text className="text-primary text-xs font-semibold">{group.course}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              className="bg-cardLight w-8 h-8 rounded-full items-center justify-center"
              onPress={onEdit}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={16} color="#090F43" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="text-textSecondary text-sm mb-3">
        {group.schedule ? `${group.schedule} · ` : ''}{group.members || 1} member{group.members !== 1 ? 's' : ''}
      </Text>

      <View className="flex-row flex-wrap mb-4" style={{ gap: 8 }}>
        <View className="bg-cardLight rounded-full px-3 py-1.5 flex-row items-center">
          <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
          <Text className="text-textSecondary text-xs ml-1.5">WhatsApp</Text>
        </View>
        {group.adminName ? (
          <View className="bg-cardLight rounded-full px-3 py-1.5 flex-row items-center">
            <Ionicons name="shield-checkmark-outline" size={13} color="#666666" />
            <Text className="text-textSecondary text-xs ml-1.5">Admin: {group.adminName}</Text>
          </View>
        ) : null}
        {group.university ? (
          <View className="bg-cardLight rounded-full px-3 py-1.5 flex-row items-center">
            <Ionicons name="school-outline" size={13} color="#666666" />
            <Text className="text-textSecondary text-xs ml-1.5">{group.university}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity className="bg-accent rounded-2xl py-3" onPress={handleJoin} activeOpacity={0.85}>
        <Text className="text-white text-center font-semibold text-sm">Join WhatsApp Group</Text>
      </TouchableOpacity>
    </View>
  );
}

function AddGroupModal({ visible, onClose, userData, firebaseUser, group }) {
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
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-background rounded-t-3xl px-6 pt-5 pb-8" style={{ maxHeight: '90%' }}>
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-2xl font-bold text-primary">{isEditing ? 'Edit Group' : 'Add WhatsApp Group'}</Text>
              <Text className="text-textSecondary mt-1">
                {isEditing ? 'Update your group details.' : 'List your group so students can discover it.'}
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-cardLight items-center justify-center"
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color="#090F43" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <FormField label="Group Name *" placeholder="e.g. CSC 301 Night Prep" value={name} onChangeText={setName} />
            <FormField label="Course Code *" placeholder="e.g. CSC 301" value={course} onChangeText={setCourse} />
            <FormField label="WhatsApp Invite Link *" placeholder="Paste group invite link" value={whatsappLink} onChangeText={setWhatsappLink} />
            <FormField label="University" placeholder="Your university" value={university} onChangeText={setUniversity} />
            <FormField label="Department" placeholder="Your department" value={department} onChangeText={setDepartment} />
            <FormField label="Admin Name" placeholder="e.g. Sarah A." value={adminName} onChangeText={setAdminName} />
            <FormField label="Short Description" placeholder="What is this group for?" value={description} onChangeText={setDescription} multiline />
            <FormField label="Posting Rhythm" placeholder="e.g. Daily revision drops" value={schedule} onChangeText={setSchedule} />

            <View className="flex-row mt-2 mb-2" style={{ gap: 12 }}>
              <TouchableOpacity className="flex-1 bg-cardLight rounded-2xl py-3" onPress={onClose} activeOpacity={0.85}>
                <Text className="text-primary text-center font-semibold">Cancel</Text>
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
    </Modal>
  );
}

function FormField({ label, placeholder, value, onChangeText, multiline }) {
  return (
    <View className="mb-4">
      <Text className="text-textPrimary mb-2 font-medium">{label}</Text>
      <TextInput
        className="bg-cardLight px-4 py-3 rounded-2xl text-textPrimary"
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
