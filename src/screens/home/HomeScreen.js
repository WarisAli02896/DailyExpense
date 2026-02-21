import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import EntryRow from '../../components/expense/EntryRow';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { getMonthName, getShortMonthName, formatDate } from '../../utils/dateUtils';
import { formatAmount } from '../../utils/currencyUtils';
import { getEntriesByMonth, getMonthSummary, deleteEntry } from '../../services/entryService';
import { useAuth } from '../../hooks/useAuth';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ totalEarnings: 0, totalSpendings: 0, amountLeft: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const now = currentTime;
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [entriesResult, summaryResult] = await Promise.all([
      getEntriesByMonth(user.id, currentMonth, currentYear),
      getMonthSummary(user.id, currentMonth, currentYear),
    ]);

    if (entriesResult.success) setEntries(entriesResult.data);
    if (summaryResult.success) setSummary(summaryResult.data);
  }, [user, currentMonth, currentYear]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleDelete = (entry) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${entry.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteEntry(entry.id);
            if (result.success) loadData();
          },
        },
      ]
    );
  };

  const monthName = getMonthName(currentMonth);
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = String(hours % 12 || 12).padStart(2, '0');
  const timeString = `${displayHours}:${minutes}:${seconds}`;

  const renderEntry = ({ item }) => {
    const day = new Date(item.date);
    const dateLabel = `${String(day.getDate()).padStart(2, '0')} ${getShortMonthName(day.getMonth() + 1)}`;

    return (
      <EntryRow
        title={item.title}
        amount={formatAmount(item.amount)}
        type={item.type}
        category={item.entry_type}
        date={dateLabel}
        onDelete={() => handleDelete(item)}
      />
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.monthText}>{monthName} {currentYear}</Text>
          <Text style={styles.greeting}>Your monthly overview</Text>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        <Text style={styles.entryCount}>{entries.length} entries</Text>
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

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('AddEntry')}
        role="button"
        aria-label="Add new entry"
      >
        <Ionicons name="add" size={30} color={COLORS.textWhite} />
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
    paddingTop: 50,
  },
  monthText: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  greeting: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  entryCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
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
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});

export default HomeScreen;
