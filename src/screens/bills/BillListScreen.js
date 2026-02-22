import React, { useState, useCallback } from 'react';
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
import { getEntriesByEntryType, deleteEntry } from '../../services/entryService';
import { useAuth } from '../../hooks/useAuth';
import { showConfirm } from '../../utils/alertUtils';

const BILL_COLOR = '#FF9800';

const BillListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const result = await getEntriesByEntryType(user.id, 'bills', month, year);
    if (result.success) {
      setEntries(result.data);
      setTotal(result.total);
    }
  }, [user, month, year]);

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

  const goPrev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goNext = () => {
    const n = new Date();
    if (year === n.getFullYear() && month === n.getMonth() + 1) return;
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const handleDelete = (entry) => {
    showConfirm('Delete Bill', `Delete "${entry.title}"?`, async () => {
      const result = await deleteEntry(entry.id);
      if (result.success) loadData();
    });
  };

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
      <View style={styles.monthNav}>
        <Pressable onPress={goPrev} style={styles.navBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.monthText}>{getMonthName(month)} {year}</Text>
        <Pressable
          onPress={goNext}
          style={[styles.navBtn, isCurrentMonth && { opacity: 0.3 }]}
          disabled={isCurrentMonth}
          hitSlop={10}
        >
          <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="flash" size={28} color={BILL_COLOR} />
        </View>
        <View>
          <Text style={styles.summaryLabel}>Total Bills</Text>
          <Text style={styles.summaryAmount}>Rs. {formatAmount(total)}</Text>
        </View>
        <Text style={styles.summaryCount}>{entries.length} Entries</Text>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="flash-outline" size={60} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>No bills this month</Text>
      <Text style={styles.emptyText}>Add a bill payment to see it here</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BILL_COLOR]} tintColor={BILL_COLOR} />
        }
      />
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
    paddingTop: 50,
    paddingBottom: 40,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  monthText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BILL_COLOR + '12',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: BILL_COLOR + '25',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BILL_COLOR + '1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: BILL_COLOR,
  },
  summaryCount: {
    marginLeft: 'auto',
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
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
});

export default BillListScreen;
