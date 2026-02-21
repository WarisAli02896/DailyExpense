import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const EntryRow = ({ title, amount, type, category, date, onDelete }) => {
  const isEarning = type === 'earning';

  return (
    <View style={styles.row}>
      <View style={[styles.typeIndicator, isEarning ? styles.earningIndicator : styles.spendingIndicator]} />

      <View style={styles.iconContainer}>
        <Ionicons
          name={isEarning ? 'arrow-down-circle' : 'arrow-up-circle'}
          size={28}
          color={isEarning ? COLORS.income : COLORS.expense}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.meta}>
          {category}{date ? ` • ${date}` : ''}
        </Text>
      </View>

      <Text style={[styles.amount, isEarning ? styles.earningAmount : styles.spendingAmount]}>
        {isEarning ? '+' : '-'} Rs. {amount}
      </Text>

      <Pressable
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
        onPress={onDelete}
        role="button"
        aria-label={`Delete ${title}`}
        hitSlop={8}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)',
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
  iconContainer: {
    marginLeft: 6,
    marginRight: 12,
  },
  details: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 3,
  },
  meta: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  amount: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    marginRight: 10,
  },
  earningAmount: {
    color: COLORS.income,
  },
  spendingAmount: {
    color: COLORS.expense,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
  },
  deleteBtnPressed: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
});

export default EntryRow;
