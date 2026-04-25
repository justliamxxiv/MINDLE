import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { useUser } from '../context/UserContext';

export default function ProfileScreen({ navigation }) {
  const { userData, loading } = useUser();
  const [activeModal, setActiveModal] = React.useState(null);

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
              navigation.replace('Welcome');
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
                onPress={() => setActiveModal('edit')}
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
                onPress={() => setActiveModal('edit')}
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
        subtitle="Update your personal and academic details here. We can turn this into a full form next."
        icon="create-outline"
        onClose={() => setActiveModal(null)}
      >
        <InfoBlock label="Name" value={name} />
        <InfoBlock label="Email" value={email} />
        <InfoBlock label="University" value={userData?.university || 'Not added'} />
        <InfoBlock label="Department" value={userData?.department || 'Not added'} />
        <InfoBlock label="Year of Study" value={userData?.yearOfStudy || 'Not added'} />
        <InfoBlock label="WhatsApp" value={userData?.whatsappNumber || 'Not added'} />
        {isTutor && <InfoBlock label="Tutor Bio" value={userData?.bio || 'Not added'} />}
      </ProfileActionModal>

      <ProfileActionModal
        visible={activeModal === 'notifications'}
        title="Notifications"
        subtitle="Here’s the kind of activity this account should stay updated on."
        icon="notifications-outline"
        onClose={() => setActiveModal(null)}
      >
        <BulletRow text="WhatsApp group additions relevant to your course or department" />
        <BulletRow text="Tutor replies and availability updates" />
        <BulletRow text="Upcoming sessions and group activity reminders" />
        <BulletRow text="Account updates and important app notices" />
      </ProfileActionModal>

      <ProfileActionModal
        visible={activeModal === 'privacy'}
        title="Privacy & Safety"
        subtitle="This area should control what other users can see before they contact you."
        icon="shield-checkmark-outline"
        onClose={() => setActiveModal(null)}
      >
        <BulletRow text="Control who sees your WhatsApp number" />
        <BulletRow text="Choose whether your profile appears in tutor discovery" />
        <BulletRow text="Review what academic information is public" />
        <BulletRow text="Manage how students contact you through the app" />
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

function ProfileActionModal({ visible, title, subtitle, icon, onClose, children }) {
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoBlock({ label, value }) {
  return (
    <View className="bg-cardLight rounded-2xl p-4 mb-3">
      <Text className="text-textSecondary text-sm mb-1">{label}</Text>
      <Text className="text-primary font-semibold">{value}</Text>
    </View>
  );
}

function BulletRow({ text }) {
  return (
    <View className="flex-row items-start bg-cardLight rounded-2xl p-4 mb-3">
      <View className="w-7 h-7 rounded-full bg-white items-center justify-center mr-3 mt-0.5">
        <Ionicons name="checkmark" size={16} color="#FF3131" />
      </View>
      <Text className="flex-1 text-primary leading-6">{text}</Text>
    </View>
  );
}
