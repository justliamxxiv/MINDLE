import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Picker } from '@react-native-picker/picker';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

const NIGERIAN_UNIVERSITIES = [
  'Adeleke University',
  'Ahmadu Bello University',
  'Babcock University',
  'Covenant University',
  'Federal University of Technology, Akure',
  'Federal University of Technology, Minna',
  'Lagos State University',
  'Obafemi Awolowo University',
  'University of Benin',
  'University of Ibadan',
  'University of Ilorin',
  'University of Jos',
  'University of Lagos',
  'University of Nigeria, Nsukka',
  'University of Port Harcourt',
].sort();

export default function ProfileSetupScreen({ navigation, route }) {
  const userName = route?.params?.userName || '';
  
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [accountType, setAccountType] = useState('student');
  
  // Tutor-specific fields
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [availability, setAvailability] = useState('');
  
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

    // Tutor-specific validation
    if (accountType === 'tutor') {
      if (!bio.trim()) {
        Alert.alert('Error', 'Please write a short bio about yourself');
        return;
      }
      if (!availability.trim()) {
        Alert.alert('Error', 'Please specify your availability');
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
        email: user.email,
        name: userName,
        university: university,
        department: department.trim(),
        yearOfStudy: yearOfStudy,
        whatsappNumber: whatsappNumber.trim(),
        accountType: accountType,
        profileCompleted: true,
        createdAt: new Date().toISOString(),
      };

      // Add tutor-specific fields if tutor
      if (accountType === 'tutor') {
        profileData.bio = bio.trim();
        profileData.hourlyRate = hourlyRate.trim();
        profileData.availability = availability.trim();
        profileData.rating = 0;
        profileData.reviewsCount = 0;
      }

      // Save profile data to Firestore
      await setDoc(doc(db, 'users', user.uid), profileData);

      // Navigate to Main App
      navigation.replace('MainApp');
      
    } catch (error) {
      console.error('Profile setup error:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-8 pt-16 pb-8">
        <StatusBar style="dark" />
        
        {/* Header */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-primary mb-2">Complete Your Profile</Text>
          <Text className="text-textSecondary text-lg">
            Help us personalize your experience
          </Text>
        </View>

        {/* Account Type Selection - MOVED TO TOP */}
        <View className="mb-8">
          <Text className="text-textPrimary mb-3 font-medium text-lg">I want to:</Text>
          
          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${
              accountType === 'student' ? 'bg-accent border-accent' : 'bg-cardLight border-gray-300'
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
              <Text className={`font-semibold ${accountType === 'student' ? 'text-white' : 'text-textPrimary'}`}>
                Find Study Groups & Tutors
              </Text>
              <Text className={`text-sm ${accountType === 'student' ? 'text-white' : 'text-textSecondary'}`}>
                Regular student account
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center p-4 rounded-xl border-2 ${
              accountType === 'tutor' ? 'bg-accent border-accent' : 'bg-cardLight border-gray-300'
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
              <Text className={`font-semibold ${accountType === 'tutor' ? 'text-white' : 'text-textPrimary'}`}>
                Offer Tutoring Services
              </Text>
              <Text className={`text-sm ${accountType === 'tutor' ? 'text-white' : 'text-textSecondary'}`}>
                Tutor account (can also join groups)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* University Picker */}
        <View className="mb-4">
          <Text className="text-textPrimary mb-2 font-medium">University/Campus</Text>
          <View className="bg-cardLight rounded-xl overflow-hidden">
            <Picker
              selectedValue={university}
              onValueChange={(itemValue) => setUniversity(itemValue)}
              enabled={!loading}
            >
              <Picker.Item label="Select your university" value="" />
              {NIGERIAN_UNIVERSITIES.map((uni) => (
                <Picker.Item key={uni} label={uni} value={uni} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Department Input */}
        <View className="mb-4">
          <Text className="text-textPrimary mb-2 font-medium">Department</Text>
          <TextInput
            className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
            placeholder="e.g., Computer Science"
            value={department}
            onChangeText={setDepartment}
            editable={!loading}
          />
        </View>

        {/* Year of Study Picker */}
        <View className="mb-4">
          <Text className="text-textPrimary mb-2 font-medium">Year of Study</Text>
          <View className="bg-cardLight rounded-xl overflow-hidden">
            <Picker
              selectedValue={yearOfStudy}
              onValueChange={(itemValue) => setYearOfStudy(itemValue)}
              enabled={!loading}
            >
              <Picker.Item label="Select year" value="" />
              <Picker.Item label="100 Level (Freshman)" value="100" />
              <Picker.Item label="200 Level (Sophomore)" value="200" />
              <Picker.Item label="300 Level (Junior)" value="300" />
              <Picker.Item label="400 Level (Senior)" value="400" />
              <Picker.Item label="500 Level (Final Year)" value="500" />
              <Picker.Item label="Graduate/Masters" value="graduate" />
            </Picker>
          </View>
        </View>

        {/* WhatsApp Number Input */}
        <View className="mb-6">
          <Text className="text-textPrimary mb-2 font-medium">WhatsApp Number</Text>
          <TextInput
            className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
            placeholder="+234 XXX XXX XXXX"
            value={whatsappNumber}
            onChangeText={setWhatsappNumber}
            keyboardType="phone-pad"
            editable={!loading}
          />
          <Text className="text-textSecondary text-xs mt-2">
            Used to connect you with study groups and tutors
          </Text>
        </View>

        {/* TUTOR-SPECIFIC FIELDS */}
        {accountType === 'tutor' && (
          <>
            {/* Bio */}
            <View className="mb-4">
              <Text className="text-textPrimary mb-2 font-medium">Bio</Text>
              <TextInput
                className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
                placeholder="Tell students about yourself and your teaching style..."
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
              <Text className="text-textPrimary mb-2 font-medium">Hourly Rate (Optional)</Text>
              <TextInput
                className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
                placeholder="e.g., ₦2000/hour or Free"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                editable={!loading}
              />
              <Text className="text-textSecondary text-xs mt-2">
                Leave blank if you tutor for free
              </Text>
            </View>

            {/* Availability */}
            <View className="mb-6">
              <Text className="text-textPrimary mb-2 font-medium">Availability</Text>
              <TextInput
                className="bg-cardLight px-4 py-4 rounded-xl text-textPrimary"
                placeholder="e.g., Weekdays 4pm-8pm, Weekends anytime"
                value={availability}
                onChangeText={setAvailability}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          className="bg-primary py-4 rounded-xl"
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
  );
}