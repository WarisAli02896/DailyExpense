import React from 'react';
import { Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import BottomTabNavigator from './BottomTabNavigator';
import SalaryFormScreen from '../screens/expense/SalaryFormScreen';
import EarningFormScreen from '../screens/earning/EarningFormScreen';
import AddExpenseScreen from '../screens/expense/AddExpenseScreen';
import EntryDetailScreen from '../screens/expense/EntryDetailScreen';
import RecurringEntriesScreen from '../screens/expense/RecurringEntriesScreen';
import AccountsScreen from '../screens/accounts/AccountsScreen';
import AccountSummaryScreen from '../screens/accounts/AccountSummaryScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import { COLORS } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { logoutUser } from '../services/authService';
import { showAlert, showConfirm } from '../utils/alertUtils';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    showConfirm('Logout', 'Are you sure you want to logout?', async () => {
      try {
        const result = await logoutUser();
        if (result.success) {
          logout();
        } else {
          showAlert('Error', result.message);
        }
      } catch (error) {
        showAlert('Error', 'Logout failed. Please try again.');
      }
    });
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.textWhite,
        headerTitleStyle: { fontWeight: '600' },
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: COLORS.background },
        headerRight: () => (
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [{ marginRight: 12, opacity: pressed ? 0.7 : 1 }]}
            role="button"
            aria-label="Logout"
          >
            <Ionicons name="log-out-outline" size={22} color={COLORS.textWhite} />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SalaryForm"
        component={SalaryFormScreen}
        options={{ title: 'Add Salary' }}
      />
      <Stack.Screen
        name="EarningForm"
        component={EarningFormScreen}
        options={{ title: 'Add Earning' }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ title: 'Add Expense' }}
      />
      <Stack.Screen
        name="EntryDetail"
        component={EntryDetailScreen}
        options={{ title: 'Entry Details' }}
      />
      <Stack.Screen
        name="RecurringEntries"
        component={RecurringEntriesScreen}
        options={{ title: 'Recurring Entries' }}
      />
      <Stack.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{ title: 'Accounts' }}
      />
      <Stack.Screen
        name="AccountSummary"
        component={AccountSummaryScreen}
        options={{ title: 'Account Summary' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
