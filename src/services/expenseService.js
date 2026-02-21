import { getDBConnection } from './database';
import { EXPENSE_MESSAGES } from '../messages/expenseMessages';

export const addExpense = async ({ userId, title, amount, categoryId, date, notes = '' }) => {
  try {
    const db = await getDBConnection();

    const result = await db.runAsync(
      'INSERT INTO expenses (user_id, title, amount, category_id, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, amount, categoryId, date, notes]
    );

    return {
      success: true,
      message: EXPENSE_MESSAGES.ADD_SUCCESS,
      data: { id: result.lastInsertRowId },
    };
  } catch (error) {
    console.error('Add Expense Error:', error);
    return { success: false, message: EXPENSE_MESSAGES.ADD_FAILED };
  }
};

export const updateExpense = async (expenseId, { title, amount, categoryId, date, notes }) => {
  try {
    const db = await getDBConnection();

    await db.runAsync(
      'UPDATE expenses SET title = ?, amount = ?, category_id = ?, date = ?, notes = ? WHERE id = ?',
      [title, amount, categoryId, date, notes, expenseId]
    );

    return { success: true, message: EXPENSE_MESSAGES.UPDATE_SUCCESS };
  } catch (error) {
    console.error('Update Expense Error:', error);
    return { success: false, message: EXPENSE_MESSAGES.UPDATE_FAILED };
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [expenseId]);
    return { success: true, message: EXPENSE_MESSAGES.DELETE_SUCCESS };
  } catch (error) {
    console.error('Delete Expense Error:', error);
    return { success: false, message: EXPENSE_MESSAGES.DELETE_FAILED };
  }
};

export const getExpenseById = async (expenseId) => {
  try {
    const db = await getDBConnection();

    const expense = await db.getFirstAsync(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = ?`,
      [expenseId]
    );

    return { success: true, data: expense };
  } catch (error) {
    console.error('Get Expense Error:', error);
    return { success: false, message: EXPENSE_MESSAGES.FETCH_FAILED };
  }
};

export const getExpensesByUser = async (userId, { month, year, categoryId, limit, offset = 0 } = {}) => {
  try {
    const db = await getDBConnection();

    let query = `
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params = [userId];

    if (month && year) {
      query += " AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?";
      params.push(String(month).padStart(2, '0'), String(year));
    }

    if (categoryId) {
      query += ' AND e.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY e.date DESC';

    if (limit) {
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);
    }

    const expenses = await db.getAllAsync(query, params);

    return { success: true, data: expenses };
  } catch (error) {
    console.error('Get Expenses Error:', error);
    return { success: false, message: EXPENSE_MESSAGES.FETCH_FAILED, data: [] };
  }
};

export const getExpenseSummary = async (userId, month, year) => {
  try {
    const db = await getDBConnection();

    const total = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = ? AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`,
      [userId, String(month).padStart(2, '0'), String(year)]
    );

    const byCategory = await db.getAllAsync(
      `SELECT c.name, c.color, c.icon, COALESCE(SUM(e.amount), 0) as total
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?
       GROUP BY e.category_id
       ORDER BY total DESC`,
      [userId, String(month).padStart(2, '0'), String(year)]
    );

    return {
      success: true,
      data: { totalSpent: total.total, byCategory },
    };
  } catch (error) {
    console.error('Get Summary Error:', error);
    return { success: false, message: EXPENSE_MESSAGES.FETCH_FAILED };
  }
};
