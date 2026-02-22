import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Pressable,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Input, Dropdown, AttachmentPicker } from '../../components/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { addEntry } from '../../services/entryService';
import { addOrUpdateTemplate } from '../../services/recurringService';
import { getPersons } from '../../services/personService';
import { saveInvoice, formatFileSize, getFileType } from '../../services/fileService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateForDB, getMonthName, formatTime12h } from '../../utils/dateUtils';
import { showAlert } from '../../utils/alertUtils';

const AddExpenseScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [personOptions, setPersonOptions] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showInAccount, setShowInAccount] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

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

  const handleRemoveInvoice = () => {
    setInvoice(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!expenseName.trim()) newErrors.expenseName = 'Expense name is required';
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

      const personId = selectedPerson ? parseInt(selectedPerson, 10) : null;
      const personLabel = personOptions.find((p) => p.value === selectedPerson)?.label || '';

      const result = await addEntry({
        userId: user.id,
        type: 'spending',
        entryType: 'expense',
        title: expenseName.trim(),
        amount: parseFloat(amount),
        date: formatDateForDB(new Date()),
        personId,
        isRecurring,
        showInAccount: personId ? showInAccount : true,
        invoiceUri,
        invoiceType,
      });

      if (result.success) {
        if (isRecurring) {
          await addOrUpdateTemplate({
            userId: user.id,
            type: 'spending',
            entryType: 'expense',
            title: expenseName.trim(),
            amount: parseFloat(amount),
            companyName: personLabel || undefined,
            personId,
          });
        }
        navigation.goBack();
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      showAlert('Error', 'Failed to add expense. Please try again.');
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
          <Ionicons name="cart-outline" size={20} color={COLORS.expense} />
          <Text style={styles.badgeText}>Daily Expense</Text>
        </View>

        {/* Date/Time Info */}
        <View style={styles.dateTimeCard}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.dateTimeText}>{dateStr}</Text>
          </View>
          <View style={styles.dateTimeDivider} />
          <View style={styles.dateTimeItem}>
            <Ionicons name="time" size={16} color={COLORS.primary} />
            <Text style={styles.dateTimeText}>{timeStr}</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Expense Detail"
            value={expenseName}
            onChangeText={(text) => {
              setExpenseName(text);
              if (errors.expenseName) setErrors((prev) => ({ ...prev, expenseName: null }));
            }}
            placeholder="e.g. Lunch, Taxi, Groceries..."
            error={errors.expenseName}
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

          {/* Account (Optional) */}
          <View style={styles.accountSection}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Account (Person)</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            <Dropdown
              value={selectedPerson}
              options={personOptions}
              onSelect={(val) => {
                setSelectedPerson(val);
                if (val && !showInAccount) setShowInAccount(true);
              }}
              placeholder={personOptions.length > 0 ? 'Select an account (optional)' : 'No accounts available'}
            />
            {selectedPerson ? (
              <Pressable
                style={styles.clearAccount}
                onPress={() => { setSelectedPerson(''); setShowInAccount(false); }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
                <Text style={styles.clearAccountText}>Clear account</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Show in Account Toggle */}
          <View style={[styles.accountToggleCard, !selectedPerson && styles.accountToggleDisabled]}>
            <View style={styles.accountToggleLeft}>
              <View style={[styles.accountToggleIcon, !selectedPerson && { opacity: 0.4 }]}>
                <Ionicons name="eye-outline" size={20} color={selectedPerson ? COLORS.primary : COLORS.textLight} />
              </View>
              <View>
                <Text style={[styles.accountToggleTitle, !selectedPerson && { color: COLORS.textLight }]}>Show in Account</Text>
                <Text style={[styles.accountToggleDesc, !selectedPerson && { color: COLORS.textLight }]}>
                  {selectedPerson ? 'Visible in account profile' : 'Select an account first'}
                </Text>
              </View>
            </View>
            <Switch
              value={selectedPerson ? showInAccount : false}
              onValueChange={setShowInAccount}
              disabled={!selectedPerson}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '80' }}
              thumbColor={selectedPerson && showInAccount ? COLORS.primary : COLORS.textLight}
            />
          </View>

          {/* Picture Attachment (Optional) */}
          <View style={styles.invoiceSection}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Receipt / Picture</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            {!invoice ? (
              <Pressable
                style={({ pressed }) => [styles.invoicePickerBtn, pressed && styles.invoicePickerBtnPressed]}
                onPress={() => setPickerVisible(true)}
                role="button"
              >
                <View style={styles.invoicePickerContent}>
                  <View style={styles.invoiceIconCircle}>
                    <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
                  </View>
                  <Text style={styles.invoicePickerTitle}>Attach a picture</Text>
                  <Text style={styles.invoicePickerHint}>Camera, gallery, or document</Text>
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
        </View>

        {/* Recurring Toggle */}
        <View style={styles.recurringCard}>
          <View style={styles.recurringLeft}>
            <View style={styles.recurringIcon}>
              <Ionicons name="repeat" size={22} color={COLORS.expense} />
            </View>
            <View>
              <Text style={styles.recurringTitle}>Monthly Recurring</Text>
              <Text style={styles.recurringDesc}>Repeat this expense every month</Text>
            </View>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: COLORS.border, true: COLORS.expense + '80' }}
            thumbColor={isRecurring ? COLORS.expense : COLORS.textLight}
          />
        </View>

        {isRecurring && (
          <View style={styles.recurringNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.expense} />
            <Text style={styles.recurringNoteText}>
              This amount will be automatically added at the start of each month
            </Text>
          </View>
        )}

        {/* Submit */}
        <Button
          title="Add Expense"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>

      <AttachmentPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onFilePicked={(file) => setInvoice(file)}
        accentColor={COLORS.expense}
      />
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
    backgroundColor: COLORS.expense + '14',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.expense,
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
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
    backgroundColor: COLORS.expense,
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
  accountSection: {
    marginBottom: 16,
  },
  clearAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  clearAccountText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
  },
  accountToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  accountToggleDisabled: {
    opacity: 0.6,
  },
  accountToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  accountToggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountToggleTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 1,
  },
  accountToggleDesc: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  invoiceSection: {
    marginBottom: 16,
  },
  invoicePickerBtn: {
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  invoicePickerBtnPressed: {
    backgroundColor: COLORS.primary + '08',
  },
  invoicePickerContent: {
    alignItems: 'center',
    gap: 6,
  },
  invoiceIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '12',
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
  recurringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
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
    backgroundColor: COLORS.expense + '14',
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
    backgroundColor: COLORS.expense + '10',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  recurringNoteText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.expense,
    flex: 1,
  },
  submitBtn: {
    marginTop: 32,
    backgroundColor: COLORS.expense,
  },
});

export default AddExpenseScreen;
