import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../services/authService';
import { showAlert, showConfirm } from '../../utils/alertUtils';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to logout?', async () => {
      setLoading(true);
      try {
        const result = await logoutUser();
        if (result.success) {
          logout();
        } else {
          showAlert('Error', result.message);
        }
      } catch (error) {
        showAlert('Error', 'Logout failed. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="settings-outline" size={22} color={COLORS.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              {user?.username ? `Logged in as ${user.username}` : 'Manage your account preferences'}
            </Text>
          </View>
        </View>

        <Button
          title="Edit Profile"
          onPress={() => navigation.navigate('Profile')}
          variant="outline"
          style={styles.profileButton}
        />

        <Button
          title="Logout"
          onPress={handleLogout}
          loading={loading}
          variant="danger"
          style={styles.logoutButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
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
  logoutButton: {
    marginTop: 4,
  },
  profileButton: {
    marginBottom: 10,
  },
});

export default SettingsScreen;
