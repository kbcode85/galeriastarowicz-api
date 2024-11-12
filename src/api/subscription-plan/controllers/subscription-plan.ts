import { factories } from '@strapi/strapi'
import { Context } from 'koa'

interface Price {
	id: number
	currency: 'PLN' | 'EUR' | 'USD'
	duration: 'monthly' | 'yearly'
	amount: number
	isActive: boolean
}

interface SubscriptionPlan {
	id: number
	name: string
	description: string
	isActive: boolean
	level: 'basic'
	prices?: Price[]
}

export default factories.createCoreController('api::subscription-plan.subscription-plan', ({ strapi }) => ({
	async find(ctx: Context) {
		try {
			const locale = ctx.query.locale || 'pl'
			
			const entries = await strapi.entityService.findMany('api::subscription-plan.subscription-plan', {
				filters: { isActive: true },
				populate: ['prices'],
				locale,
			}) as SubscriptionPlan[]

			const formattedPlans = entries.map(plan => {
				if (!plan.prices) return null

				const prices = plan.prices.reduce((acc, price) => {
					if (price?.isActive) {
						if (!acc[price.currency]) {
							acc[price.currency] = {}
						}
						acc[price.currency][price.duration] = price.amount
					}
					return acc
				}, {} as Record<string, Record<string, number>>)

				return {
					id: plan.id,
					name: plan.name,
					description: plan.description,
					level: plan.level,
					prices,
				}
			}).filter(Boolean)

			return {
				data: formattedPlans,
				meta: {
					locale,
				}
			}
		} catch (error) {
			ctx.throw(500, error.message)
		}
	},

	async findOne(ctx: Context) {
		try {
			const { id } = ctx.params
			const locale = ctx.query.locale || 'pl'

			const plan = await strapi.entityService.findOne('api::subscription-plan.subscription-plan', id, {
				populate: ['prices'],
				locale,
			}) as SubscriptionPlan

			if (!plan) {
				return ctx.notFound('Plan not found')
			}

			if (!plan.prices) {
				return ctx.notFound('No prices found for this plan')
			}

			const prices = plan.prices.reduce((acc, price) => {
				if (price?.isActive) {
					if (!acc[price.currency]) {
						acc[price.currency] = {}
					}
					acc[price.currency][price.duration] = price.amount
				}
				return acc
			}, {} as Record<string, Record<string, number>>)

			return {
				data: {
					id: plan.id,
					name: plan.name,
					description: plan.description,
					level: plan.level,
					prices,
				},
				meta: {
					locale,
				}
			}
		} catch (error) {
			ctx.throw(500, error.message)
		}
	}
}))
