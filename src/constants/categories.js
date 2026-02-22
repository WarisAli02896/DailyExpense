export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Food & Dining', icon: 'fast-food', color: '#FF6B6B' },
  { id: 2, name: 'Transport', icon: 'car', color: '#4ECDC4' },
  { id: 3, name: 'Shopping', icon: 'cart', color: '#45B7D1' },
  { id: 4, name: 'Bills & Utilities', icon: 'flash', color: '#96CEB4' },
  { id: 5, name: 'Entertainment', icon: 'game-controller', color: '#FFEAA7' },
  { id: 6, name: 'Health', icon: 'medkit', color: '#DDA0DD' },
  { id: 7, name: 'Education', icon: 'book', color: '#98D8C8' },
  { id: 8, name: 'Groceries', icon: 'basket', color: '#F7DC6F' },
  { id: 9, name: 'Rent', icon: 'home', color: '#BB8FCE' },
  { id: 10, name: 'Other', icon: 'ellipsis-horizontal', color: '#AEB6BF' },
];

export const CATEGORY_ICONS = {
  'Food & Dining': 'fast-food',
  'Transport': 'car',
  'Shopping': 'cart',
  'Bills & Utilities': 'flash',
  'Entertainment': 'game-controller',
  'Health': 'medkit',
  'Education': 'book',
  'Groceries': 'basket',
  'Rent': 'home',
  'Other': 'ellipsis-horizontal',
};

export const EARNING_TYPES = [
  { value: 'salary', label: 'Salary', icon: 'cash-outline' },
  { value: 'bonus', label: 'Bonus', icon: 'gift-outline' },
  { value: 'overtime', label: 'Overtime', icon: 'time-outline' },
  { value: 'advance', label: 'Advance', icon: 'arrow-forward-circle-outline' },
];

export const BILL_TYPES = [
  { value: 'electricity', label: 'Electricity', icon: 'flash-outline' },
  { value: 'gas', label: 'Gas', icon: 'flame-outline' },
  { value: 'water_supply', label: 'Water Supply', icon: 'water-outline' },
  { value: 'drinking_water', label: 'Drinking Water', icon: 'cafe-outline' },
  { value: 'credit_card', label: 'Credit Card', icon: 'card-outline' },
  { value: 'medicines', label: 'Medicines', icon: 'medkit-outline' },
];

export const ENTRY_TYPES = [
  { id: 'salary', label: 'Salary', icon: 'cash-outline', color: '#4CAF50', type: 'earning' },
  { id: 'expense', label: 'Expense', icon: 'cart-outline', color: '#F44336', type: 'spending' },
  { id: 'investment', label: 'Investment', icon: 'trending-up-outline', color: '#7C4DFF', type: 'spending' },
  { id: 'freelance', label: 'Freelance', icon: 'laptop-outline', color: '#2196F3', type: 'earning' },
  { id: 'bills', label: 'Bills', icon: 'flash-outline', color: '#FF9800', type: 'spending' },
];
