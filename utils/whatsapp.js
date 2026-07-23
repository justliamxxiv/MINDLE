import { Alert, Linking } from 'react-native';

// Normalizes a phone number to international digits for storage/comparison.
// Accepts local Nigerian numbers (0803...) or international (+234 803...).
// '+234 803 123 4567' and '08031234567' both become '2348031234567'.
export function normalizePhone(number) {
  let digits = (number || '').replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '234' + digits.slice(1);
  }
  return digits;
}

// Opens a WhatsApp chat with the given number.
export function openWhatsApp(number) {
  const digits = normalizePhone(number);
  if (!digits) {
    Alert.alert('No number', 'This user has not added a WhatsApp number.');
    return;
  }
  Linking.openURL(`https://wa.me/${digits}`).catch(() =>
    Alert.alert('Error', 'Could not open WhatsApp.')
  );
}
