import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../../components/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { loginUser } from '../../services/authService';
import { validateLoginForm } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { showAlert } from '../../utils/alertUtils';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleUsernameChange = (text) => {
    const filtered = text.replace(/[^a-zA-Z]/g, '');
    if (filtered.length <= 16) {
      setUsername(filtered);
      if (errors.username) setErrors((prev) => ({ ...prev, username: null }));
    }
  };

  const handlePinChange = (text) => {
    const filtered = text.replace(/[^0-9]/g, '');
    if (filtered.length <= 6) {
      setPin(filtered);
      if (errors.pin) setErrors((prev) => ({ ...prev, pin: null }));
    }
  };

  const handleLogin = async () => {
    const validation = validateLoginForm({ username, pin });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ username, pin });

      if (result.success) {
        login(result.data);
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      showAlert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet" size={48} color={COLORS.textWhite} />
          </View>
          <Text style={styles.appName}>Daily Expense</Text>
          <Text style={styles.subtitle}>Welcome back! Login to continue</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Login</Text>

          <Input
            label="Username"
            value={username}
            onChangeText={handleUsernameChange}
            placeholder="Enter your username"
            error={errors.username}
            maxLength={16}
            autoCapitalize="words"
          />

          <Input
            label="PIN Code"
            value={pin}
            onChangeText={handlePinChange}
            placeholder="Enter your 6-digit PIN"
            error={errors.pin}
            keyboardType="numeric"
            secureTextEntry
            maxLength={6}
          />

          <View style={styles.pinDots}>
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < pin.length && styles.dotFilled,
                ]}
              />
            ))}
          </View>

          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text
              style={styles.linkText}
              onPress={() => navigation.navigate('Register')}
            >
              Sign Up
            </Text>
          </View>
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
    flexGrow: 1,
  },
  headerSection: {
    backgroundColor: COLORS.primary,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: FONTS.sizes.title,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONTS.sizes.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  formTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: 24,
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: -8,
    marginBottom: 24,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  loginButton: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semiBold,
  },
});

export default LoginScreen;
