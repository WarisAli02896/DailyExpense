import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { getRecurringEntries, updateRecurringEntry, deleteEntry } from '../../services/entryService';
import { useAuth } from '../../hooks/useAuth';
import { formatAmount } from '../../utils/currencyUtils';
import { getMonthName, getShortMonthName, formatTime12h } from '../../utils/dateUtils';

const RecurringEntriesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [editEntry, setEditEntry] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    const result = await getRecurringEntries(user.id);
    if (result.success) setEntries(result.data);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleDelete = (entry) => {
    Alert.alert(
      'Delete Recurring Entry',
      `Remove "${entry.title}" from recurring entries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteEntry(entry.id);
            if (result.success) loadEntries();
          },
        },
      ]
    );
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setEditTitle(entry.title || '');
    setEditAmount(String(entry.amount || ''));
    setEditCompany(entry.company_name || '');
  };

  const closeEdit = () => {
    setEditEntry(null);
    setEditTitle('');
    setEditAmount('');
    setEditCompany('');
  };

  const handleAmountChange = (text) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    setEditAmount(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : filtered);
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    if (!editAmount.trim() || parseFloat(editAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount.');
      return;
    }

    const titleSame = editTitle.trim() === (editEntry.title || '');
    const amountSame = parseFloat(editAmount) === editEntry.amount;
    const companySame = (editCompany.trim() || '') === (editEntry.company_name || '');

    if (titleSame && amountSame && companySame) {
      closeEdit();
      return;
    }

    setUpdating(true);
    const result = await updateRecurringEntry(editEntry, {
      title: editTitle.trim(),
      amount: parseFloat(editAmount),
      companyName: editCompany.trim() || null,
    });

    if (result.success) {
      Alert.alert('Updated', 'Previous entries are preserved. A new entry has been created for upcoming months.');
      closeEdit();
      loadEntries();
    } else {
      Alert.alert('Error', result.message);
    }
    setUpdating(false);
  };

  const totalEarnings = entries.filter((e) => e.type === 'earning').reduce((s, e) => s + e.amount, 0);
  const totalSpendings = entries.filter((e) => e.type === 'spending').reduce((s, e) => s + e.amount, 0);

  const renderEntry = ({ item }) => {
    const isEarning = item.type === 'earning';
    const day = new Date(item.date);
    const datePart = `${String(day.getDate()).padStart(2, '0')} ${getShortMonthName(day.getMonth() + 1)}`;
    const timePart = formatTime12h(item.date);
    const dateLabel = timePart ? `${datePart} · ${timePart}` : datePart;

    return (
      <Pressable
        style={({ pressed }) => [styles.entryRow, pressed && styles.entryRowPressed]}
        onPress={() => navigation.navigate('EntryDetail', { entry: item })}
        role="button"
      >
        <View style={[styles.typeIndicator, isEarning ? styles.earningIndicator : styles.spendingIndicator]} />

        <View style={styles.entryIconWrap}>
          <Ionicons
            name={isEarning ? 'arrow-down-circle' : 'arrow-up-circle'}
            size={28}
            color={isEarning ? COLORS.income : COLORS.expense}
          />
        </View>

        <View style={styles.entryDetails}>
          <Text style={styles.entryTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.entryMeta}>
            <Text style={styles.entryMetaText}>
              {item.entry_type}{dateLabel ? ` · ${dateLabel}` : ''}
            </Text>
            <View style={styles.recurringTag}>
              <Ionicons name="repeat" size={10} color={COLORS.primary} />
              <Text style={styles.recurringTagText}>Monthly</Text>
            </View>
          </View>
          {item.company_name ? (
            <Text style={styles.entryCompany} numberOfLines={1}>{item.company_name}</Text>
          ) : null}
        </View>

        <Text style={[styles.entryAmount, isEarning ? styles.earningAmt : styles.spendingAmt]}>
          {isEarning ? '+' : '-'} Rs. {formatAmount(item.amount)}
        </Text>

        <View style={styles.entryActions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={(e) => { e.stopPropagation(); openEdit(item); }}
            role="button"
            hitSlop={6}
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.deleteBtnPressed]}
            onPress={(e) => { e.stopPropagation(); handleDelete(item); }}
            role="button"
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      {entries.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: COLORS.income + '20' }]}>
              <Ionicons name="arrow-down-circle" size={18} color={COLORS.income} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Recurring Earnings</Text>
              <Text style={[styles.summaryValue, { color: COLORS.income }]}>
                Rs. {formatAmount(totalEarnings)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryDot, { backgroundColor: COLORS.expense + '20' }]}>
              <Ionicons name="arrow-up-circle" size={18} color={COLORS.expense} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Recurring Spendings</Text>
              <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
                Rs. {formatAmount(totalSpendings)}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Monthly Entries</Text>
        <Text style={styles.sectionCount}>{entries.length} entries</Text>
      </View>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="repeat-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No recurring entries</Text>
            <Text style={styles.emptyText}>
              Entries marked as monthly will appear here
            </Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal visible={!!editEntry} transparent animationType="fade" onRequestClose={closeEdit}>
        <Pressable style={styles.overlay} onPress={closeEdit}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Entry</Text>
              <Pressable onPress={closeEdit} role="button">
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            {editEntry && (
              <View style={styles.modalBody}>
                <View style={styles.infoNote}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.infoNoteText}>
                    Previous months will stay unchanged. Changes apply to new entries only.
                  </Text>
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Title</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Entry title"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>

                <View style={styles.modalField}>
                  <Text style={styles.fieldLabel}>Amount</Text>
                  <View style={styles.amountRow}>
                    <View style={styles.currencyTag}>
                      <Text style={styles.currencyText}>Rs.</Text>
                    </View>
                    <TextInput
                      style={[styles.fieldInput, styles.amountInput]}
                      value={editAmount}
                      onChangeText={handleAmountChange}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textLight}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {editEntry.entry_type === 'salary' && (
                  <View style={styles.modalField}>
                    <Text style={styles.fieldLabel}>Company</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={editCompany}
                      onChangeText={setEditCompany}
                      placeholder="Company name"
                      placeholderTextColor={COLORS.textLight}
                    />
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Pressable
                    style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.7 }]}
                    onPress={closeEdit}
                    role="button"
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.modalSaveBtn, pressed && { opacity: 0.8 }, updating && { opacity: 0.5 }]}
                    onPress={handleUpdate}
                    disabled={updating}
                    role="button"
                  >
                    <Ionicons name="checkmark" size={18} color={COLORS.textWhite} />
                    <Text style={styles.modalSaveText}>Update</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryDot: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  sectionCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingBottom: 30,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)',
  },
  entryRowPressed: {
    opacity: 0.85,
    backgroundColor: COLORS.borderLight,
  },
  typeIndicator: {
    width: 4,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
  },
  earningIndicator: {
    backgroundColor: COLORS.income,
  },
  spendingIndicator: {
    backgroundColor: COLORS.expense,
  },
  entryIconWrap: {
    marginLeft: 6,
    marginRight: 12,
  },
  entryDetails: {
    flex: 1,
    marginRight: 8,
  },
  entryTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 3,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryMetaText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  recurringTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  recurringTagText: {
    fontSize: 10,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.primary,
  },
  entryCompany: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  entryAmount: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    marginRight: 6,
  },
  earningAmt: {
    color: COLORS.income,
  },
  spendingAmt: {
    color: COLORS.expense,
  },
  entryActions: {
    gap: 4,
  },
  actionBtn: {
    padding: 5,
    borderRadius: 8,
  },
  actionBtnPressed: {
    backgroundColor: COLORS.primary + '12',
  },
  deleteBtnPressed: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textSecondary,
    marginTop: 14,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    marginTop: 6,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  infoNoteText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    flex: 1,
  },
  modalField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginBottom: 6,
  },
  fieldInput: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
  },
  currencyText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  amountInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modalSaveText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textWhite,
  },
});

export default RecurringEntriesScreen;
