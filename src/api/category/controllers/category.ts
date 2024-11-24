import { factories } from '@strapi/strapi'
import { Context } from 'koa'

export default factories.createCoreController('api::category.category', ({ strapi }) => ({
	async find(ctx: Context) {
		try {
			const { lang = 'pl' } = ctx.query

			const categories = await strapi.db.query('api::category.category').findMany({
				populate: {
					thumbnail: true,
					products: {
						select: ['id'],
					},
				},
			})

			return categories.map(category => ({
				id: category.id,
				name: lang === 'pl' ? category.namePL : category.nameEN,
				description: lang === 'pl' ? category.descriptionPL : category.descriptionEN,
				thumbnail: category.thumbnail,
				slug: category.slug,
				productsCount: category.products?.length || 0,
			}))
		} catch (error) {
			ctx.throw(500, error.message)
		}
	},

	async findOne(ctx: Context) {
		try {
			const { id } = ctx.params
			const { lang = 'pl' } = ctx.query

			const category = await strapi.db.query('api::category.category').findOne({
				where: { id },
				populate: {
					thumbnail: true,
					products: {
						populate: {
							thumbnail: true,
							prices: true,
						},
					},
				},
			})

			if (!category) {
				return ctx.notFound('Category not found')
			}

			return {
				id: category.id,
				name: lang === 'pl' ? category.namePL : category.nameEN,
				description: lang === 'pl' ? category.descriptionPL : category.descriptionEN,
				thumbnail: category.thumbnail,
				slug: category.slug,
				products: category.products?.map(product => ({
					id: product.id,
					name: lang === 'pl' ? product.namePL : product.nameEN,
					thumbnail: product.thumbnail,
					price: product.prices.pricePLN,
					slug: product.slug,
				})),
			}
		} catch (error) {
			ctx.throw(500, error.message)
		}
	},

	async adminCreate(ctx: Context) {
		try {
			// Sprawdź czy użytkownik ma rolę administratora
			if (ctx.state.user.role.type !== 'administrator') {
				return ctx.forbidden('Only administrators can perform this action')
			}

			const data = ctx.request.body

			// Walidacja wymaganych pól
			const requiredFields = ['namePL', 'nameEN', 'slug']
			for (const field of requiredFields) {
				if (!data[field]) {
					return ctx.badRequest(`Field ${field} is required`)
				}
			}

			// Sprawdź unikalność sluga
			const existingCategory = await strapi.db.query('api::category.category').findOne({
				where: { slug: data.slug },
			})

			if (existingCategory) {
				return ctx.badRequest('Category with this slug already exists')
			}

			const category = await strapi.db.query('api::category.category').create({
				data: {
					...data,
					createdBy: ctx.state.user.id,
				},
				populate: {
					thumbnail: true,
				},
			})

			return category
		} catch (error) {
			ctx.throw(500, error.message)
		}
	},

	async adminUpdate(ctx: Context) {
		try {
			// Sprawdź czy użytkownik ma rolę administratora
			if (ctx.state.user.role.type !== 'administrator') {
				return ctx.forbidden('Only administrators can perform this action')
			}

			const { id } = ctx.params
			const data = ctx.request.body

			// Sprawdź czy kategoria istnieje
			const existingCategory = await strapi.db.query('api::category.category').findOne({
				where: { id },
			})

			if (!existingCategory) {
				return ctx.notFound('Category not found')
			}

			// Sprawdź unikalność sluga jeśli jest zmieniany
			if (data.slug && data.slug !== existingCategory.slug) {
				const slugExists = await strapi.db.query('api::category.category').findOne({
					where: { slug: data.slug },
				})

				if (slugExists) {
					return ctx.badRequest('Category with this slug already exists')
				}
			}

			const category = await strapi.db.query('api::category.category').update({
				where: { id },
				data: {
					...data,
					updatedBy: ctx.state.user.id,
				},
				populate: {
					thumbnail: true,
				},
			})

			return category
		} catch (error) {
			ctx.throw(500, error.message)
		}
	},

	async adminDelete(ctx: Context) {
		try {
			// Sprawdź czy użytkownik ma rolę administratora
			if (ctx.state.user.role.type !== 'administrator') {
				return ctx.forbidden('Only administrators can perform this action')
			}

			const { id } = ctx.params

			// Sprawdź czy kategoria istnieje
			const existingCategory = await strapi.db.query('api::category.category').findOne({
				where: { id },
			})

			if (!existingCategory) {
				return ctx.notFound('Category not found')
			}

			await strapi.db.query('api::category.category').delete({
				where: { id },
			})

			return { success: true }
		} catch (error) {
			ctx.throw(500, error.message)
		}
	},
}))
