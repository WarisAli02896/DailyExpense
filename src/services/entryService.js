import { getDBConnection } from './database';
import { formatDateForDB } from '../utils/dateUtils';

export const addEntry = async ({ userId, type, entryType, title, amount, companyName, categoryId, date, notes, isRecurring, invoiceUri, invoiceType, personId }) => {
  try {
    const db = await getDBConnection();
    const dateStr = date || formatDateForDB(new Date());

    const result = await db.runAsync(
      `INSERT INTO entries (user_id, type, entry_type, title, amount, company_name, category_id, date, notes, is_recurring, invoice_uri, invoice_type, person_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, entryType, title, amount, companyName || null, categoryId || null, dateStr, notes || null, isRecurring ? 1 : 0, invoiceUri || null, invoiceType || null, personId || null]
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
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color, p.name as person_name
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN persons p ON e.person_id = p.id
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

export const getRecurringEntries = async (userId) => {
  try {
    const db = await getDBConnection();
    const entries = await db.getAllAsync(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color, p.name as person_name
       FROM entries e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN persons p ON e.person_id = p.id
       WHERE e.user_id = ? AND e.is_recurring = 1
       ORDER BY e.date DESC, e.created_at DESC`,
      [userId]
    );
    return { success: true, data: entries };
  } catch (error) {
    console.error('Get Recurring Entries Error:', error);
    return { success: false, data: [] };
  }
};

export const updateEntry = async (entryId, fields) => {
  try {
    const db = await getDBConnection();
    const setClauses = [];
    const values = [];

    if (fields.title !== undefined) { setClauses.push('title = ?'); values.push(fields.title); }
    if (fields.amount !== undefined) { setClauses.push('amount = ?'); values.push(fields.amount); }
    if (fields.companyName !== undefined) { setClauses.push('company_name = ?'); values.push(fields.companyName); }
    if (fields.notes !== undefined) { setClauses.push('notes = ?'); values.push(fields.notes); }
    if (fields.isRecurring !== undefined) { setClauses.push('is_recurring = ?'); values.push(fields.isRecurring ? 1 : 0); }

    if (setClauses.length === 0) return { success: false, message: 'No fields to update.' };

    values.push(entryId);
    await db.runAsync(`UPDATE entries SET ${setClauses.join(', ')} WHERE id = ?`, values);
    return { success: true, message: 'Entry updated successfully!' };
  } catch (error) {
    console.error('Update Entry Error:', error);
    return { success: false, message: 'Failed to update entry.' };
  }
};

export const updateRecurringEntry = async (oldEntry, newFields) => {
  try {
    const db = await getDBConnection();

    await db.runAsync('UPDATE entries SET is_recurring = 0 WHERE id = ?', [oldEntry.id]);

    const dateStr = formatDateForDB(new Date());
    const result = await db.runAsync(
      `INSERT INTO entries (user_id, type, entry_type, title, amount, company_name, category_id, date, notes, is_recurring, invoice_uri, invoice_type, person_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [
        oldEntry.user_id,
        oldEntry.type,
        oldEntry.entry_type,
        newFields.title,
        newFields.amount,
        newFields.companyName || oldEntry.company_name || null,
        oldEntry.category_id || null,
        dateStr,
        oldEntry.notes || null,
        oldEntry.invoice_uri || null,
        oldEntry.invoice_type || null,
        oldEntry.person_id || null,
      ]
    );

    return { success: true, message: 'Recurring entry updated for upcoming months!', data: { id: result.lastInsertRowId } };
  } catch (error) {
    console.error('Update Recurring Entry Error:', error);
    return { success: false, message: 'Failed to update recurring entry.' };
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
