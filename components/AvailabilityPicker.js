import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../utils/academicOptions';
import SearchableSelect from './SearchableSelect';

export default function AvailabilityPicker({
  days,
  onDaysChange,
  hoursMode,
  onHoursModeChange,
  fromTime,
  onFromTimeChange,
  toTime,
  onToTimeChange,
  isDark,
  disabled,
  showHours = true,
}) {
  const toggleDay = (day) => {
    onDaysChange(days.includes(day) ? days.filter((d) => d !== day) : [...days, day]);
  };

  return (
    <>
      <View className={showHours ? 'mb-4' : ''}>
        <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Available Days</Text>
        <View className="flex-row justify-between">
          {DAYS_OF_WEEK.map((day) => (
            <TouchableOpacity
              key={day}
              onPress={() => toggleDay(day)}
              disabled={disabled}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: days.includes(day) ? '#FF3131' : (isDark ? '#2A2A2A' : '#F3F4F6'),
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: days.includes(day) ? '#FFFFFF' : (isDark ? '#9CA3AF' : '#6B7280') }}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showHours && (
        <View className="mb-6">
          <Text className="mb-2 font-medium" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Hours</Text>

          <HoursOption
            label="Always free"
            subtitle="Available anytime on your selected days"
            selected={hoursMode === 'always'}
            onPress={() => onHoursModeChange('always')}
            isDark={isDark}
            disabled={disabled}
          />
          <HoursOption
            label="Free for selected hours"
            subtitle="Set a specific time window"
            selected={hoursMode === 'selected'}
            onPress={() => onHoursModeChange('selected')}
            isDark={isDark}
            disabled={disabled}
          />
          {hoursMode === 'selected' && (
            <View className="flex-row mb-3" style={{ gap: 12 }}>
              <View className="flex-1">
                <SearchableSelect
                  label="From"
                  value={fromTime}
                  placeholder="Start time"
                  modalTitle="Select Start Time"
                  searchPlaceholder="Search times..."
                  options={TIME_SLOTS}
                  onChange={onFromTimeChange}
                  disabled={disabled}
                  containerClassName=""
                />
              </View>
              <View className="flex-1">
                <SearchableSelect
                  label="To"
                  value={toTime}
                  placeholder="End time"
                  modalTitle="Select End Time"
                  searchPlaceholder="Search times..."
                  options={TIME_SLOTS}
                  onChange={onToTimeChange}
                  disabled={disabled}
                  containerClassName=""
                />
              </View>
            </View>
          )}
          <HoursOption
            label="By appointment only"
            subtitle="Students must request a time that works for you"
            selected={hoursMode === 'appointment'}
            onPress={() => onHoursModeChange('appointment')}
            isDark={isDark}
            disabled={disabled}
          />
        </View>
      )}
    </>
  );
}

function HoursOption({ label, subtitle, selected, onPress, isDark, disabled }) {
  return (
    <TouchableOpacity
      className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${
        selected ? 'bg-accent border-accent' : isDark ? 'bg-cardDark border-gray-700' : 'bg-cardLight border-gray-300'
      }`}
      onPress={onPress}
      disabled={disabled}
    >
      <View className={`w-5 h-5 rounded-full border-2 mr-3 ${selected ? 'bg-white border-white' : 'border-gray-400'}`}>
        {selected && <View className="w-3 h-3 rounded-full bg-accent self-center mt-0.5" />}
      </View>
      <View className="flex-1">
        <Text className="font-semibold" style={{ color: selected ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000' }}>
          {label}
        </Text>
        <Text className="text-sm" style={{ color: selected ? '#FFFFFF' : isDark ? '#9CA3AF' : '#666666' }}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
