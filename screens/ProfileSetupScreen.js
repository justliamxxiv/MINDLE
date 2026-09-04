import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/firebaseConfig';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { updateUserWithUniquePhone } from '../services/userService';
import { normalizePhone } from '../utils/whatsapp';
import { UNIVERSITIES, COURSES, YEAR_OF_STUDY_OPTIONS } from '../utils/academicOptions';
import { buildAvailabilityString } from '../utils/availability';
import SearchableSelect from '../components/SearchableSelect';
import PhoneInput from '../components/PhoneInput';
import AvailabilityPicker from '../components/AvailabilityPicker';
import DismissKeyboardView from '../components/DismissKeyboardView';

export default function ProfileSetupScreen({ navigation, route }) {
  const { refreshUserData, userData } = useUser();
  const { isDark } = useTheme();
  // Route params are lost when RootNavigator swaps stacks after signup,
  // so fall back to the Firestore doc saved at signup (via context)
  const userName = route?.params?.userName || userData?.name || '';
  const userEmail = route?.params?.userEmail || userData?.email || '';
  
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [accountType, setAccountType] = useState('student');
  
  // Tutor-specific fields
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availableDays, setAvailableDays] = useState([]);
  const [hoursMode, setHoursMode] = useState('always'); // 'always' | 'selected' | 'appointment'
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');

  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    // Common validation
    if (!university) {
      Alert.alert('Error', 'Please select your university');
      return;
    }
    if (!department.trim()) {
      Alert.alert('Error', 'Please enter your department');
      return;
    }
    if (!yearOfStudy) {
      Alert.alert('Error', 'Please select your year of study');
      return;
    }
    if (!whatsappNumber.trim()) {
      Alert.alert('Error', 'Please enter your WhatsApp number');
      return;
    }
    const normalizedPhone = normalizePhone(whatsappNumber);
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      Alert.alert('Error', 'Please enter a valid WhatsApp number');
      return;
    }

    // Tutor-specific validation
    if (accountType === 'tutor') {
      if (!bio.trim()) {
        Alert.alert('Error', 'Please write a short bio about yourself');
        return;
      }
      if (availableDays.length === 0) {
        Alert.alert('Error', 'Please select at least one available day');
        return;
      }
      if (hoursMode === 'selected' && (!fromTime || !toTime)) {
        Alert.alert('Error', 'Please set your available hours');
        return;
      }
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      // Prepare profile data
      const profileData = {
        uid: user.uid,
        email: userEmail || user.email,
        university: university,
        department: department.trim(),
        yearOfStudy: yearOfStudy,
        accountType: accountType,
        profileCompleted: true,
      };
      const resolvedName = userName || user.displayName || '';
      if (resolvedName) {
        profileData.name = resolvedName;
      }
      if (!userData?.createdAt) {
        profileData.createdAt = new Date().toISOString();
      }

      // Add tutor-specific fields if tutor
      if (accountType === 'tutor') {
        profileData.bio = bio.trim();
        profileData.hourlyRate = hourlyRate.trim();
        profileData.availability = buildAvailabilityString({ days: availableDays, hoursMode, fromTime, toTime });
        profileData.rating = 0;
        profileData.reviewsCount = 0;
      }

      // Saves via merge (fields from signup are never wiped) and claims the
      // WhatsApp number in the unique-phone registry
      await updateUserWithUniquePhone(user.uid, whatsappNumber, userData?.whatsappNumber, profileData);

      // Updating context triggers RootNavigator to automatically switch to MainApp
      await refreshUserData();

    } catch (error) {
      if (error.code === 'phone-taken') {
        Alert.alert('Number already in use', 'This WhatsApp number is already linked to another account. Please use a different number.');
        return;
      }
      console.error('Profile setup error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DismissKeyboardView>
    <ScrollView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} keyboardShouldPersistTaps="handled">
      <View className="px-8 pt-16 pb-8">
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold mb-2" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>Complete Your Profile</Text>
          <Text className="text-lg" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
            Help us personalize your experience
          </Text>
        </View>

        {/* Account Type Selection - MOVED TO TOP */}
        <View className="mb-8">
          <Text className="mb-3 font-medium text-lg" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>I want to:</Text>

          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${
              accountType === 'student' ? 'bg-accent border-accent' : isDark ? 'bg-cardDark border-gray-700' : 'bg-cardLight border-gray-300'
            }`}
            onPress={() => setAccountType('student')}
            disabled={loading}
          >
            <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
              accountType === 'student' ? 'bg-white border-white' : 'border-gray-400'
            }`}>
              {accountType === 'student' && (
                <View className="w-3 h-3 rounded-full bg-accent self-center mt-0.5" />
              )}
            </View>
            <View>
              <Text className="font-semibold" style={{ color: accountType === 'student' ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000' }}>
                Find Study Groups & Tutors
              </Text>
              <Text className="text-sm" style={{ color: accountType === 'student' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#666666' }}>
                Regular student account
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-xl border-2 ${
              accountType === 'tutor' ? 'bg-accent border-accent' : isDark ? 'bg-cardDark border-gray-700' : 'bg-cardLight border-gray-300'
            }`}
            onPress={() => setAccountType('tutor')}
            disabled={loading}
          >
            <View className={`w-5 h-5 rounded-full border-2 mr-3 ${
              accountType === 'tutor' ? 'bg-white border-white' : 'border-gray-400'
            }`}>
              {accountType === 'tutor' && (
                <View className="w-3 h-3 rounded-full bg-accent self-center mt-0.5" />
              )}
            </View>
            <View>
              <Text className="font-semibold" style={{ color: accountType === 'tutor' ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000' }}>
                Offer Tutoring Services
              </Text>
              <Text className="text-sm" style={{ color: accountType === 'tutor' ? '#FFFFFF' : isDark ? '#9CA3AF' : '#666666' }}>
                Tutor account (can also join groups)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* University Picker */}
        <SearchableSelect
          label="University/Campus"
          value={university}
          placeholder="Select your university"
          modalTitle="Select University"
          searchPlaceholder="Search universities..."
          options={UNIVERSITIES.map((u) => ({ label: u, value: u }))}
          onChange={setUniversity}
          disabled={loading}
        />

        {/* Department Picker */}
        <SearchableSelect
          label="Department"
          value={department}
          placeholder="Select your department"
          modalTitle="Select Department"
          searchPlaceholder="Search departments..."
          options={COURSES.map((c) => ({ label: c, value: c }))}
          onChange={setDepartment}
          disabled={loading}
        />

        {/* Year of Study Picker */}
        <SearchableSelect
          label="Year of Study"
          value={yearOfStudy}
          placeholder="Select year"
          modalTitle="Select Year"
          searchPlaceholder="Search years..."
          options={YEAR_OF_STUDY_OPTIONS}
          onChange={setYearOfStudy}
          disabled={loading}
        />

        {/* WhatsApp Number Input */}
        <View className="mb-6">
          <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>WhatsApp Number</Text>
          <PhoneInput
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            editable={!loading}
          />
          <Text className="text-xs mt-2" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
            Used to connect you with study groups and tutors
          </Text>
        </View>

        {/* TUTOR-SPECIFIC FIELDS */}
        {accountType === 'tutor' && (
          <>
            {/* Bio */}
            <View className="mb-4">
              <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Bio</Text>
              <TextInput
                className={`px-4 py-4 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                style={{ color: isDark ? '#FFFFFF' : '#000000' }}
                placeholder="Tell students about yourself and your teaching style..."
                placeholderTextColor="#9CA3AF"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Hourly Rate */}
            <View className="mb-4">
              <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Hourly Rate (Optional)</Text>
              <TextInput
                className={`px-4 py-4 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                style={{ color: isDark ? '#FFFFFF' : '#000000' }}
                placeholder="e.g., ₦2000/hour or Free"
                placeholderTextColor="#9CA3AF"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                editable={!loading}
              />
              <Text className="text-xs mt-2" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>
                Leave blank if you tutor for free
              </Text>
            </View>

            {/* Availability */}
            <AvailabilityPicker
              days={availableDays}
              onDaysChange={setAvailableDays}
              hoursMode={hoursMode}
              onHoursModeChange={setHoursMode}
              fromTime={fromTime}
              onFromTimeChange={setFromTime}
              toTime={toTime}
              onToTimeChange={setToTime}
              isDark={isDark}
              disabled={loading}
            />
          </>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          className={`py-4 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-primary'}`}
          onPress={handleContinue}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </DismissKeyboardView>
  );
}