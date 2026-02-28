import { getDBConnection } from './database';
import { saveUserSession } from './storageService';

const BACKUP_SCHEMA_VERSION = 1;

const parseArray = (value) => (Array.isArray(value) ? value : []);

export const exportUserBackup = async (userId) => {
  try {
    const db = await getDBConnection();
    const user = await db.getFirstAsync(
      'SELECT username, currency FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const persons = await db.getAllAsync(
      `SELECT id, name, is_default, is_locked, is_active, created_at
       FROM persons
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId]
    );

    const entries = await db.getAllAsync(
      `SELECT id, type, entry_type, title, amount, company_name, category_id, date, notes,
              is_recurring, invoice_uri, invoice_type, invoice_uri_2, invoice_type_2,
              person_id, show_in_account, created_at
       FROM entries
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId]
    );

    const budgets = await db.getAllAsync(
      `SELECT id, category_id, amount, month, year, created_at
       FROM budgets
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId]
    );

    const recurringTemplates = await db.getAllAsync(
      `SELECT id, type, entry_type, title, amount, company_name, person_id, created_at, updated_at
       FROM recurring_templates
       WHERE user_id = ?
       ORDER BY id ASC`,
      [userId]
    );

    return {
      success: true,
      data: {
        meta: {
          schemaVersion: BACKUP_SCHEMA_VERSION,
          createdAt: new Date().toISOString(),
        },
        user: {
          username: user.username,
          currency: user.currency,
        },
        persons,
        entries,
        budgets,
        recurringTemplates,
      },
    };
  } catch (error) {
    console.error('Export Backup Error:', error);
    return { success: false, message: 'Failed to export backup data.' };
  }
};

export const restoreUserBackup = async (userId, backupData) => {
  const payload = backupData || {};
  const persons = parseArray(payload.persons);
  const entries = parseArray(payload.entries);
  const budgets = parseArray(payload.budgets);
  const recurringTemplates = parseArray(payload.recurringTemplates);

  try {
    const db = await getDBConnection();
    const personIdMap = new Map();

    await db.execAsync('BEGIN TRANSACTION;');

    await db.runAsync('DELETE FROM entries WHERE user_id = ?', [userId]);
    await db.runAsync('DELETE FROM budgets WHERE user_id = ?', [userId]);
    await db.runAsync('DELETE FROM recurring_templates WHERE user_id = ?', [userId]);
    await db.runAsync('DELETE FROM persons WHERE user_id = ?', [userId]);

    for (const person of persons) {
      const result = await db.runAsync(
        `INSERT INTO persons (user_id, name, is_default, is_locked, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          person.name,
          Number(person.is_default || 0),
          Number(person.is_locked || 0),
          Number(person.is_active || 0),
          person.created_at || new Date().toISOString(),
        ]
      );
      personIdMap.set(person.id, result.lastInsertRowId);
    }

    if (persons.length === 0) {
      await db.runAsync(
        `INSERT INTO persons (user_id, name, is_default, is_locked, is_active, created_at)
         VALUES (?, ?, 1, 1, 1, ?)`,
        [userId, payload.user?.username || 'Main Account', new Date().toISOString()]
      );
    }

    for (const entry of entries) {
      await db.runAsync(
        `INSERT INTO entries (
          user_id, type, entry_type, title, amount, company_name, category_id, date, notes,
          is_recurring, invoice_uri, invoice_type, invoice_uri_2, invoice_type_2, person_id,
          show_in_account, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          entry.type,
          entry.entry_type,
          entry.title,
          entry.amount,
          entry.company_name ?? null,
          entry.category_id ?? null,
          entry.date,
          entry.notes ?? null,
          Number(entry.is_recurring || 0),
          entry.invoice_uri ?? null,
          entry.invoice_type ?? null,
          entry.invoice_uri_2 ?? null,
          entry.invoice_type_2 ?? null,
          personIdMap.get(entry.person_id) ?? null,
          Number(entry.show_in_account ?? 1),
          entry.created_at || new Date().toISOString(),
        ]
      );
    }

    for (const budget of budgets) {
      await db.runAsync(
        `INSERT INTO budgets (user_id, category_id, amount, month, year, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          budget.category_id ?? null,
          budget.amount,
          budget.month,
          budget.year,
          budget.created_at || new Date().toISOString(),
        ]
      );
    }

    for (const template of recurringTemplates) {
      await db.runAsync(
        `INSERT INTO recurring_templates (
          user_id, type, entry_type, title, amount, company_name, person_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          template.type,
          template.entry_type,
          template.title,
          template.amount,
          template.company_name ?? null,
          personIdMap.get(template.person_id) ?? null,
          template.created_at || new Date().toISOString(),
          template.updated_at || new Date().toISOString(),
        ]
      );
    }

    if (payload.user?.username || payload.user?.currency) {
      const currentUser = await db.getFirstAsync(
        'SELECT username, currency FROM users WHERE id = ?',
        [userId]
      );
      await db.runAsync(
        'UPDATE users SET username = ?, currency = ? WHERE id = ?',
        [
          payload.user?.username || currentUser?.username || 'User',
          payload.user?.currency || currentUser?.currency || 'PKR',
          userId,
        ]
      );
    }

    await db.execAsync('COMMIT;');

    const updatedUser = await db.getFirstAsync(
      'SELECT id, username, currency FROM users WHERE id = ?',
      [userId]
    );
    await saveUserSession(updatedUser);

    return {
      success: true,
      data: {
        user: updatedUser,
        persons: persons.length,
        entries: entries.length,
        budgets: budgets.length,
        recurringTemplates: recurringTemplates.length,
      },
    };
  } catch (error) {
    try {
      const db = await getDBConnection();
      await db.execAsync('ROLLBACK;');
    } catch (rollbackError) {
      console.error('Rollback Error:', rollbackError);
    }

    console.error('Restore Backup Error:', error);
    return { success: false, message: 'Failed to restore backup data.' };
  }
};
