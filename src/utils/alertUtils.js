import { Alert, Platform } from 'react-native';
import { emitSnackbar } from '../services/snackbarService';

const inferType = (title) => {
  const value = String(title || '').toLowerCase();
  if (value.includes('error') || value.includes('failed')) return 'error';
  if (value.includes('success')) return 'success';
  if (value.includes('warning')) return 'warning';
  return 'info';
};

export const showAlert = (title, message) => {
  const handledBySnackbar = emitSnackbar({
    title,
    message,
    type: inferType(title),
  });

  if (!handledBySnackbar) {
    if (Platform.OS === 'web') {
      window.alert(message ? `${title}\n\n${message}` : title);
    } else {
      Alert.alert(title, message);
    }
  }
};

export const showConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    if (confirmed) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', style: 'destructive', onPress: onConfirm },
    ]);
  }
};
