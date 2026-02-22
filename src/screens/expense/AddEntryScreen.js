import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { ENTRY_TYPES } from '../../constants/categories';

const AddEntryScreen = ({ navigation }) => {
  const handleSelect = (entry) => {
    switch (entry.id) {
      case 'salary':
        navigation.navigate('SalaryForm');
        break;
      case 'expense':
        navigation.navigate('AddExpense');
        break;
      case 'investment':
        navigation.navigate('InvestmentForm');
        break;
      case 'bills':
        navigation.navigate('BillForm');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>What would you like to add?</Text>
      <Text style={styles.subheading}>Select the type of entry</Text>

      <View style={styles.grid}>
        {ENTRY_TYPES.map((entry) => {
          const isDisabled = entry.id !== 'salary' && entry.id !== 'expense' && entry.id !== 'investment' && entry.id !== 'bills';

          return (
            <Pressable
              key={entry.id}
              style={({ pressed }) => [
                styles.card,
                pressed && !isDisabled && styles.cardPressed,
                isDisabled && styles.cardDisabled,
              ]}
              onPress={() => handleSelect(entry)}
              disabled={isDisabled}
              role="button"
              aria-label={entry.label}
            >
              <View style={[styles.iconCircle, { backgroundColor: entry.color + '18' }]}>
                <Ionicons name={entry.icon} size={30} color={entry.color} />
              </View>
              <Text style={[styles.cardLabel, isDisabled && styles.cardLabelDisabled]}>
                {entry.label}
              </Text>
              <Text style={[styles.cardType, { color: entry.color }]}>
                {entry.type === 'earning' ? 'Earning' : 'Spending'}
              </Text>
              {isDisabled && (
                <View style={styles.comingSoon}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  heading: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
    marginTop: 10,
  },
  subheading: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.06)',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardDisabled: {
    opacity: 0.45,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardLabelDisabled: {
    color: COLORS.textSecondary,
  },
  cardType: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  comingSoon: {
    marginTop: 8,
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  comingSoonText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: FONTS.weights.medium,
  },
});

export default AddEntryScreen;
