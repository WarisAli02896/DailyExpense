import React, { createContext, useState, useCallback } from 'react';
import * as expenseService from '../services/expenseService';
import { getCurrentMonth, getCurrentYear } from '../utils/dateUtils';

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ totalSpent: 0, byCategory: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  const loadExpenses = useCallback(async (userId, filters = {}) => {
    setIsLoading(true);
    try {
      const result = await expenseService.getExpensesByUser(userId, {
        month: filters.month || selectedMonth,
        year: filters.year || selectedYear,
        categoryId: filters.categoryId,
      });

      if (result.success) {
        setExpenses(result.data);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const loadSummary = useCallback(async (userId, month, year) => {
    try {
      const result = await expenseService.getExpenseSummary(
        userId,
        month || selectedMonth,
        year || selectedYear
      );

      if (result.success) {
        setSummary(result.data);
      }
      return result;
    } catch (error) {
      console.error('Load Summary Error:', error);
    }
  }, [selectedMonth, selectedYear]);

  const addExpense = async (expenseData) => {
    const result = await expenseService.addExpense(expenseData);
    if (result.success) {
      await loadExpenses(expenseData.userId);
      await loadSummary(expenseData.userId);
    }
    return result;
  };

  const updateExpense = async (expenseId, expenseData, userId) => {
    const result = await expenseService.updateExpense(expenseId, expenseData);
    if (result.success) {
      await loadExpenses(userId);
      await loadSummary(userId);
    }
    return result;
  };

  const deleteExpense = async (expenseId, userId) => {
    const result = await expenseService.deleteExpense(expenseId);
    if (result.success) {
      await loadExpenses(userId);
      await loadSummary(userId);
    }
    return result;
  };

  const changeMonth = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        summary,
        isLoading,
        selectedMonth,
        selectedYear,
        loadExpenses,
        loadSummary,
        addExpense,
        updateExpense,
        deleteExpense,
        changeMonth,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};
