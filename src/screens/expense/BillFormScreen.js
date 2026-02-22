import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Dropdown, AttachmentPicker } from '../../components/common';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { BILL_TYPES } from '../../constants/categories';
import { addEntry } from '../../services/entryService';
import { saveInvoice, formatFileSize, getFileType } from '../../services/fileService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateForDB, getMonthName, formatTime12h } from '../../utils/dateUtils';
import { showAlert } from '../../utils/alertUtils';

const BILL_COLOR = '#FF9800';

const BILL_OPTIONS = BILL_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
  icon: t.icon,
}));

const BillFormScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedBill, setSelectedBill] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [billPicture, setBillPicture] = useState(null);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null);

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

  const openPicker = (target) => setPickerTarget(target);

  const handleFilePicked = (file) => {
    if (pickerTarget === 'bill') setBillPicture(file);
    else if (pickerTarget === 'receipt') setPaymentReceipt(file);
  };

  const validate = () => {
    const newErrors = {};
    if (!selectedBill) newErrors.bill = 'Please select a bill type';
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
      if (billPicture) {
        invoiceUri = await saveInvoice(billPicture.uri, billPicture.name);
        invoiceType = billPicture.mimeType || null;
      }

      let invoiceUri2 = null;
      let invoiceType2 = null;
      if (paymentReceipt) {
        invoiceUri2 = await saveInvoice(paymentReceipt.uri, paymentReceipt.name);
        invoiceType2 = paymentReceipt.mimeType || null;
      }

      const billLabel = BILL_TYPES.find((b) => b.value === selectedBill)?.label || selectedBill;

      const result = await addEntry({
        userId: user.id,
        type: 'spending',
        entryType: 'bills',
        title: `${billLabel} Bill`,
        amount: parseFloat(amount),
        notes: notes.trim() || null,
        date: formatDateForDB(new Date()),
        invoiceUri,
        invoiceType,
        invoiceUri2,
        invoiceType2,
      });

      if (result.success) {
        navigation.goBack();
      } else {
        showAlert('Error', result.message);
      }
    } catch (error) {
      showAlert('Error', 'Failed to add bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFilePreview = (file, onRemove, label) => {
    const fileType = file ? getFileType(file.mimeType) : null;
    return (
      <View style={styles.filePreview}>
        <View style={styles.filePreviewLeft}>
          {fileType === 'image' ? (
            <Image source={{ uri: file.uri }} style={styles.fileThumbnail} />
          ) : (
            <View style={[styles.fileIcon, fileType === 'pdf' ? styles.pdfBg : styles.docBg]}>
              <Ionicons
                name={fileType === 'pdf' ? 'document-text' : 'document'}
                size={22}
                color={COLORS.textWhite}
              />
            </View>
          )}
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.fileSize}>
              {formatFileSize(file.size)} · {label}
            </Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.fileRemoveBtn, pressed && { opacity: 0.6 }]}
          onPress={onRemove}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={22} color={COLORS.danger} />
        </Pressable>
      </View>
    );
  };

  const renderFilePicker = (label, icon, onPress) => (
    <Pressable
      style={({ pressed }) => [styles.filePickerBtn, pressed && styles.filePickerBtnPressed]}
      onPress={onPress}
    >
      <View style={styles.filePickerContent}>
        <View style={styles.filePickerIconCircle}>
          <Ionicons name={icon} size={24} color={BILL_COLOR} />
        </View>
        <View>
          <Text style={styles.filePickerTitle}>{label}</Text>
          <Text style={styles.filePickerHint}>Photo, PDF, or document</Text>
        </View>
      </View>
    </Pressable>
  );

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
        <View style={styles.monthBanner}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
          <Text style={styles.monthBannerText}>{currentMonthName} {currentYear}</Text>
        </View>

        <View style={styles.badge}>
          <Ionicons name="flash-outline" size={20} color={BILL_COLOR} />
          <Text style={styles.badgeText}>Bill Payment</Text>
        </View>

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

        <View style={styles.form}>
          <Dropdown
            label="Bill Type"
            value={selectedBill}
            options={BILL_OPTIONS}
            onSelect={(val) => {
              setSelectedBill(val);
              if (errors.bill) setErrors((prev) => ({ ...prev, bill: null }));
            }}
            placeholder="Select bill type"
            error={errors.bill}
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

          <Input
            label="Note"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note (optional)"
            multiline
            numberOfLines={3}
            style={styles.noteInput}
          />

          {/* Bill Picture */}
          <View style={styles.invoiceSection}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Bill Picture</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            {!billPicture
              ? renderFilePicker('Attach bill picture', 'image-outline', () => openPicker('bill'))
              : renderFilePreview(billPicture, () => setBillPicture(null), 'Bill')
            }
          </View>

          {/* Payment Receipt */}
          <View style={styles.invoiceSection}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Payment Receipt</Text>
              <Text style={styles.optionalTag}>Optional</Text>
            </View>
            {!paymentReceipt
              ? renderFilePicker('Attach payment receipt', 'receipt-outline', () => openPicker('receipt'))
              : renderFilePreview(paymentReceipt, () => setPaymentReceipt(null), 'Receipt')
            }
          </View>
        </View>

        <Button
          title="Add Bill"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>

      <AttachmentPicker
        visible={!!pickerTarget}
        onClose={() => setPickerTarget(null)}
        onFilePicked={handleFilePicked}
        accentColor={BILL_COLOR}
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
    backgroundColor: BILL_COLOR + '14',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: BILL_COLOR,
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
    backgroundColor: BILL_COLOR,
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
  noteInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  invoiceSection: {
    marginBottom: 16,
  },
  filePickerBtn: {
    borderWidth: 2,
    borderColor: BILL_COLOR + '30',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 18,
    backgroundColor: COLORS.surface,
  },
  filePickerBtnPressed: {
    backgroundColor: BILL_COLOR + '08',
  },
  filePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  filePickerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BILL_COLOR + '14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePickerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  filePickerHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  filePreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileThumbnail: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
  },
  fileIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfBg: { backgroundColor: '#E53935' },
  docBg: { backgroundColor: '#1565C0' },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  fileRemoveBtn: {
    padding: 4,
  },
  submitBtn: {
    marginTop: 32,
    backgroundColor: BILL_COLOR,
  },
});

export default BillFormScreen;
