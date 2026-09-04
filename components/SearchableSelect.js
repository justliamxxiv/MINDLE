import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import DismissKeyboardView from './DismissKeyboardView';

export default function SearchableSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled,
  modalTitle,
  searchPlaceholder = 'Search...',
  containerClassName = 'mb-4',
}) {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const displayLabel = options.find((o) => o.value === value)?.label || '';

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.value);
    setSearch('');
    setVisible(false);
  };

  return (
    <View className={containerClassName}>
      {label && <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>{label}</Text>}
      <TouchableOpacity
        className={`px-4 py-4 rounded-xl flex-row items-center justify-between ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={{ color: displayLabel ? (isDark ? '#FFFFFF' : '#000000') : '#9CA3AF' }}>
          {displayLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <DismissKeyboardView>
        <View className="flex-1 bg-black/40 justify-end">
          <View className={`rounded-t-3xl px-6 pt-5 pb-8 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold" style={{ color: isDark ? '#FFFFFF' : '#090F43' }}>{modalTitle || label || placeholder}</Text>
              <TouchableOpacity
                className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
                onPress={() => setVisible(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#090F43'} />
              </TouchableOpacity>
            </View>

            <TextInput
              className={`px-4 py-3 rounded-xl mb-3 ${isDark ? 'bg-cardDark' : 'bg-cardLight'}`}
              style={{ color: isDark ? '#FFFFFF' : '#000000' }}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />

            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text className="text-center py-6" style={{ color: isDark ? '#9CA3AF' : '#666666' }}>No matches found</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    className={item.value === value ? 'text-accent font-semibold' : ''}
                    style={item.value === value ? undefined : { color: isDark ? '#FFFFFF' : '#000000' }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
        </DismissKeyboardView>
      </Modal>
    </View>
  );
}
