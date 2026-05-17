import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Modal, TextInput, Switch, Platform, ActionSheetIOS } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';
import { useUser } from '../context/UserContext';

const NIGERIAN_UNIVERSITIES = [
  'Adeleke University', 'Ahmadu Bello University', 'Babcock University',
  'Covenant University', 'Federal University of Technology, Akure',
  'Federal University of Technology, Minna', 'Lagos State University',
  'Obafemi Awolowo University', 'University of Benin', 'University of Ibadan',
  'University of Ilorin', 'University of Jos', 'University of Lagos',
  'University of Nigeria, Nsukka', 'University of Port Harcourt',
].sort();

export default function ProfileScreen({ navigation }) {
  const { userData, loading, refreshUserData } = useUser();
  const [activeModal, setActiveModal] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // Edit form state — initialised when modal opens
  const [editName, setEditName] = React.useState('');
  const [editUniversity, setEditUniversity] = React.useState('');
  const [editDepartment, setEditDepartment] = React.useState('');
  const [editYear, setEditYear] = React.useState('');
  const [editWhatsapp, setEditWhatsapp] = React.useState('');
  const [editBio, setEditBio] = React.useState('');
  const [editRate, setEditRate] = React.useState('');
  const [editAvailability, setEditAvailability] = React.useState('');

  // Notification prefs
  const [notifSessions, setNotifSessions] = React.useState(userData?.notif_sessions ?? true);
  const [notifGroups, setNotifGroups] = React.useState(userData?.notif_groups ?? true);
  const [notifTutorReplies, setNotifTutorReplies] = React.useState(userData?.notif_tutorReplies ?? true);
  const [notifAppUpdates, setNotifAppUpdates] = React.useState(userData?.notif_appUpdates ?? false);

  // Privacy prefs
  const [privacyShowWhatsapp, setPrivacyShowWhatsapp] = React.useState(userData?.privacy_showWhatsapp ?? true);
  const [privacyAppearInSearch, setPrivacyAppearInSearch] = React.useState(userData?.privacy_appearInSearch ?? true);

  const savePrefs = async (updates) => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
    } catch (e) {
      Alert.alert('Error', 'Could not save preference. Please try again.');
    }
  };

  const openEditModal = () => {
    setEditName(userData?.name || '');
    setEditUniversity(userData?.university || '');
    setEditDepartment(userData?.department || '');
    setEditYear(userData?.yearOfStudy || '');
    setEditWhatsapp(userData?.whatsappNumber || '');
    setEditBio(userData?.bio || '');
    setEditRate(userData?.hourlyRate || '');
    setEditAvailability(userData?.availability || '');
    setActiveModal('edit');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    if (!editUniversity) { Alert.alert('Error', 'Please select your university'); return; }
    if (!editDepartment.trim()) { Alert.alert('Error', 'Department cannot be empty'); return; }
    if (!editWhatsapp.trim()) { Alert.alert('Error', 'WhatsApp number cannot be empty'); return; }

    setSaving(true);
    try {
      const user = auth.currentUser;
      const updates = {
        name: editName.trim(),
        university: editUniversity,
        department: editDepartment.trim(),
        yearOfStudy: editYear,
        whatsappNumber: editWhatsapp.trim(),
      };
      if (isTutor) {
        updates.bio = editBio.trim();
        updates.hourlyRate = editRate.trim();
        updates.availability = editAvailability.trim();
      }
      await updateDoc(doc(db, 'users', user.uid), updates);
      await refreshUserData();
      setActiveModal(null);
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // RootNavigator automatically switches to auth stack when userData clears
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#FF3131" />
      </SafeAreaView>
    );
  }

  const name = userData?.name || 'Your Profile';
  const email = userData?.email || auth.currentUser?.email || 'No email added';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const isTutor = userData?.accountType === 'tutor';
  const campusLine = [userData?.university, userData?.department].filter(Boolean).join(' • ');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar style="dark" />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-8">
          <View className="bg-primary rounded-3xl p-6 mb-6">
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-row items-center flex-1 pr-4">
                <View className="w-14 h-14 rounded-full bg-white items-center justify-center mr-3">
                  <Text className="text-accent text-lg font-bold">{initials}</Text>
                </View>
                <View className="flex-1 justify-center">
                  <Text className="text-white text-2xl font-bold">{name}</Text>
                </View>
              </View>

              <TouchableOpacity
                className="bg-white/15 rounded-2xl p-3"
                activeOpacity={0.85}
                onPress={openEditModal}
              >
                <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.10)' }} className="rounded-2xl px-4 py-4">
              <Text className="text-white opacity-80 mb-3">{email}</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} className="self-start px-3 py-2 rounded-full">
                <Text className="text-white text-xs font-semibold">
                  {isTutor ? 'Tutor Account' : 'Student Account'}
                </Text>
              </View>
            </View>

            {!!campusLine && (
              <Text className="text-white opacity-80 mt-3">
                {campusLine}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-2xl font-bold text-primary mb-4">Account details</Text>

            <View className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
              <ProfileRow icon="mail-outline" label="Email" value={email} />
              <Divider />
              <ProfileRow icon="school-outline" label="University" value={userData?.university || 'Not added'} />
              <Divider />
              <ProfileRow icon="book-outline" label="Department" value={userData?.department || 'Not added'} />
              <Divider />
              <ProfileRow icon="layers-outline" label="Year of Study" value={userData?.yearOfStudy || 'Not added'} />
              <Divider />
              <ProfileRow icon="logo-whatsapp" label="WhatsApp" value={userData?.whatsappNumber || 'Not added'} />
            </View>
          </View>

          {isTutor && (
            <View className="mb-6">
              <Text className="text-2xl font-bold text-primary mb-4">Tutor profile</Text>

              <View className="bg-cardLight rounded-3xl p-5 mb-4">
                <Text className="text-textSecondary text-sm mb-1">Bio</Text>
                <Text className="text-primary text-base leading-6">
                  {userData?.bio || 'Add a short teaching bio so students can understand your style.'}
                </Text>
              </View>

              <View className="flex-row mb-4" style={{ gap: 12 }}>
                <View className="flex-1 bg-white rounded-3xl border border-gray-100 p-5">
                  <Text className="text-textSecondary text-sm mb-1">Hourly Rate</Text>
                  <Text className="text-primary text-lg font-bold">
                    {userData?.hourlyRate || 'Not set'}
                  </Text>
                </View>
                <View className="flex-1 bg-white rounded-3xl border border-gray-100 p-5">
                  <Text className="text-textSecondary text-sm mb-1">Rating</Text>
                  <Text className="text-primary text-lg font-bold">
                    {userData?.rating ?? 0} / 5
                  </Text>
                </View>
              </View>

              <View className="bg-white rounded-3xl border border-gray-100 p-5">
                <Text className="text-textSecondary text-sm mb-1">Availability</Text>
                <Text className="text-primary text-base leading-6">
                  {userData?.availability || 'Add when you are available for tutoring.'}
                </Text>
              </View>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-2xl font-bold text-primary mb-4">Quick actions</Text>

            <View style={{ gap: 12 }}>
              <ActionCard
                icon="person-circle-outline"
                title="Edit profile"
                subtitle="Update your academic info, contact details, and preferences."
                onPress={openEditModal}
              />
              <ActionCard
                icon="notifications-outline"
                title="Notifications"
                subtitle="Stay on top of group activity, tutor replies, and upcoming sessions."
                onPress={() => setActiveModal('notifications')}
              />
              <ActionCard
                icon="shield-checkmark-outline"
                title="Privacy & safety"
                subtitle="Manage how your details are shared when you connect with others."
                onPress={() => setActiveModal('privacy')}
              />
            </View>
          </View>

          <TouchableOpacity
            className="bg-accent py-4 rounded-2xl"
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text className="text-white text-center text-lg font-semibold">
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ProfileActionModal
        visible={activeModal === 'edit'}
        title="Edit Profile"
        subtitle="Update your personal and academic details."
        icon="create-outline"
        onClose={() => setActiveModal(null)}
        footer={
          <TouchableOpacity
            className="bg-primary py-4 rounded-2xl mt-4"
            onPress={handleSaveProfile}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white text-center text-base font-semibold">Save changes</Text>
            }
          </TouchableOpacity>
        }
      >
        <EditField label="Full name" value={editName} onChangeText={setEditName} placeholder="Your name" />

        <SelectField
          label="University"
          value={editUniversity}
          placeholder="Select university"
          options={NIGERIAN_UNIVERSITIES.map((u) => ({ label: u, value: u }))}
          onChange={setEditUniversity}
          disabled={saving}
        />

        <EditField label="Department" value={editDepartment} onChangeText={setEditDepartment} placeholder="e.g. Computer Science" disabled={saving} />

        <SelectField
          label="Year of study"
          value={editYear}
          placeholder="Select year"
          options={[
            { label: '100 Level', value: '100' },
            { label: '200 Level', value: '200' },
            { label: '300 Level', value: '300' },
            { label: '400 Level', value: '400' },
            { label: '500 Level', value: '500' },
            { label: 'Graduate / Masters', value: 'graduate' },
          ]}
          onChange={setEditYear}
          disabled={saving}
        />

        <EditField label="WhatsApp number" value={editWhatsapp} onChangeText={setEditWhatsapp} placeholder="+234 XXX XXX XXXX" keyboardType="phone-pad" disabled={saving} />

        {isTutor && (
          <>
            <EditField label="Bio" value={editBio} onChangeText={setEditBio} placeholder="Tell students about yourself..." multiline disabled={saving} />
            <EditField label="Hourly rate" value={editRate} onChangeText={setEditRate} placeholder="e.g. ₦2000/hour or Free" disabled={saving} />
            <EditField label="Availability" value={editAvailability} onChangeText={setEditAvailability} placeholder="e.g. Weekdays 4pm–8pm" multiline disabled={saving} />
          </>
        )}
      </ProfileActionModal>

      <ProfileActionModal
        visible={activeModal === 'notifications'}
        title="Notifications"
        subtitle="Choose what you want to be notified about."
        icon="notifications-outline"
        onClose={() => setActiveModal(null)}
      >
        <ToggleRow
          label="Session reminders"
          description="Upcoming sessions and confirmation requests"
          value={notifSessions}
          onValueChange={(v) => { setNotifSessions(v); savePrefs({ notif_sessions: v }); }}
        />
        <ToggleRow
          label="Group activity"
          description="New WhatsApp groups added in your department"
          value={notifGroups}
          onValueChange={(v) => { setNotifGroups(v); savePrefs({ notif_groups: v }); }}
        />
        <ToggleRow
          label="Tutor replies"
          description="When a tutor accepts or declines your request"
          value={notifTutorReplies}
          onValueChange={(v) => { setNotifTutorReplies(v); savePrefs({ notif_tutorReplies: v }); }}
        />
        <ToggleRow
          label="App updates"
          description="New features and important app announcements"
          value={notifAppUpdates}
          onValueChange={(v) => { setNotifAppUpdates(v); savePrefs({ notif_appUpdates: v }); }}
        />
      </ProfileActionModal>

      <ProfileActionModal
        visible={activeModal === 'privacy'}
        title="Privacy & Safety"
        subtitle="Control what others can see about you."
        icon="shield-checkmark-outline"
        onClose={() => setActiveModal(null)}
      >
        <ToggleRow
          label="Show WhatsApp number"
          description="Allow other students to see your WhatsApp contact"
          value={privacyShowWhatsapp}
          onValueChange={(v) => { setPrivacyShowWhatsapp(v); savePrefs({ privacy_showWhatsapp: v }); }}
        />
        <ToggleRow
          label="Appear in tutor search"
          description="Let students find your profile in the tutors list"
          value={privacyAppearInSearch}
          onValueChange={(v) => { setPrivacyAppearInSearch(v); savePrefs({ privacy_appearInSearch: v }); }}
        />
      </ProfileActionModal>
    </SafeAreaView>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <View className="px-5 py-4 flex-row items-center">
      <View className="w-11 h-11 rounded-2xl bg-cardLight items-center justify-center mr-4">
        <Ionicons name={icon} size={20} color="#090F43" />
      </View>
      <View className="flex-1">
        <Text className="text-textSecondary text-sm mb-1">{label}</Text>
        <Text className="text-primary font-semibold">{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 mx-5" />;
}

function ActionCard({ icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity className="bg-white rounded-3xl border border-gray-100 p-5" activeOpacity={0.86} onPress={onPress}>
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-2xl bg-cardLight items-center justify-center mr-4">
          <Ionicons name={icon} size={22} color="#FF3131" />
        </View>
        <View className="flex-1 pr-3">
          <Text className="text-primary font-bold text-base mb-1">{title}</Text>
          <Text className="text-textSecondary leading-5">{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );
}

function ProfileActionModal({ visible, title, subtitle, icon, onClose, children, footer }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <View className="bg-background rounded-t-3xl px-6 pt-5 pb-8" style={{ maxHeight: '85%' }}>
          <View className="flex-row items-start justify-between mb-5">
            <View className="flex-1 pr-4">
              <View className="w-12 h-12 rounded-2xl bg-cardLight items-center justify-center mb-3">
                <Ionicons name={icon} size={22} color="#FF3131" />
              </View>
              <Text className="text-2xl font-bold text-primary mb-1">{title}</Text>
              <Text className="text-textSecondary leading-6">{subtitle}</Text>
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
            {children}
            {footer}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SelectField({ label, value, placeholder, options, onChange, disabled }) {
  const displayLabel = options.find((o) => o.value === value)?.label || '';

  const handlePress = () => {
    if (disabled) return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', ...options.map((o) => o.label)], cancelButtonIndex: 0 },
        (index) => { if (index > 0) onChange(options[index - 1].value); }
      );
    } else {
      Alert.alert(label, '', [
        ...options.map((o) => ({ text: o.label, onPress: () => onChange(o.value) })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View className="mb-3">
      <Text className="text-textSecondary text-sm mb-1">{label}</Text>
      <TouchableOpacity
        className="bg-cardLight px-4 py-3 rounded-2xl flex-row items-center justify-between"
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text className={displayLabel ? 'text-primary' : 'text-gray-400'}>
          {displayLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

function EditField({ label, value, onChangeText, placeholder, multiline, keyboardType, disabled }) {
  return (
    <View className="mb-3">
      <Text className="text-textSecondary text-sm mb-1">{label}</Text>
      <TextInput
        className="bg-cardLight px-4 py-3 rounded-2xl text-primary"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType || 'default'}
        editable={!disabled}
      />
    </View>
  );
}

function ToggleRow({ label, description, value, onValueChange }) {
  return (
    <View className="flex-row items-center bg-cardLight rounded-2xl p-4 mb-3">
      <View className="flex-1 pr-3">
        <Text className="text-primary font-semibold mb-0.5">{label}</Text>
        <Text className="text-textSecondary text-xs leading-5">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#FF3131' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
