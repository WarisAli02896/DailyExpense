import { getDBConnection } from './database';

export const addOrUpdateTemplate = async ({ userId, type, entryType, title, amount, companyName }) => {
  try {
    const db = await getDBConnection();

    const existing = await db.getFirstAsync(
      `SELECT id FROM recurring_templates WHERE user_id = ? AND type = ? AND entry_type = ? AND LOWER(company_name) = LOWER(?)`,
      [userId, type, entryType, companyName || '']
    );

    if (existing) {
      await db.runAsync(
        'UPDATE recurring_templates SET title = ?, amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, amount, existing.id]
      );
      return { success: true, message: 'Template updated.', data: { id: existing.id } };
    }

    const result = await db.runAsync(
      'INSERT INTO recurring_templates (user_id, type, entry_type, title, amount, company_name) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, entryType, title, amount, companyName || null]
    );
    return { success: true, message: 'Template added.', data: { id: result.lastInsertRowId } };
  } catch (error) {
    console.error('Add/Update Template Error:', error);
    return { success: false, message: 'Failed to save recurring template.' };
  }
};

export const getTemplates = async (userId) => {
  try {
    const db = await getDBConnection();
    const templates = await db.getAllAsync(
      'SELECT * FROM recurring_templates WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return { success: true, data: templates };
  } catch (error) {
    console.error('Get Templates Error:', error);
    return { success: false, data: [] };
  }
};

export const updateTemplate = async (templateId, fields) => {
  try {
    const db = await getDBConnection();
    const setClauses = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [];

    if (fields.title !== undefined) { setClauses.push('title = ?'); values.push(fields.title); }
    if (fields.amount !== undefined) { setClauses.push('amount = ?'); values.push(fields.amount); }
    if (fields.companyName !== undefined) { setClauses.push('company_name = ?'); values.push(fields.companyName); }

    values.push(templateId);
    await db.runAsync(`UPDATE recurring_templates SET ${setClauses.join(', ')} WHERE id = ?`, values);
    return { success: true, message: 'Template updated.' };
  } catch (error) {
    console.error('Update Template Error:', error);
    return { success: false, message: 'Failed to update template.' };
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM recurring_templates WHERE id = ?', [templateId]);
    return { success: true, message: 'Template deleted.' };
  } catch (error) {
    console.error('Delete Template Error:', error);
    return { success: false, message: 'Failed to delete template.' };
  }
};
