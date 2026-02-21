import { getDBConnection } from './database';

export const addPerson = async (userId, name) => {
  try {
    const db = await getDBConnection();
    const result = await db.runAsync(
      'INSERT INTO persons (user_id, name) VALUES (?, ?)',
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
       LEFT JOIN entries e ON e.person_id = p.id AND e.entry_type = 'investment'
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.name ASC`,
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
      `SELECT * FROM entries WHERE person_id = ? ORDER BY date DESC, created_at DESC`,
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
    await db.runAsync('DELETE FROM persons WHERE id = ?', [personId]);
    return { success: true };
  } catch (error) {
    console.error('Delete Person Error:', error);
    return { success: false, message: 'Failed to delete person.' };
  }
};
