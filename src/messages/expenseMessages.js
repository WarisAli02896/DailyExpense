export const EXPENSE_MESSAGES = {
  // Success
  ADD_SUCCESS: 'Expense added successfully!',
  UPDATE_SUCCESS: 'Expense updated successfully!',
  DELETE_SUCCESS: 'Expense deleted successfully!',

  // Error
  ADD_FAILED: 'Failed to add expense. Please try again.',
  UPDATE_FAILED: 'Failed to update expense. Please try again.',
  DELETE_FAILED: 'Failed to delete expense. Please try again.',
  FETCH_FAILED: 'Failed to load expenses. Please try again.',

  // Validation
  TITLE_REQUIRED: 'Expense title is required.',
  AMOUNT_REQUIRED: 'Amount is required.',
  AMOUNT_INVALID: 'Please enter a valid amount.',
  AMOUNT_POSITIVE: 'Amount must be greater than 0.',
  CATEGORY_REQUIRED: 'Please select a category.',
  DATE_REQUIRED: 'Date is required.',
  DATE_INVALID: 'Please enter a valid date.',

  // Invoice
  INVOICE_PICK_FAILED: 'Could not pick file. Please try again.',
  INVOICE_SAVE_FAILED: 'Failed to save invoice file.',
  INVOICE_OPEN_FAILED: 'Cannot open this file.',

  // Info
  NO_EXPENSES: 'No expenses found. Start adding your expenses!',
  CONFIRM_DELETE: 'Are you sure you want to delete this expense?',
};
