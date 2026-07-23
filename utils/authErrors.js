// Maps Firebase Auth error codes to friendly, actionable messages.
export function friendlyAuthError(error) {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid. Please check it and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support if you think this is a mistake.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'The email or password you entered is incorrect. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in instead.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 6 characters).';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
