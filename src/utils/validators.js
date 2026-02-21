export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z]+$/;
  return usernameRegex.test(username) && username.length <= 16;
};

export const validatePin = (pin) => {
  const pinRegex = /^\d{6}$/;
  return pinRegex.test(pin);
};

export const validateAmount = (amount) => {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && String(value).trim().length > 0;
};

export const validateExpenseForm = ({ title, amount, categoryId, date }) => {
  const errors = {};

  if (!validateRequired(title)) errors.title = 'Title is required';
  if (!validateRequired(amount)) errors.amount = 'Amount is required';
  else if (!validateAmount(amount)) errors.amount = 'Enter a valid amount greater than 0';
  if (!categoryId) errors.categoryId = 'Please select a category';
  if (!validateRequired(date)) errors.date = 'Date is required';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginForm = ({ username, pin }) => {
  const errors = {};

  if (!validateRequired(username)) errors.username = 'Username is required';
  else if (!validateUsername(username)) errors.username = 'Only letters allowed, max 16 characters';
  if (!validateRequired(pin)) errors.pin = 'PIN is required';
  else if (!validatePin(pin)) errors.pin = 'PIN must be exactly 6 digits';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRegisterForm = ({ username, pin }) => {
  const errors = {};

  if (!validateRequired(username)) errors.username = 'Username is required';
  else if (!/^[a-zA-Z]+$/.test(username)) errors.username = 'Only letters are allowed';
  else if (username.length > 16) errors.username = 'Maximum 16 characters allowed';
  if (!validateRequired(pin)) errors.pin = 'PIN is required';
  else if (!/^\d+$/.test(pin)) errors.pin = 'PIN must contain only digits';
  else if (pin.length !== 6) errors.pin = 'PIN must be exactly 6 digits';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
