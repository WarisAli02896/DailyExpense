import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { useAuth } from '../../hooks/useAuth';
import { addPerson, getPersons, deletePerson } from '../../services/personService';
import { formatAmount } from '../../utils/currencyUtils';
import { showAlert, showConfirm } from '../../utils/alertUtils';

const INVEST_COLOR = '#7C4DFF';

const AccountsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [persons, setPersons] = useState([]);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const loadPersons = useCallback(async () => {
    if (!user) return;
    const result = await getPersons(user.id);
    if (result.success) setPersons(result.data);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPersons();
    }, [loadPersons])
  );

  const grandTotal = persons.reduce((sum, p) => sum + (p.total_invested || 0), 0);

  const handleAdd = async () => {
    if (!newName.trim()) {
      showAlert('Error', 'Please enter a person name.');
      return;
    }

    setAdding(true);
    const result = await addPerson(user.id, newName);
    if (result.success) {
      setNewName('');
      setShowInput(false);
      loadPersons();
    } else {
      showAlert('Error', result.message);
    }
    setAdding(false);
  };

  const handleDelete = (e, person) => {
    e.stopPropagation();
    showConfirm(
      'Delete Account',
      `Remove "${person.name}" from your accounts?`,
      async () => {
        const result = await deletePerson(person.id);
        if (result.success) loadPersons();
      }
    );
  };

  const getInitial = (name) => name.charAt(0).toUpperCase();

  const AVATAR_COLORS = ['#6C63FF', '#FF6584', '#4ECDC4', '#45B7D1', '#FF9800', '#7C4DFF', '#4CAF50', '#E53935'];

  const renderPerson = ({ item, index }) => {
    const bgColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const totalInvested = item.total_invested || 0;
    const entryCount = item.entry_count || 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.personRow, pressed && styles.personRowPressed]}
        onPress={() => navigation.navigate('AccountSummary', { person: item })}
        role="button"
      >
        <View style={[styles.avatar, { backgroundColor: bgColor }]}>
          <Text style={styles.avatarText}>{getInitial(item.name)}</Text>
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{item.name}</Text>
          <Text style={styles.personMeta}>
            {entryCount} {entryCount === 1 ? 'investment' : 'investments'}
          </Text>
        </View>
        <View style={styles.personAmountWrap}>
          <Text style={styles.personAmount}>Rs. {formatAmount(totalInvested)}</Text>
          <View style={styles.personRowRight}>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
          onPress={(e) => handleDelete(e, item)}
          role="button"
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Accounts</Text>
          <Text style={styles.subtitle}>People you invest with</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{persons.length}</Text>
        </View>
      </View>

      {/* Grand Total Card */}
      {persons.length > 0 && (
        <View style={styles.totalCard}>
          <View style={styles.totalCardLeft}>
            <Ionicons name="wallet-outline" size={22} color={INVEST_COLOR} />
            <View>
              <Text style={styles.totalLabel}>Total Invested</Text>
              <Text style={styles.totalAmount}>Rs. {formatAmount(grandTotal)}</Text>
            </View>
          </View>
          <View style={styles.totalPersonCount}>
            <Text style={styles.totalPersonCountText}>{persons.length} accounts</Text>
          </View>
        </View>
      )}

      {/* Add Person */}
      {showInput ? (
        <View style={styles.addCard}>
          <TextInput
            style={styles.addInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter person name"
            placeholderTextColor={COLORS.textLight}
            autoFocus
            onSubmitEditing={handleAdd}
          />
          <View style={styles.addActions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
              onPress={() => { setShowInput(false); setNewName(''); }}
              role="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }, adding && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={adding}
              role="button"
            >
              <Ionicons name="checkmark" size={18} color={COLORS.textWhite} />
              <Text style={styles.saveBtnText}>Add</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          onPress={() => setShowInput(true)}
          role="button"
        >
          <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Add New Person</Text>
        </Pressable>
      )}

      {/* Persons List */}
      <FlatList
        data={persons}
        renderItem={renderPerson}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptyText}>Add a person to start tracking investments</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: INVEST_COLOR + '10',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: INVEST_COLOR + '25',
  },
  totalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  totalAmount: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.extraBold,
    color: INVEST_COLOR,
    marginTop: 2,
  },
  totalPersonCount: {
    backgroundColor: INVEST_COLOR + '18',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  totalPersonCountText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semiBold,
    color: INVEST_COLOR,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  addBtnText: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.primary,
  },
  addCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  addInput: {
    fontSize: FONTS.sizes.base,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  addActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  saveBtnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.textWhite,
  },
  listContent: {
    paddingBottom: 30,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.06)',
  },
  personRowPressed: {
    backgroundColor: COLORS.borderLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textWhite,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: FONTS.sizes.base,
    fontWeight: FONTS.weights.semiBold,
    color: COLORS.text,
  },
  personMeta: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  personAmountWrap: {
    alignItems: 'flex-end',
    marginRight: 6,
  },
  personAmount: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: INVEST_COLOR,
  },
  personRowRight: {
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 10,
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
  },
});

export default AccountsScreen;
