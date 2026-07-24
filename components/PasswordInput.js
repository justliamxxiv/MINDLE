import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const REVEAL_DURATION_MS = 800;

export default function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  containerClassName = 'mb-6',
}) {
  const { isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [typingReveal, setTypingReveal] = useState(false);
  const revealTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, []);

  const handleChangeText = (text) => {
    onChangeText(text);
    setTypingReveal(true);
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    revealTimeout.current = setTimeout(() => setTypingReveal(false), REVEAL_DURATION_MS);
  };

  return (
    <View className={containerClassName}>
      {label && <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>{label}</Text>}
      <View className="relative justify-center">
        <TextInput
          className={`px-4 py-4 pr-12 rounded-xl ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
          style={{ color: isDark ? '#FFFFFF' : '#000000' }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={handleChangeText}
          secureTextEntry={!(showPassword || typingReveal)}
          editable={editable}
        />
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={{ position: 'absolute', right: 12, height: '100%', justifyContent: 'center', paddingHorizontal: 8 }}
          disabled={!editable}
        >
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={isDark ? '#9CA3AF' : '#666666'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
