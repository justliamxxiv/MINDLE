import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Modal, TextInput, Switch, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, db } from '../config/firebaseConfig';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { updateUserWithUniquePhone } from '../services/userService';
import { normalizePhone } from '../utils/whatsapp';
import { UNIVERSITIES, COURSES, YEAR_OF_STUDY_OPTIONS } from '../utils/academicOptions';
import { buildAvailabilityString, parseAvailabilityString } from '../utils/availability';
import { formatHourlyRate } from '../utils/currency';
import SearchableSelect from '../components/SearchableSelect';
import PhoneInput from '../components/PhoneInput';
import AvailabilityPicker from '../components/AvailabilityPicker';
import DismissKeyboardView from '../components/DismissKeyboardView';

export default function ProfileScreen({ navigation }) {
  const { userData, loading, refreshUserData } = useUser();
  const { isDark, toggleTheme } = useTheme();
  const [activeModal, setActiveModal] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  // Edit form state — initialised when modal opens
  const [editName, setEditName] = React.useState('');
  const [editUniversity, setEditUniversity] = React.useState('');
  const [editDepartment, setEditDepartment] = React.useState('');
  const [editYear, setEditYear] = React.useState('');
  const [editWhatsapp, setEditWhatsapp] = React.useState('');
  const [editBio, setEditBio] = React.useState('');
  const [editRate, setEditRate] = React.useState('');
  const [editAvailableDays, setEditAvailableDays] = React.useState([]);
  const [editHoursMode, setEditHoursMode] = React.useState('always');
  const [editFromTime, setEditFromTime] = React.useState('');
  const [editToTime, setEditToTime] = React.useState('');

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

  const handleAvatarPress = () => {
    if (uploadingAvatar) return;

    const options = [
      { text: userData?.avatar ? 'Replace Photo' : 'Choose Photo', onPress: handlePickAvatar },
    ];
    if (userData?.avatar) {
      options.push({ text: 'Remove Photo', style: 'destructive', onPress: handleRemoveAvatar });
    }
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Profile Photo', '', options);
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { avatar: null });
      await refreshUserData();
    } catch (error) {
      console.error('Avatar removal error:', error);
      Alert.alert('Error', 'Could not remove your photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePickAvatar = async () => {
    if (uploadingAvatar) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      setUploadingAvatar(true);

      // Resize to small square + compress + convert to base64
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64Image = `data:image/jpeg;base64,${manipulated.base64}`;

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        avatar: base64Image,
      });

      await refreshUserData();
    } catch (error) {
      console.error('Avatar upload error:', error);
      Alert.alert('Error', 'Could not update your photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
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
    const parsed = parseAvailabilityString(userData?.availability);
    setEditAvailableDays(parsed.days);
    setEditHoursMode(parsed.hoursMode);
    setEditFromTime(parsed.fromTime);
    setEditToTime(parsed.toTime);
    setActiveModal('edit');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    if (!editUniversity) { Alert.alert('Error', 'Please select your university'); return; }
    if (!editDepartment.trim()) { Alert.alert('Error', 'Department cannot be empty'); return; }
    if (!editWhatsapp.trim()) { Alert.alert('Error', 'WhatsApp number cannot be empty'); return; }
    const normalizedPhone = normalizePhone(editWhatsapp);
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      Alert.alert('Error', 'Please enter a valid WhatsApp number');
      return;
    }
    if (isTutor) {
      if (editAvailableDays.length === 0) {
        Alert.alert('Error', 'Please select at least one available day');
        return;
      }
      if (editHoursMode === 'selected' && (!editFromTime || !editToTime)) {
        Alert.alert('Error', 'Please set your available hours');
        return;
      }
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      const updates = {
        name: editName.trim(),
        university: editUniversity,
        department: editDepartment.trim(),
        yearOfStudy: editYear,
      };
      if (isTutor) {
        updates.bio = editBio.trim();
        updates.hourlyRate = editRate.trim();
        updates.availability = buildAvailabilityString({
          days: editAvailableDays,
          hoursMode: editHoursMode,
          fromTime: editFromTime,
          toTime: editToTime,
        });
      }
      // Saves profile and claims the WhatsApp number in the unique-phone registry
      await updateUserWithUniquePhone(user.uid, editWhatsapp, userData?.whatsappNumber, updates);
      await refreshUserData();
      setActiveModal(null);
    } catch (error) {
      if (error.code === 'phone-taken') {
        Alert.alert('Number already in use', 'This WhatsApp number is already linked to another account. Please use a different number.');
        return;
      }
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
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
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
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-8">
          <View
            className={`rounded-3xl p-6 mb-6 ${isDark ? '' : 'bg-primary'}`}
            style={isDark ? { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' } : undefined}
          >
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-row items-center flex-1 pr-4">
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  activeOpacity={0.8}
                  disabled={uploadingAvatar}
                  className="mr-3"
                >
                  <View className="w-14 h-14 rounded-full bg-white items-center justify-center overflow-hidden">
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#FF3131" />
                    ) : userData?.avatar ? (
                      <Image
                        source={{ uri: userData.avatar }}
                        style={{ width: 56, height: 56, borderRadius: 28 }}
                      />
                    ) : (
                      <Text className="text-accent text-lg font-bold">{initials}</Text>
                    )}
                  </View>
                  <View
                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-accent items-center justify-center"
                    style={{ borderWidth: 1.5, borderColor: isDark ? '#000000' : '#090F43' }}
                  >
                    <Ionicons name="camera" size={10} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
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
            <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Account details</Text>

            <View className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
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
              <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Tutor profile</Text>

              <View className={`rounded-3xl p-5 mb-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Bio</Text>
                <Text className="text-base leading-6" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                  {userData?.bio || 'Add a short teaching bio so students can understand your style.'}
                </Text>
              </View>

              <View className="flex-row mb-4" style={{ gap: 12 }}>
                <View className={`flex-1 rounded-3xl border p-5 ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                  <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Hourly Rate</Text>
                  <Text className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                    {formatHourlyRate(userData?.hourlyRate, 'Not set')}
                  </Text>
                </View>
                <View className={`flex-1 rounded-3xl border p-5 ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                  <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Rating</Text>
                  <Text className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                    {userData?.rating ?? 0} / 5
                  </Text>
                </View>
              </View>

              <View className={`rounded-3xl border p-5 ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>Availability</Text>
                <Text className="text-base leading-6" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>
                  {userData?.availability || 'Add when you are available for tutoring.'}
                </Text>
              </View>
            </View>
          )}

          <View className="mb-6">
            <Text className="text-2xl font-bold mb-4" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Quick actions</Text>

            <View style={{ gap: 12 }}>
              <ActionCard
                icon="person-circle-outline"
                title="Edit profile"
                subtitle="Update your academic info, contact details, and preferences."
                onPress={openEditModal}
              />
              <View className={`flex-row items-center rounded-3xl border p-5 ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}>
                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                  <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color="#FF3131" />
                </View>
                <View className="flex-1 pr-3">
                  <Text className="font-bold text-base mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Dark mode</Text>
                  <Text className="leading-5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                    {isDark ? 'Easy on the eyes at night.' : 'Switch to a darker look.'}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#E5E7EB', true: '#FF3131' }}
                  thumbColor="#FFFFFF"
                />
              </View>
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
            className={`py-4 rounded-2xl mt-4 ${isDark ? 'bg-cardDark' : 'bg-primary'}`}
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

        <SearchableSelect
          label="University"
          value={editUniversity}
          placeholder="Select university"
          modalTitle="Select University"
          searchPlaceholder="Search universities..."
          options={UNIVERSITIES.map((u) => ({ label: u, value: u }))}
          onChange={setEditUniversity}
          disabled={saving}
          containerClassName="mb-3"
        />

        <SearchableSelect
          label="Department"
          value={editDepartment}
          placeholder="Select department"
          modalTitle="Select Department"
          searchPlaceholder="Search departments..."
          options={COURSES.map((c) => ({ label: c, value: c }))}
          onChange={setEditDepartment}
          disabled={saving}
          containerClassName="mb-3"
        />

        <SearchableSelect
          label="Year of study"
          value={editYear}
          placeholder="Select year"
          modalTitle="Select Year"
          searchPlaceholder="Search years..."
          options={YEAR_OF_STUDY_OPTIONS}
          onChange={setEditYear}
          disabled={saving}
          containerClassName="mb-3"
        />

        <View className="mb-3">
          <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>WhatsApp number</Text>
          <PhoneInput value={editWhatsapp} onChangeText={setEditWhatsapp} editable={!saving} />
        </View>

        {isTutor && (
          <>
            <EditField label="Bio" value={editBio} onChangeText={setEditBio} placeholder="Tell students about yourself..." multiline disabled={saving} />
            <EditField label="Hourly rate" value={editRate} onChangeText={setEditRate} placeholder="e.g. ₦2000/hour or Free" disabled={saving} />
            <AvailabilityPicker
              days={editAvailableDays}
              onDaysChange={setEditAvailableDays}
              hoursMode={editHoursMode}
              onHoursModeChange={setEditHoursMode}
              fromTime={editFromTime}
              onFromTimeChange={setEditFromTime}
              toTime={editToTime}
              onToTimeChange={setEditToTime}
              isDark={isDark}
              disabled={saving}
            />
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
  const { isDark } = useTheme();
  return (
    <View className="px-5 py-4 flex-row items-center">
      <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
        <Ionicons name={icon} size={20} color={isDark ? '#FFFFFF' : '#090F43'} />
      </View>
      <View className="flex-1">
        <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{label}</Text>
        <Text className="font-semibold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  const { isDark } = useTheme();
  return <View className={`h-px mx-5 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />;
}

function ActionCard({ icon, title, subtitle, onPress }) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity
      className={`rounded-3xl border p-5 ${isDark ? 'bg-cardDark border-gray-800' : 'bg-white border-gray-100'}`}
      activeOpacity={0.86}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
          <Ionicons name={icon} size={22} color="#FF3131" />
        </View>
        <View className="flex-1 pr-3">
          <Text className="font-bold text-base mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{title}</Text>
          <Text className="leading-5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );
}

function ProfileActionModal({ visible, title, subtitle, icon, onClose, children, footer }) {
  const { isDark } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <DismissKeyboardView>
      <View className="flex-1 bg-black/40 justify-end">
        <View className={`rounded-t-3xl px-6 pt-5 pb-8 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} style={{ maxHeight: '85%' }}>
          <View className="flex-row items-start justify-between mb-5">
            <View className="flex-1 pr-4">
              <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
                <Ionicons name={icon} size={22} color="#FF3131" />
              </View>
              <Text className="text-2xl font-bold mb-1" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{title}</Text>
              <Text className="leading-6" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{subtitle}</Text>
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
            {children}
            {footer}
          </ScrollView>
        </View>
      </View>
      </DismissKeyboardView>
    </Modal>
  );
}

function EditField({ label, value, onChangeText, placeholder, multiline, keyboardType, disabled }) {
  const { isDark } = useTheme();
  return (
    <View className="mb-3">
      <Text className="text-sm mb-1" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{label}</Text>
      <TextInput
        className={`px-4 py-3 rounded-2xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
        style={{ color: isDark ? '#FFFFFF' : '#090F43' }}
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
  const { isDark } = useTheme();
  return (
    <View className={`flex-row items-center rounded-2xl p-4 mb-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
      <View className="flex-1 pr-3">
        <Text className="font-semibold mb-0.5" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{label}</Text>
        <Text className="text-xs leading-5" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>{description}</Text>
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