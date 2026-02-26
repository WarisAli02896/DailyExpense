import { getDBConnection } from './database';
import { saveUserSession, removeUserSession } from './storageService';
import { AUTH_MESSAGES } from '../messages/authMessages';

export const registerUser = async ({ username, pin, currency = 'PKR' }) => {
  try {
    const db = await getDBConnection();
    const normalizedUsername = username.trim();

    const existing = await db.getFirstAsync(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [normalizedUsername]
    );

    if (existing) {
      return { success: false, message: AUTH_MESSAGES.USERNAME_EXISTS };
    }

    const insertResult = await db.runAsync(
      'INSERT INTO users (username, pin, currency) VALUES (?, ?, ?)',
      [normalizedUsername, pin, currency]
    );

    await db.runAsync(
      'INSERT INTO persons (user_id, name, is_default, is_locked, is_active) VALUES (?, ?, 1, 1, 1)',
      [insertResult.lastInsertRowId, normalizedUsername]
    );

    return { success: true, message: AUTH_MESSAGES.REGISTER_SUCCESS };
  } catch (error) {
    console.error('Register Error:', error);
    return { success: false, message: AUTH_MESSAGES.REGISTER_FAILED };
  }
};

export const loginUser = async ({ username, pin }) => {
  try {
    const db = await getDBConnection();
    const normalizedUsername = username.trim();

    const user = await db.getFirstAsync(
      'SELECT id, username, currency FROM users WHERE LOWER(username) = LOWER(?) AND pin = ?',
      [normalizedUsername, pin]
    );

    if (!user) {
      return { success: false, message: AUTH_MESSAGES.INVALID_CREDENTIALS };
    }

    await saveUserSession(user);

    return { success: true, message: AUTH_MESSAGES.LOGIN_SUCCESS, data: user };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, message: AUTH_MESSAGES.LOGIN_FAILED };
  }
};

export const logoutUser = async () => {
  try {
    await removeUserSession();
    return { success: true, message: AUTH_MESSAGES.LOGOUT_SUCCESS };
  } catch (error) {
    console.error('Logout Error:', error);
    return { success: false, message: AUTH_MESSAGES.LOGOUT_FAILED };
  }
};

export const updateUserProfile = async (userId, { username, currency }) => {
  try {
    const db = await getDBConnection();
    const normalizedUsername = username.trim();

    const existing = await db.getFirstAsync(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
      [normalizedUsername, userId]
    );

    if (existing) {
      return { success: false, message: AUTH_MESSAGES.USERNAME_EXISTS };
    }

    await db.runAsync(
      'UPDATE users SET username = ?, currency = ? WHERE id = ?',
      [normalizedUsername, currency, userId]
    );

    await db.runAsync(
      'UPDATE persons SET name = ? WHERE user_id = ? AND is_default = 1',
      [normalizedUsername, userId]
    );

    const updatedUser = await db.getFirstAsync(
      'SELECT id, username, currency FROM users WHERE id = ?',
      [userId]
    );

    await saveUserSession(updatedUser);

    return { success: true, message: AUTH_MESSAGES.PROFILE_UPDATED, data: updatedUser };
  } catch (error) {
    console.error('Update Profile Error:', error);
    return { success: false, message: AUTH_MESSAGES.PROFILE_UPDATE_FAILED };
  }
};
