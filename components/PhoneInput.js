import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const COUNTRY_CODE = '+234';

function localDigits(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.startsWith('234')) return digits.slice(3);
  if (digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export default function PhoneInput({
  value,
  onChangeText,
  placeholder = '803 123 4567',
  editable = true,
  containerClassName = '',
}) {
  const { isDark } = useTheme();

  const handleChangeText = (text) => {
    onChangeText(COUNTRY_CODE + text.replace(/\D/g, ''));
  };

  return (
    <View className={`flex-row ${containerClassName}`} style={{ gap: 8 }}>
      <View className={`px-4 py-4 rounded-xl items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}>
        <Text className="font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>{COUNTRY_CODE}</Text>
      </View>
      <TextInput
        className={`px-4 py-4 rounded-xl flex-1 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
        style={{ color: isDark ? '#FFFFFF' : '#000000' }}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={localDigits(value)}
        onChangeText={handleChangeText}
        keyboardType="phone-pad"
        editable={editable}
      />
    </View>
  );
}
