import { factories } from '@strapi/strapi'
import { Context } from 'koa'
import { Locale, SubscriptionPlan, Price, Feature } from '../../../types/subscription.types'

export default factories.createCoreController('api::subscription-plan.subscription-plan', ({ strapi }) => ({
	async find(ctx: Context) {
		try {
			const locale = (ctx.query.locale || 'pl') as Locale

			const entries = (await strapi.db.query('api::subscription-plan.subscription-plan').findMany({
				where: {
					isActive: true,
				},
			})) as SubscriptionPlan[]

			if (!entries || entries.length === 0) {
				return ctx.notFound({
					error: {
						status: 404,
						name: 'NotFoundError',
						message: 'No subscription plans found',
						details: {
							locale,
						},
					},
				})
			}

			const results = entries.map(entry => {
				const prices = {
					monthly: {},
					yearly: {},
				}

				// Przetwórz ceny miesięczne
				Object.entries(entry.prices[locale].monthly).forEach(([currency, price]: [string, Price]) => {
					if (price.isActive) {
						prices.monthly[currency] = {
							amount: price.amount,
						}
					}
				})

				// Przetwórz ceny roczne
				Object.entries(entry.prices[locale].yearly).forEach(([currency, price]: [string, Price]) => {
					if (price.isActive) {
						prices.yearly[currency] = {
							amount: price.amount,
						}
					}
				})

				// Filtruj włączone funkcje
				const features = entry.features[locale]
					.filter((feature: Feature) => feature.isEnabled)
					.map(({ name, description, type }: Feature) => ({
						name,
						description,
						type,
					}))

				return {
					id: entry.id,
					name: entry.names[locale],
					description: entry.descriptions[locale],
					level: entry.level,
					prices,
					features,
					sortOrder: entry.sortOrder,
				}
			})

			// Sprawdź czy po filtrowaniu mamy jakieś aktywne ceny
			const plansWithPrices = results.filter(
				plan => Object.keys(plan.prices.monthly).length > 0 || Object.keys(plan.prices.yearly).length > 0
			)

			if (plansWithPrices.length === 0) {
				return ctx.notFound({
					error: {
						status: 404,
						name: 'NotFoundError',
						message: 'No active subscription plans found for the specified locale',
						details: {
							locale,
						},
					},
				})
			}

			return { data: plansWithPrices }
		} catch (error) {
			return ctx.badRequest({
				error: {
					status: 400,
					name: 'BadRequestError',
					message: error.message,
					details: error,
				},
			})
		}
	},

	async findOne(ctx: Context) {
		try {
			const { id } = ctx.params
			const locale = (ctx.query.locale || 'pl') as Locale

			const entry = (await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
				where: {
					id,
					isActive: true,
				},
			})) as SubscriptionPlan

			if (!entry) {
				return ctx.notFound({
					error: {
						status: 404,
						name: 'NotFoundError',
						message: 'Subscription plan not found',
						details: {
							id,
							locale,
						},
					},
				})
			}

			const prices = {
				monthly: {},
				yearly: {},
			}

			// Przetwórz ceny miesięczne
			Object.entries(entry.prices[locale].monthly).forEach(([currency, price]: [string, Price]) => {
				if (price.isActive) {
					prices.monthly[currency] = {
						amount: price.amount,
					}
				}
			})

			// Przetwórz ceny roczne
			Object.entries(entry.prices[locale].yearly).forEach(([currency, price]: [string, Price]) => {
				if (price.isActive) {
					prices.yearly[currency] = {
						amount: price.amount,
					}
				}
			})

			// Sprawdź czy plan ma aktywne ceny
			if (Object.keys(prices.monthly).length === 0 && Object.keys(prices.yearly).length === 0) {
				return ctx.notFound({
					error: {
						status: 404,
						name: 'NotFoundError',
						message: 'No active prices found for the specified plan and locale',
						details: {
							id,
							locale,
						},
					},
				})
			}

			// Filtruj włączone funkcje
			const features = entry.features[locale]
				.filter((feature: Feature) => feature.isEnabled)
				.map(({ name, description, type }: Feature) => ({
					name,
					description,
					type,
				}))

			const result = {
				id: entry.id,
				name: entry.names[locale],
				description: entry.descriptions[locale],
				level: entry.level,
				prices,
				features,
				sortOrder: entry.sortOrder,
			}

			return { data: result }
		} catch (error) {
			return ctx.badRequest({
				error: {
					status: 400,
					name: 'BadRequestError',
					message: error.message,
					details: error,
				},
			})
		}
	},
}))
