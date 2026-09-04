import React from 'react';
import { KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';

// Wrap a screen's (or modal's) root element with this to get standard
// form-friendly keyboard behavior: the content shifts up so the focused
// field isn't hidden behind the keyboard, and tapping anywhere outside an
// input dismisses it. Takes exactly one child — the screen's existing root.
export default function DismissKeyboardView({ children }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        {children}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
