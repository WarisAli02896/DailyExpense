import { CURRENCIES } from '../constants/config';

export const formatCurrency = (amount, currencyCode = 'PKR') => {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = currency ? currency.symbol : 'Rs.';

  const formatted = Number(amount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${symbol} ${formatted}`;
};

export const formatAmount = (amount) => {
  return Number(amount)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseAmount = (amountString) => {
  const cleaned = amountString.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const getCurrencySymbol = (currencyCode = 'PKR') => {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return currency ? currency.symbol : 'Rs.';
};
