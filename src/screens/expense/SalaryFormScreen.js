import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Dropdown } from '../../components/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { EARNING_TYPES } from '../../constants/categories';
import { addEntry } from '../../services/entryService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateForDB } from '../../utils/dateUtils';

const SalaryFormScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [earningType, setEarningType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [amount, setAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAmountChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filtered;
    setAmount(sanitized);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!earningType) newErrors.earningType = 'Please select an earning type';
    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!amount.trim()) newErrors.amount = 'Amount is required';
    else if (parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const typeLabel = EARNING_TYPES.find((t) => t.value === earningType)?.label || earningType;

      const result = await addEntry({
        userId: user.id,
        type: 'earning',
        entryType: earningType,
        title: `${typeLabel} - ${companyName}`,
        amount: parseFloat(amount),
        companyName,
        date: formatDateForDB(new Date()),
        isRecurring,
      });

      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add entry. Please try again.');
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
        {/* Header Badge */}
        <View style={styles.badge}>
          <Ionicons name="cash-outline" size={20} color={COLORS.income} />
          <Text style={styles.badgeText}>Salary / Earning</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Dropdown
            label="Earning Type"
            value={earningType}
            options={EARNING_TYPES}
            onSelect={(val) => {
              setEarningType(val);
              if (errors.earningType) setErrors((prev) => ({ ...prev, earningType: null }));
            }}
            placeholder="Select earning type"
            error={errors.earningType}
          />

          <Input
            label="Company Name"
            value={companyName}
            onChangeText={(text) => {
              setCompanyName(text);
              if (errors.companyName) setErrors((prev) => ({ ...prev, companyName: null }));
            }}
            placeholder="Enter company name"
            error={errors.companyName}
          />

          <View style={styles.amountContainer}>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <View style={styles.currencyTag}>
                <Text style={styles.currencyText}>Rs.</Text>
              </View>
              <View style={styles.amountInputWrap}>
                <Input
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  keyboardType="numeric"
                  error={errors.amount}
                  style={styles.amountInput}
                />
              </View>
            </View>
          </View>

          {/* Recurring Toggle */}
          <View style={styles.recurringCard}>
            <View style={styles.recurringLeft}>
              <View style={styles.recurringIcon}>
                <Ionicons name="repeat" size={22} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.recurringTitle}>Monthly Recurring</Text>
                <Text style={styles.recurringDesc}>Add this amount every month automatically</Text>
              </View>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={isRecurring ? COLORS.primary : COLORS.textLight}
            />
          </View>

          {isRecurring && (
            <View style={styles.recurringNote}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
              <Text style={styles.recurringNoteText}>
                This amount will be automatically added at the start of each month
              </Text>
            </View>
          )}
        </View>

        {/* Submit */}
        <Button
          title="Add Salary Entry"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
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
    padding: 24,
    paddingBottom: 40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.income + '14',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
  },
  badgeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.income,
  },
  form: {
    gap: 0,
  },
  inputLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginBottom: 6,
  },
  amountContainer: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  currencyTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 0,
  },
  currencyText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  amountInputWrap: {
    flex: 1,
  },
  amountInput: {
    marginBottom: 0,
  },
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  recurringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  recurringIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recurringTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  recurringDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    maxWidth: 180,
  },
  recurringNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '10',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  recurringNoteText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.info,
    flex: 1,
  },
  submitBtn: {
    marginTop: 32,
  },
});

export default SalaryFormScreen;
