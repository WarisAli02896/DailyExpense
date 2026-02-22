import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import AddEntryScreen from '../screens/expense/AddEntryScreen';
import SalaryFormScreen from '../screens/expense/SalaryFormScreen';
import AddExpenseScreen from '../screens/expense/AddExpenseScreen';
import NormalExpenseScreen from '../screens/expense/NormalExpenseScreen';
import InvestmentFormScreen from '../screens/expense/InvestmentFormScreen';
import EntryDetailScreen from '../screens/expense/EntryDetailScreen';
import RecurringEntriesScreen from '../screens/expense/RecurringEntriesScreen';
import AccountsScreen from '../screens/accounts/AccountsScreen';
import AccountSummaryScreen from '../screens/accounts/AccountSummaryScreen';
import ProfileScreen from '../screens/settings/ProfileScreen';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.textWhite,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddEntry"
        component={AddEntryScreen}
        options={{ title: 'Add Entry' }}
      />
      <Stack.Screen
        name="SalaryForm"
        component={SalaryFormScreen}
        options={{ title: 'Add Salary' }}
      />
      <Stack.Screen
        name="NormalExpense"
        component={NormalExpenseScreen}
        options={{ title: 'Normal Expense' }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ title: 'Add Expense' }}
      />
      <Stack.Screen
        name="InvestmentForm"
        component={InvestmentFormScreen}
        options={{ title: 'Add Investment' }}
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
