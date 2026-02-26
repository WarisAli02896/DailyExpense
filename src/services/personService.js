import { getDBConnection } from './database';

export const addPerson = async (userId, name) => {
  try {
    const db = await getDBConnection();
    const result = await db.runAsync(
      'INSERT INTO persons (user_id, name, is_default, is_locked, is_active) VALUES (?, ?, 0, 0, 0)',
      [userId, name.trim()]
    );
    return { success: true, data: { id: result.lastInsertRowId, name: name.trim() } };
  } catch (error) {
    console.error('Add Person Error:', error);
    return { success: false, message: 'Failed to add person.' };
  }
};

export const getPersons = async (userId) => {
  try {
    const db = await getDBConnection();
    const persons = await db.getAllAsync(
      `SELECT p.*, COALESCE(SUM(e.amount), 0) as total_invested, COUNT(e.id) as entry_count
       FROM persons p
       LEFT JOIN entries e ON e.person_id = p.id AND e.show_in_account = 1
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.is_active DESC, p.is_default DESC, p.name ASC`,
      [userId]
    );
    return { success: true, data: persons };
  } catch (error) {
    console.error('Get Persons Error:', error);
    return { success: false, data: [] };
  }
};

export const getPersonEntries = async (personId) => {
  try {
    const db = await getDBConnection();
    const entries = await db.getAllAsync(
      `SELECT * FROM entries WHERE person_id = ? AND show_in_account = 1 ORDER BY date DESC, created_at DESC`,
      [personId]
    );
    return { success: true, data: entries };
  } catch (error) {
    console.error('Get Person Entries Error:', error);
    return { success: false, data: [] };
  }
};

export const deletePerson = async (personId) => {
  try {
    const db = await getDBConnection();

    const person = await db.getFirstAsync(
      'SELECT user_id, is_default, is_locked, is_active FROM persons WHERE id = ?',
      [personId]
    );

    if (!person) {
      return { success: false, message: 'Account not found.' };
    }

    if (person.is_default === 1) {
      return { success: false, message: 'Default account cannot be deleted.' };
    }

    if (person.is_locked === 1) {
      return { success: false, message: 'Locked account cannot be deleted.' };
    }

    if (person.is_active === 1) {
      return { success: false, message: 'Active account cannot be deleted. Set another account active first.' };
    }

    await db.runAsync('DELETE FROM persons WHERE id = ?', [personId]);
    return { success: true };
  } catch (error) {
    console.error('Delete Person Error:', error);
    return { success: false, message: 'Failed to delete person.' };
  }
};

export const setPersonLock = async (personId, locked) => {
  try {
    const db = await getDBConnection();
    const person = await db.getFirstAsync(
      'SELECT is_default FROM persons WHERE id = ?',
      [personId]
    );

    if (!person) {
      return { success: false, message: 'Account not found.' };
    }

    if (person.is_default === 1 && !locked) {
      return { success: false, message: 'Main account cannot be unlocked.' };
    }

    await db.runAsync(
      'UPDATE persons SET is_locked = ? WHERE id = ?',
      [locked ? 1 : 0, personId]
    );

    return { success: true };
  } catch (error) {
    console.error('Set Person Lock Error:', error);
    return { success: false, message: 'Failed to update account lock.' };
  }
};

export const setActivePerson = async (userId, personId) => {
  try {
    const db = await getDBConnection();
    const person = await db.getFirstAsync(
      'SELECT id FROM persons WHERE id = ? AND user_id = ?',
      [personId, userId]
    );

    if (!person) {
      return { success: false, message: 'Account not found.' };
    }

    await db.runAsync('UPDATE persons SET is_active = 0 WHERE user_id = ?', [userId]);
    await db.runAsync('UPDATE persons SET is_active = 1 WHERE id = ?', [personId]);
    return { success: true };
  } catch (error) {
    console.error('Set Active Person Error:', error);
    return { success: false, message: 'Failed to set active account.' };
  }
};

export const getActivePerson = async (userId) => {
  try {
    const db = await getDBConnection();
    const active = await db.getFirstAsync(
      'SELECT * FROM persons WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, name ASC LIMIT 1',
      [userId]
    );

    if (active) {
      return { success: true, data: active };
    }

    const fallback = await db.getFirstAsync(
      'SELECT * FROM persons WHERE user_id = ? ORDER BY is_default DESC, name ASC LIMIT 1',
      [userId]
    );

    if (fallback) {
      await db.runAsync('UPDATE persons SET is_active = 1 WHERE id = ?', [fallback.id]);
      return { success: true, data: { ...fallback, is_active: 1 } };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error('Get Active Person Error:', error);
    return { success: false, data: null };
  }
};
