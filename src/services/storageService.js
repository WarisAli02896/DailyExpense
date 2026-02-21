import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_SESSION: '@user_session',
  APP_THEME: '@app_theme',
  APP_SETTINGS: '@app_settings',
  ONBOARDING_DONE: '@onboarding_done',
};

export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Storage Save Error:', error);
    return false;
  }
};

export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Storage Read Error:', error);
    return null;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Storage Remove Error:', error);
    return false;
  }
};

export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Storage Clear Error:', error);
    return false;
  }
};

export const saveUserSession = async (user) => saveData(KEYS.USER_SESSION, user);
export const getUserSession = async () => getData(KEYS.USER_SESSION);
export const removeUserSession = async () => removeData(KEYS.USER_SESSION);

export const saveAppSettings = async (settings) => saveData(KEYS.APP_SETTINGS, settings);
export const getAppSettings = async () => getData(KEYS.APP_SETTINGS);

export const setOnboardingDone = async () => saveData(KEYS.ONBOARDING_DONE, true);
export const isOnboardingDone = async () => getData(KEYS.ONBOARDING_DONE);

export { KEYS };
