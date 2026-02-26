import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/authService';
import { validateUsername } from '../../utils/validators';
import { showAlert } from '../../utils/alertUtils';

const ProfileScreen = () => {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUsernameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z]/g, '');
    if (filtered.length <= 16) {
      setUsername(filtered);
      if (error) setError('');
    }
  };

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Username is required.');
      return;
    }
    if (!validateUsername(trimmed)) {
      setError('Only letters allowed, max 16 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserProfile(user.id, {
        username: trimmed,
        currency: user.currency,
      });
      if (result.success) {
        updateUser(result.data);
        showAlert('Success', result.message);
      } else {
        showAlert('Error', result.message);
      }
    } catch (err) {
      showAlert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>My Profile</Text>
            <Text style={styles.subtitle}>Update your account name</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Input
            label="Username"
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="Enter your name"
            error={error}
            maxLength={16}
            autoCapitalize="words"
          />
          <Text style={styles.charCount}>{username.length}/16</Text>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
  },
  charCount: {
    textAlign: 'right',
    marginTop: -10,
    marginBottom: 8,
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default ProfileScreen;
