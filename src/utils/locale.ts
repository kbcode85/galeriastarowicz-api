import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY_BY_LOCALE } from '../config/currency'
import { Context } from 'koa'
import { RequestQuery } from '../types/payment.types'

type SupportedLocale = 'pl' | 'en'
type SupportedCurrency = 'PLN' | 'EUR' | 'USD'

export const getLocaleFromRequest = (ctx: Context): SupportedLocale => {
	const requestLocale =
		(ctx.query as RequestQuery).locale || ctx.request.header['accept-language']?.split(',')[0] || 'pl'
	return requestLocale.substring(0, 2) as SupportedLocale
}

export const getCurrencyForLocale = (
	locale: SupportedLocale,
	preferredCurrency?: string
): SupportedCurrency => {
	if (locale === 'pl') return 'PLN'

	const supportedCurrencies = SUPPORTED_CURRENCIES[locale]
	if (Array.isArray(supportedCurrencies) && preferredCurrency) {
		if (supportedCurrencies.includes(preferredCurrency as SupportedCurrency)) {
			return preferredCurrency as SupportedCurrency
		}
	}

	return DEFAULT_CURRENCY_BY_LOCALE[locale]
}

export const formatPrice = (
	amount: number,
	currency: SupportedCurrency,
	locale: SupportedLocale
): string => {
	return new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
		style: 'currency',
			currency: currency
	}).format(amount)
}
