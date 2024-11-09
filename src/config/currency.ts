export const SUPPORTED_CURRENCIES = {
  pl: ['PLN'],
  en: ['EUR', 'USD']
} as const;

export const CURRENCY_SYMBOLS = {
  PLN: 'zł',
  EUR: '€',
  USD: '$'
} as const;

export const DEFAULT_CURRENCY_BY_LOCALE = {
  pl: 'PLN',
  en: 'EUR'
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_CURRENCIES;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[SupportedLocale][number]; 