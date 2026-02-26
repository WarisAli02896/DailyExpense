import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import EntryRow from '../../components/expense/EntryRow';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { getMonthName, getShortMonthName, formatTime12h } from '../../utils/dateUtils';
import { formatAmount } from '../../utils/currencyUtils';
import { getEntriesByMonth, getMonthSummary, deleteEntry } from '../../services/entryService';
import { applyRecurringEntries } from '../../services/recurringService';
import { useAuth } from '../../hooks/useAuth';
import { showAlert, showConfirm } from '../../utils/alertUtils';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalEarnings: 0, totalSpendings: 0, amountLeft: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth() + 1;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const goPrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goNextMonth = () => {
    if (isCurrentMonth) return;
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const loadData = useCallback(async () => {
    if (!user) return;

    const [entriesResult, summaryResult] = await Promise.all([
      getEntriesByMonth(user.id, month, year),
      getMonthSummary(user.id, month, year),
    ]);

    if (entriesResult.success) setEntries(entriesResult.data);
    if (summaryResult.success) setSummary(summaryResult.data);
  }, [user, month, year]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    const result = await applyRecurringEntries(user.id, month, year);
    await loadData();
    setRefreshing(false);
    if (result.success && result.added > 0) {
      showAlert('Recurring Entries', result.message);
    }
  }, [user, month, year, loadData]);

  const handleDelete = (entry) => {
    showConfirm(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      async () => {
        const result = await deleteEntry(entry.id);
        if (result.success) loadData();
      }
    );
  };

  const monthName = getMonthName(month);
  const hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');
  const timeString = `${displayHours}:${minutes}:${seconds}`;

  const renderEntry = ({ item }) => {
    const day = new Date(item.date);
    const datePart = `${String(day.getDate()).padStart(2, '0')} ${getShortMonthName(day.getMonth() + 1)}`;
    const timePart = formatTime12h(item.date);
    const dateLabel = timePart ? `${datePart} · ${timePart}` : datePart;

    return (
      <EntryRow
        title={item.title}
        amount={formatAmount(item.amount)}
        type={item.type}
        category={item.entry_type}
        date={dateLabel}
        invoiceUri={item.invoice_uri}
        onPress={() => navigation.navigate('EntryDetail', { entry: item })}
        onDelete={() => handleDelete(item)}
      />
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.monthNav}>
          <Pressable onPress={goPrevMonth} style={styles.monthNavBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </Pressable>
          <View style={styles.monthCenter}>
            <Text style={styles.monthText}>{monthName} {year}</Text>
            <Text style={styles.greeting}>Your monthly overview</Text>
          </View>
          <Pressable
            onPress={goNextMonth}
            style={[styles.monthNavBtn, isCurrentMonth && { opacity: 0.3 }]}
            disabled={isCurrentMonth}
            hitSlop={10}
          >
            <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
          </Pressable>
        </View>
        <View style={styles.clockContainer}>
          <Ionicons name="time-outline" size={16} color={COLORS.primaryLight} />
          <Text style={styles.clockText}>{timeString}</Text>
          <Text style={styles.ampmText}>{ampm}</Text>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Amount Left This Month</Text>
        <Text style={styles.balanceAmount}>Rs. {formatAmount(summary.amountLeft)}</Text>

        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <View style={styles.balanceDot}>
              <Ionicons name="arrow-down-circle" size={18} color={COLORS.income} />
            </View>
            <View>
              <Text style={styles.balanceItemLabel}>Earnings</Text>
              <Text style={[styles.balanceItemValue, { color: COLORS.income }]}>
                Rs. {formatAmount(summary.totalEarnings)}
              </Text>
            </View>
          </View>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceItem}>
            <View style={styles.balanceDot}>
              <Ionicons name="arrow-up-circle" size={18} color={COLORS.expense} />
            </View>
            <View>
              <Text style={styles.balanceItemLabel}>Spendings</Text>
              <Text style={[styles.balanceItemValue, { color: COLORS.expense }]}>
                Rs. {formatAmount(summary.totalSpendings)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.recurringLink, pressed && { opacity: 0.8 }]}
        onPress={() => navigation.navigate('RecurringEntries')}
        role="button"
      >
        <View style={styles.recurringLinkLeft}>
          <Ionicons name="repeat" size={18} color={COLORS.primary} />
          <Text style={styles.recurringLinkText}>Monthly Recurring Entries</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        <View style={styles.sectionRight}>
          <Text style={styles.entryCount}>{entries.length} Entries</Text>
          <Pressable
            style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.6 }]}
            onPress={onRefresh}
            role="button"
            aria-label="Refresh and apply recurring entries"
          >
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={60} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>No entries yet</Text>
      <Text style={styles.emptyText}>Tap the + button to add your first entry</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      />

      {showQuickAdd ? (
        <Pressable
          style={styles.quickAddOverlay}
          onPress={() => setShowQuickAdd(false)}
          role="button"
          aria-label="Close quick add menu"
        />
      ) : null}

      {showQuickAdd ? (
        <View style={styles.quickAddMenu}>
          <Pressable
            style={({ pressed }) => [styles.quickAddOption, pressed && { opacity: 0.85 }]}
            onPress={() => {
              setShowQuickAdd(false);
              navigation.navigate('EarningForm');
            }}
            role="button"
          >
            <View style={[styles.quickAddIconWrap, { backgroundColor: COLORS.income + '16' }]}>
              <Ionicons name="wallet-outline" size={18} color={COLORS.income} />
            </View>
            <View style={styles.quickAddTextWrap}>
              <Text style={styles.quickAddTitle}>Add Earning</Text>
              <Text style={styles.quickAddSubtitle}>Salary or normal earning</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickAddOption, pressed && { opacity: 0.85 }]}
            onPress={() => {
              setShowQuickAdd(false);
              navigation.navigate('AddExpense');
            }}
            role="button"
          >
            <View style={[styles.quickAddIconWrap, { backgroundColor: COLORS.expense + '16' }]}>
              <Ionicons name="cart-outline" size={18} color={COLORS.expense} />
            </View>
            <View style={styles.quickAddTextWrap}>
              <Text style={styles.quickAddTitle}>Add Expense</Text>
              <Text style={styles.quickAddSubtitle}>Track spending by category</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setShowQuickAdd((prev) => !prev)}
        role="button"
        aria-label="Add new entry"
      >
        <Ionicons name={showQuickAdd ? 'close' : 'add'} size={30} color={COLORS.textWhite} />
      </Pressable>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingTop: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  monthCenter: {},
  monthText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  greeting: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
  },
  clockText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  ampmText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.primary,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: FONTS.sizes.md,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: FONTS.weights.extraBold,
    color: COLORS.textWhite,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceItemLabel: {
    fontSize: FONTS.sizes.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  balanceItemValue: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  balanceDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 12,
  },
  recurringLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary + '08',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '18',
  },
  recurringLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recurringLinkText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.primary,
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
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  refreshButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
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
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(108, 99, 255, 0.4)',
  },
  quickAddOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  quickAddMenu: {
    position: 'absolute',
    right: 24,
    bottom: 94,
    gap: 10,
    alignItems: 'flex-end',
  },
  quickAddOption: {
    minWidth: 230,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border + '90',
    paddingHorizontal: 14,
    paddingVertical: 10,
    boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.14)',
  },
  quickAddIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddTextWrap: {
    flex: 1,
  },
  quickAddTitle: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  quickAddSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});

export default HomeScreen;
