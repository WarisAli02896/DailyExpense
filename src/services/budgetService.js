import { getDBConnection } from './database';

const BUDGET_MESSAGES = {
  SET_SUCCESS: 'Budget set successfully',
  SET_FAILED: 'Failed to set budget',
  FETCH_FAILED: 'Failed to fetch budget',
  DELETE_SUCCESS: 'Budget deleted successfully',
  DELETE_FAILED: 'Failed to delete budget',
};

export const setBudget = async ({ userId, categoryId = null, amount, month, year }) => {
  try {
    const db = await getDBConnection();

    const existing = await db.getFirstAsync(
      'SELECT id FROM budgets WHERE user_id = ? AND category_id IS ? AND month = ? AND year = ?',
      [userId, categoryId, month, year]
    );

    if (existing) {
      await db.runAsync(
        'UPDATE budgets SET amount = ? WHERE id = ?',
        [amount, existing.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO budgets (user_id, category_id, amount, month, year) VALUES (?, ?, ?, ?, ?)',
        [userId, categoryId, amount, month, year]
      );
    }

    return { success: true, message: BUDGET_MESSAGES.SET_SUCCESS };
  } catch (error) {
    console.error('Set Budget Error:', error);
    return { success: false, message: BUDGET_MESSAGES.SET_FAILED };
  }
};

export const getBudgets = async (userId, month, year) => {
  try {
    const db = await getDBConnection();

    const budgets = await db.getAllAsync(
      `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?`,
      [userId, month, year]
    );

    return { success: true, data: budgets };
  } catch (error) {
    console.error('Get Budgets Error:', error);
    return { success: false, message: BUDGET_MESSAGES.FETCH_FAILED, data: [] };
  }
};

export const deleteBudget = async (budgetId) => {
  try {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM budgets WHERE id = ?', [budgetId]);
    return { success: true, message: BUDGET_MESSAGES.DELETE_SUCCESS };
  } catch (error) {
    console.error('Delete Budget Error:', error);
    return { success: false, message: BUDGET_MESSAGES.DELETE_FAILED };
  }
};

export const getBudgetVsActual = async (userId, month, year) => {
  try {
    const db = await getDBConnection();

    const data = await db.getAllAsync(
      `SELECT
        b.amount as budget_amount,
        COALESCE(SUM(e.amount), 0) as spent_amount,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN expenses e ON e.category_id = b.category_id
         AND e.user_id = b.user_id
         AND strftime('%m', e.date) = ?
         AND strftime('%Y', e.date) = ?
       WHERE b.user_id = ? AND b.month = ? AND b.year = ?
       GROUP BY b.id`,
      [String(month).padStart(2, '0'), String(year), userId, month, year]
    );

    return { success: true, data };
  } catch (error) {
    console.error('Budget vs Actual Error:', error);
    return { success: false, message: BUDGET_MESSAGES.FETCH_FAILED, data: [] };
  }
};
