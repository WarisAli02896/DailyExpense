import { getDBConnection } from './database';
import { formatDateForDB } from '../utils/dateUtils';

export const addEntry = async ({ userId, type, entryType, title, amount, companyName, categoryId, date, notes, isRecurring }) => {
  try {
    const db = await getDBConnection();
    const dateStr = date || formatDateForDB(new Date());

    const result = await db.runAsync(
      `INSERT INTO entries (user_id, type, entry_type, title, amount, company_name, category_id, date, notes, is_recurring)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, entryType, title, amount, companyName || null, categoryId || null, dateStr, notes || null, isRecurring ? 1 : 0]
    );

    return { success: true, message: 'Entry added successfully!', data: { id: result.lastInsertRowId } };
  } catch (error) {
    console.error('Add Entry Error:', error);
    return { success: false, message: 'Failed to add entry.' };
  }
};

export const getEntriesByMonth = async (userId, month, year) => {
  try {
    const db = await getDBConnection();
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year);

    const entries = await db.getAllAsync(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = ? AND strftime('%m', e.date) = ? AND strftime('%Y', e.date) = ?
       ORDER BY e.date DESC, e.created_at DESC`,
      [userId, mm, yyyy]
    );

    return { success: true, data: entries };
  } catch (error) {
    console.error('Get Entries Error:', error);
    return { success: false, data: [] };
  }
};

export const getMonthSummary = async (userId, month, year) => {
  try {
    const db = await getDBConnection();
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year);

    const earnings = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) as total FROM entries
       WHERE user_id = ? AND type = 'earning' AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`,
      [userId, mm, yyyy]
    );

    const spendings = await db.getFirstAsync(
      `SELECT COALESCE(SUM(amount), 0) as total FROM entries
       WHERE user_id = ? AND type = 'spending' AND strftime('%m', date) = ? AND strftime('%Y', date) = ?`,
      [userId, mm, yyyy]
    );

    return {
      success: true,
      data: {
        totalEarnings: earnings.total,
        totalSpendings: spendings.total,
        amountLeft: earnings.total - spendings.total,
      },
    };
  } catch (error) {
    console.error('Get Summary Error:', error);
    return { success: false, data: { totalEarnings: 0, totalSpendings: 0, amountLeft: 0 } };
  }
};

export const deleteEntry = async (entryId) => {
  try {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM entries WHERE id = ?', [entryId]);
    return { success: true, message: 'Entry deleted successfully!' };
  } catch (error) {
    console.error('Delete Entry Error:', error);
    return { success: false, message: 'Failed to delete entry.' };
  }
};
