import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Input, Dropdown } from '../../components/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { addEntry } from '../../services/entryService';
import { addOrUpdateTemplate } from '../../services/recurringService';
import { getPersons } from '../../services/personService';
import { pickInvoice, saveInvoice, formatFileSize, getFileType } from '../../services/fileService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateForDB, getMonthName, formatTime12h } from '../../utils/dateUtils';
import { showAlert } from '../../utils/alertUtils';

const INVEST_COLOR = '#7C4DFF';

const InvestmentFormScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [investmentName, setInvestmentName] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [personOptions, setPersonOptions] = useState([]);
  const [amount, setAmount] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadPersons = async () => {
        if (!user) return;
        const result = await getPersons(user.id);
        if (result.success) {
          setPersonOptions(result.data.map((p) => ({ value: String(p.id), label: p.name })));
        }
      };
      loadPersons();
    }, [user])
  );

  const now = new Date();
  const currentMonthName = getMonthName(now.getMonth() + 1);
  const currentYear = now.getFullYear();
  const dateStr = `${String(now.getDate()).padStart(2, '0')} ${currentMonthName} ${currentYear}`;
  const timeStr = formatTime12h(now.toISOString());

  const handleAmountChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filtered;
    setAmount(sanitized);
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
  };

  const handlePickInvoice = async () => {
    const result = await pickInvoice();
    if (result.success) {
      setInvoice(result.file);
    } else if (!result.canceled) {
      showAlert('Error', result.message || 'Could not pick file.');
    }
  };

  const handleRemoveInvoice = () => {
    setInvoice(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedPerson) newErrors.person = 'Please select an account';
    if (!investmentName.trim()) newErrors.investmentName = 'Investment name is required';
    if (!amount.trim()) newErrors.amount = 'Amount is required';
    else if (parseFloat(amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      let invoiceUri = null;
      let invoiceType = null;
      if (invoice) {
        invoiceUri = await saveInvoice(invoice.uri, invoice.name);
        invoiceType = invoice.mimeType || null;
      }

      const personLabel = personOptions.find((p) => p.value === selectedPerson)?.label || '';
      const entryTitle = `${investmentName.trim()} — ${personLabel}`;

      const result = await addEntry({
        userId: user.id,
        type: 'spending',
        entryType: 'investment',
        title: entryTitle,
        amount: parseFloat(amount),
        date: formatDateForDB(new Date()),
        personId: parseInt(selectedPerson, 10),
        isRecurring,
        invoiceUri,
        invoiceType,
      });

      if (result.success) {
        if (isRecurring) {
          await addOrUpdateTemplate({
            userId: user.id,
            type: 'spending',
            entryType: 'investment',
            title: entryTitle,
            amount: parseFloat(amount),
            companyName: personLabel,
          });
        }
        navigation.goBack();
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      showAlert('Error', 'Failed to add investment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fileType = invoice ? getFileType(invoice.mimeType) : null;

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
        {/* Month Banner */}
        <View style={styles.monthBanner}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.monthBannerText}>{currentMonthName} {currentYear}</Text>
        </View>

        {/* Header Badge */}
        <View style={styles.badge}>
          <Ionicons name="trending-up-outline" size={20} color={INVEST_COLOR} />
          <Text style={styles.badgeText}>Investment</Text>
        </View>

        {/* Date/Time Info */}
        <View style={styles.dateTimeCard}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar" size={16} color={INVEST_COLOR} />
            <Text style={styles.dateTimeText}>{dateStr}</Text>
          </View>
          <View style={styles.dateTimeDivider} />
          <View style={styles.dateTimeItem}>
            <Ionicons name="time" size={16} color={INVEST_COLOR} />
            <Text style={styles.dateTimeText}>{timeStr}</Text>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={16} color={INVEST_COLOR} />
          <Text style={styles.infoNoteText}>
            Investment is money saved aside — it will be deducted from your available balance
          </Text>
        </View>

        {/* Manage Accounts Link */}
        <Pressable
          style={({ pressed }) => [styles.accountsLink, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate('Accounts')}
          role="button"
        >
          <Ionicons name="people-outline" size={18} color={INVEST_COLOR} />
          <Text style={styles.accountsLinkText}>Manage Accounts</Text>
          <Ionicons name="chevron-forward" size={16} color={INVEST_COLOR} />
        </Pressable>

        {/* Form */}
        <View style={styles.form}>
          {personOptions.length > 0 ? (
            <Dropdown
              label="Account (Person)"
              value={selectedPerson}
              options={personOptions}
              onSelect={(val) => {
                setSelectedPerson(val);
                if (errors.person) setErrors((prev) => ({ ...prev, person: null }));
              }}
              placeholder="Select a person / account"
              error={errors.person}
            />
          ) : (
            <Pressable
              style={({ pressed }) => [styles.noAccountsCard, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.navigate('Accounts')}
              role="button"
            >
              <Ionicons name="alert-circle-outline" size={20} color={INVEST_COLOR} />
              <View style={styles.noAccountsContent}>
                <Text style={styles.noAccountsTitle}>No accounts found</Text>
                <Text style={styles.noAccountsHint}>Tap to add a person / account first</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={INVEST_COLOR} />
            </Pressable>
          )}

          <Input
            label="Investment Name"
            value={investmentName}
            onChangeText={(text) => {
              setInvestmentName(text);
              if (errors.investmentName) setErrors((prev) => ({ ...prev, investmentName: null }));
            }}
            placeholder="e.g. Gold, Stocks, Savings Account..."
            error={errors.investmentName}
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

          {/* Picture Attachment (Optional) */}
          <View style={styles.invoiceSection}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Receipt / Proof</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            {!invoice ? (
              <Pressable
                style={({ pressed }) => [styles.invoicePickerBtn, pressed && styles.invoicePickerBtnPressed]}
                onPress={handlePickInvoice}
                role="button"
              >
                <View style={styles.invoicePickerContent}>
                  <View style={styles.invoiceIconCircle}>
                    <Ionicons name="camera-outline" size={28} color={INVEST_COLOR} />
                  </View>
                  <Text style={styles.invoicePickerTitle}>Attach a picture</Text>
                  <Text style={styles.invoicePickerHint}>Screenshot, receipt, or document</Text>
                </View>
              </Pressable>
            ) : (
              <View style={styles.invoicePreview}>
                <View style={styles.invoicePreviewLeft}>
                  {fileType === 'image' ? (
                    <Image source={{ uri: invoice.uri }} style={styles.invoiceThumbnail} />
                  ) : (
                    <View style={[styles.invoiceFileIcon, fileType === 'pdf' ? styles.pdfBg : styles.docBg]}>
                      <Ionicons
                        name={fileType === 'pdf' ? 'document-text' : 'document'}
                        size={24}
                        color={COLORS.textWhite}
                      />
                    </View>
                  )}
                  <View style={styles.invoiceInfo}>
                    <Text style={styles.invoiceFileName} numberOfLines={1}>{invoice.name}</Text>
                    <Text style={styles.invoiceFileSize}>
                      {formatFileSize(invoice.size)} {fileType === 'pdf' ? '· PDF' : fileType === 'doc' ? '· DOC' : '· Image'}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.removeInvoiceBtn, pressed && { opacity: 0.6 }]}
                  onPress={handleRemoveInvoice}
                  role="button"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.danger} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Recurring Toggle */}
          <View style={styles.recurringCard}>
            <View style={styles.recurringLeft}>
              <View style={styles.recurringIcon}>
                <Ionicons name="repeat" size={22} color={INVEST_COLOR} />
              </View>
              <View>
                <Text style={styles.recurringTitle}>Monthly Recurring</Text>
                <Text style={styles.recurringDesc}>Repeat this investment every month</Text>
              </View>
            </View>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: COLORS.border, true: INVEST_COLOR + '80' }}
              thumbColor={isRecurring ? INVEST_COLOR : COLORS.textLight}
            />
          </View>

          {isRecurring && (
            <View style={styles.recurringNote}>
              <Ionicons name="information-circle-outline" size={16} color={INVEST_COLOR} />
              <Text style={styles.recurringNoteText}>
                This amount will be automatically added at the start of each month
              </Text>
            </View>
          )}
        </View>

        {/* Submit */}
        <Button
          title="Add Investment"
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
  monthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  monthBannerText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.primary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: INVEST_COLOR + '14',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: INVEST_COLOR,
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  dateTimeDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  dateTimeText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INVEST_COLOR + '10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 24,
    gap: 8,
  },
  infoNoteText: {
    fontSize: FONTS.sizes.sm,
    color: INVEST_COLOR,
    flex: 1,
  },
  accountsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INVEST_COLOR + '08',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: INVEST_COLOR + '20',
  },
  accountsLinkText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: INVEST_COLOR,
    flex: 1,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  optionalTag: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontStyle: 'italic',
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
    backgroundColor: INVEST_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 12,
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
  invoiceSection: {
    marginBottom: 16,
  },
  invoicePickerBtn: {
    borderWidth: 2,
    borderColor: INVEST_COLOR + '30',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  invoicePickerBtnPressed: {
    backgroundColor: INVEST_COLOR + '08',
  },
  invoicePickerContent: {
    alignItems: 'center',
    gap: 6,
  },
  invoiceIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: INVEST_COLOR + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoicePickerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  invoicePickerHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  invoicePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  invoicePreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  invoiceThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
  },
  invoiceFileIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfBg: {
    backgroundColor: '#E53935',
  },
  docBg: {
    backgroundColor: '#1565C0',
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceFileName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  invoiceFileSize: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  removeInvoiceBtn: {
    padding: 4,
  },
  noAccountsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: INVEST_COLOR + '08',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: INVEST_COLOR + '40',
  },
  noAccountsContent: {
    flex: 1,
  },
  noAccountsTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: INVEST_COLOR,
  },
  noAccountsHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    backgroundColor: INVEST_COLOR + '14',
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
    backgroundColor: INVEST_COLOR + '10',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  recurringNoteText: {
    fontSize: FONTS.sizes.sm,
    color: INVEST_COLOR,
    flex: 1,
  },
  submitBtn: {
    marginTop: 32,
    backgroundColor: INVEST_COLOR,
  },
});

export default InvestmentFormScreen;
