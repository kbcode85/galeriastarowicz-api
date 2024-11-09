import { factories } from '@strapi/strapi'
import { Context } from 'koa'
import { paymentService } from '../../../services/payment.service'
import {
	CreateCheckoutBody,
	PaymentResponse,
	RequestQuery,
	SubscriptionPaymentParams,
} from '../../../types/payment.types'
import { getLocaleFromRequest, getCurrencyForLocale, formatPrice } from '../../../utils/locale'

export default factories.createCoreController('api::subscription.subscription', ({ strapi }) => ({
	async createCheckout(ctx: Context) {
		try {
			const { planId, successUrl, cancelUrl, duration } = ctx.request.body as CreateCheckoutBody
			const user = ctx.state.user
			const locale = getLocaleFromRequest(ctx)
			const preferredCurrency = (ctx.query as RequestQuery).currency
			const currency = getCurrencyForLocale(locale, preferredCurrency)

			if (!planId || !successUrl || !cancelUrl || !duration) {
				return ctx.badRequest('Missing required fields')
			}

			const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
				where: { id: planId, isActive: true },
			})

			if (!plan) {
				return ctx.badRequest('Subscription plan not found or inactive')
			}

			const activeAmount = plan.prices?.[locale]?.[duration]?.[currency]

			if (!activeAmount || !activeAmount.isActive) {
				return ctx.badRequest(`No active amount found for ${duration} duration in ${currency}`)
			}

			const localeFeatures = plan.features?.[locale] || []
			const enabledFeatures = localeFeatures.filter(feature => feature.isEnabled)

			const description = [
				`${formatPrice(activeAmount.amount, currency, locale)} / ${
					duration === 'yearly' ? (locale === 'pl' ? 'rok' : 'year') : locale === 'pl' ? 'miesiąc' : 'month'
				}`,
				'',
				locale === 'pl' ? 'Zawiera:' : 'Includes:',
				...enabledFeatures.map(feature => `• ${feature.name}`),
			].join('\n')

			const paymentParams: SubscriptionPaymentParams = {
				amount: Math.round(activeAmount.amount * 100),
				currency,
				userId: user.id,
				type: 'subscription',
				method: 'stripe',
				successUrl,
				cancelUrl,
				customerEmail: user.email,
				name: plan.names[locale],
				description,
				metadata: {
					planId: plan.id.toString(),
					planLevel: plan.level,
					duration,
					currency,
					locale,
					userId: user.id.toString(),
					features: enabledFeatures.map(feature => feature.type).join(','),
				},
			}

			const session = (await paymentService.createPayment(strapi, paymentParams)) as PaymentResponse

			return {
				sessionId: session.sessionId,
				url: session.redirectUrl,
				paymentMethods: session.availablePaymentMethods,
				currency,
				amount: activeAmount.amount,
				formattedPrice: formatPrice(activeAmount.amount, currency, locale),
			}
		} catch (error) {
			return ctx.badRequest(error.message)
		}
	},
}))
