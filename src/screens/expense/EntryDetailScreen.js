import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { formatAmount } from '../../utils/currencyUtils';
import { getMonthName } from '../../utils/dateUtils';
import { deleteEntry } from '../../services/entryService';
import { Button } from '../../components/common';

const EntryDetailScreen = ({ route, navigation }) => {
  const { entry } = route.params;
  const [deleting, setDeleting] = useState(false);

  const isEarning = entry.type === 'earning';
  const entryDate = new Date(entry.date);
  const dateDisplay = `${String(entryDate.getDate()).padStart(2, '0')} ${getMonthName(entryDate.getMonth() + 1)} ${entryDate.getFullYear()}`;

  const hasInvoice = !!entry.invoice_uri;
  const mime = (entry.invoice_type || '').toLowerCase();
  const invoiceIsImage = hasInvoice && mime.startsWith('image/');

  const getDocInfo = () => {
    if (!hasInvoice || invoiceIsImage) return null;
    if (mime.includes('pdf')) {
      return { label: 'PDF Document', icon: 'document-text', color: '#E53935' };
    }
    if (mime.includes('word') || mime.includes('document') || mime.includes('msword')) {
      return { label: 'Word Document', icon: 'document', color: '#1565C0' };
    }
    return { label: 'Document', icon: 'document-attach', color: COLORS.textSecondary };
  };

  const docInfo = getDocInfo();

  const getFileName = () => {
    const uriName = entry.invoice_uri?.split('/').pop();
    if (uriName && !uriName.startsWith('blob:')) return uriName;
    const ext = mime.split('/').pop() || 'file';
    return `invoice_${entry.id}.${ext === 'jpeg' ? 'jpg' : ext}`;
  };

  const handleDownload = async () => {
    try {
      if (Platform.OS === 'web') {
        const a = document.createElement('a');
        a.href = entry.invoice_uri;
        a.download = getFileName();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(entry.invoice_uri, {
            mimeType: entry.invoice_type || 'application/octet-stream',
            dialogTitle: 'Save Invoice',
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not download file. The file may no longer be available.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const result = await deleteEntry(entry.id);
            if (result.success) {
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete entry.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Type Badge */}
      <View style={[styles.typeBadge, isEarning ? styles.earningBadge : styles.spendingBadge]}>
        <Ionicons
          name={isEarning ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={20}
          color={isEarning ? COLORS.income : COLORS.expense}
        />
        <Text style={[styles.typeBadgeText, { color: isEarning ? COLORS.income : COLORS.expense }]}>
          {isEarning ? 'Earning' : 'Spending'}
        </Text>
      </View>

      {/* Amount Card */}
      <View style={[styles.amountCard, isEarning ? styles.earningCard : styles.spendingCard]}>
        <Text style={styles.amountLabel}>{isEarning ? 'Amount Earned' : 'Amount Spent'}</Text>
        <Text style={styles.amountValue}>
          {isEarning ? '+' : '-'} Rs. {formatAmount(entry.amount)}
        </Text>
      </View>

      {/* Details Section */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Details</Text>

        <DetailRow icon="document-text-outline" label="Title" value={entry.title} />
        <DetailRow icon="briefcase-outline" label="Type" value={entry.entry_type?.charAt(0).toUpperCase() + entry.entry_type?.slice(1)} />
        {entry.company_name && (
          <DetailRow icon="business-outline" label="Company" value={entry.company_name} />
        )}
        <DetailRow icon="calendar-outline" label="Date" value={dateDisplay} />
        <DetailRow
          icon="repeat-outline"
          label="Recurring"
          value={entry.is_recurring ? 'Yes — Monthly' : 'No'}
        />
        {entry.notes && (
          <DetailRow icon="chatbox-ellipses-outline" label="Notes" value={entry.notes} />
        )}
      </View>

      {/* Invoice Section */}
      {hasInvoice && (
        <View style={styles.invoiceCard}>
          <Text style={styles.sectionTitle}>Invoice / Receipt</Text>

          {invoiceIsImage ? (
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: entry.invoice_uri }}
                  style={styles.invoiceImage}
                  resizeMode="contain"
                />
              </View>
              <Pressable
                style={({ pressed }) => [styles.downloadBtn, styles.downloadImageBtn, pressed && { opacity: 0.8 }]}
                onPress={handleDownload}
                role="button"
              >
                <Ionicons name="download-outline" size={20} color={COLORS.textWhite} />
                <Text style={styles.downloadBtnText}>Download Image</Text>
              </Pressable>
            </View>
          ) : docInfo ? (
            <View style={styles.docContainer}>
              <View style={[styles.docIconBox, { backgroundColor: docInfo.color }]}>
                <Ionicons name={docInfo.icon} size={36} color={COLORS.textWhite} />
              </View>
              <Text style={styles.docLabel}>{docInfo.label}</Text>
              <Text style={styles.docFileName} numberOfLines={2}>
                {getFileName()}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.downloadBtn, pressed && { opacity: 0.8 }]}
                onPress={handleDownload}
                role="button"
              >
                <Ionicons name="download-outline" size={20} color={COLORS.textWhite} />
                <Text style={styles.downloadBtnText}>Download</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      {/* Delete */}
      <Button
        title="Delete Entry"
        onPress={handleDelete}
        loading={deleting}
        style={styles.deleteBtn}
        textStyle={styles.deleteBtnText}
      />
    </ScrollView>
  );
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 16,
  },
  earningBadge: {
    backgroundColor: COLORS.income + '14',
  },
  spendingBadge: {
    backgroundColor: COLORS.expense + '14',
  },
  typeBadgeText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
  },
  amountCard: {
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  earningCard: {
    backgroundColor: COLORS.income,
  },
  spendingCard: {
    backgroundColor: COLORS.expense,
  },
  amountLabel: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 34,
    fontWeight: FONTS.weights.extraBold,
    color: COLORS.textWhite,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
  },
  invoiceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  imageSection: {
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.borderLight,
    width: '100%',
  },
  downloadImageBtn: {
    marginTop: 16,
  },
  invoiceImage: {
    width: '100%',
    height: 350,
    backgroundColor: COLORS.borderLight,
  },
  docContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  docIconBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  docLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  docFileName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    maxWidth: '80%',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  downloadBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textWhite,
  },
  deleteBtn: {
    backgroundColor: COLORS.danger,
    marginTop: 8,
  },
  deleteBtnText: {
    color: COLORS.textWhite,
  },
});

export default EntryDetailScreen;
