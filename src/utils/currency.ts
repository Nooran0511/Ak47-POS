// Currency formatting utilities for Pakistani Rupees

export const CURRENCY_SYMBOL = 'Rs.';
export const CURRENCY_CODE = 'PKR';

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}

export function formatCurrencyShort(amount: number): string {
  if (amount >= 1000000) {
    return `${CURRENCY_SYMBOL} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${CURRENCY_SYMBOL} ${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}
