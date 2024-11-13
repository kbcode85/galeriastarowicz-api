import { factories } from '@strapi/strapi'
import { Context } from 'koa'
import { UserProfile, UpdateUserProfileBody, UserAddress, ExtendedUser } from '../../../types/user.types'

export default factories.createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
	async verifyToken(ctx: Context) {
		try {
			const user = ctx.state.user

			if (!user) {
				return ctx.unauthorized('Invalid token')
			}

			return {
				valid: true,
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				},
			}
		} catch (error) {
			console.error('Error verifying token:', error)
			return ctx.unauthorized('Invalid token')
		}
	},

	async getProfile(ctx: Context) {
		try {
			const user = ctx.state.user

			const profile = (await strapi.entityService.findOne('plugin::users-permissions.user', user.id, {
				populate: ['company', 'billingAddress', 'shippingAddress'],
			})) as ExtendedUser

			return {
				firstName: profile.firstName || null,
				lastName: profile.lastName || null,
				phone: profile.phone || null,
				company: profile.company || null,
				billingAddress: profile.billingAddress || null,
				shippingAddress: profile.shippingAddress || null,
			}
		} catch (error) {
			console.error('Error getting user profile:', error)
			ctx.throw(500, error.message)
		}
	},

	async updateProfile(ctx: Context) {
		try {
			const user = ctx.state.user
			const updateData: UpdateUserProfileBody = ctx.request.body

			// Przygotuj dane do aktualizacji
			const data: any = {}

			// Aktualizuj tylko przesłane pola
			if ('firstName' in updateData) {
				data.firstName = updateData.firstName === '' ? null : updateData.firstName
			}
			if ('lastName' in updateData) {
				data.lastName = updateData.lastName === '' ? null : updateData.lastName
			}
			if ('phone' in updateData) {
				data.phone = updateData.phone === '' ? null : updateData.phone
			}

			// Aktualizacja danych firmy
			if ('company' in updateData) {
				if (!updateData.company || Object.keys(updateData.company).length === 0) {
					data.company = null
				} else {
					data.company = {
						__component: 'user.company',
						...updateData.company,
					}
				}
			}

			// Aktualizacja adresu rozliczeniowego
			if ('billingAddress' in updateData) {
				if (!updateData.billingAddress || Object.keys(updateData.billingAddress).length === 0) {
					data.billingAddress = null
				} else {
					data.billingAddress = {
						__component: 'user.address',
						...updateData.billingAddress,
					}
				}
			}

			// Aktualizacja adresu dostawy
			if ('shippingAddress' in updateData) {
				if (!updateData.shippingAddress || Object.keys(updateData.shippingAddress).length === 0) {
					data.shippingAddress = null
				} else {
					data.shippingAddress = {
						__component: 'user.address',
						...updateData.shippingAddress,
					}
				}
			}

			console.log('Updating user with data:', JSON.stringify(data, null, 2))

			const updatedUser = (await strapi.entityService.update('plugin::users-permissions.user', user.id, {
				data,
				populate: ['company', 'billingAddress', 'shippingAddress'],
			})) as ExtendedUser

			return {
				firstName: updatedUser.firstName || null,
				lastName: updatedUser.lastName || null,
				phone: updatedUser.phone || null,
				company: updatedUser.company || null,
				billingAddress: updatedUser.billingAddress || null,
				shippingAddress: updatedUser.shippingAddress || null,
			}
		} catch (error) {
			console.error('Error updating user profile:', error)
			ctx.throw(500, error.message)
		}
	},
}))
