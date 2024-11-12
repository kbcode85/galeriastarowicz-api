import { factories } from '@strapi/strapi'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2024-10-28.acacia',
})

interface PaymentHistoryData {
	id: number
	paymentId: string
	subscription?: {
		id: number
	}
}

export default factories.createCoreController('api::webhook.webhook', ({ strapi }) => ({
	async stripe(ctx) {
		const signature = ctx.request.headers['stripe-signature']

		try {
			const rawBody = ctx.request.body[Symbol.for('unparsedBody')]

			const event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)

			switch (event.type) {
				case 'checkout.session.completed': {
					const session = event.data.object as Stripe.Checkout.Session
					const payment = await strapi.db.query('api::payment-history.payment-history').findOne({
						where: {
							stripeSessionId: session.id,
							paymentId: session.metadata?.paymentId || session.client_reference_id,
						},
						populate: ['subscription'],
					})

					if (!payment) {
						throw new Error('Payment not found')
					}

					await strapi.db.query('api::payment-history.payment-history').update({
						where: { id: payment.id },
						data: {
							paymentStatus: 'completed',
							stripePaymentId: session.payment_intent as string,
						},
					})

					console.log(
						`Webhook: Updated payment ${payment.paymentId} (${payment.id}) status to completed with payment intent ${session.payment_intent}`
					)
					break
				}

				case 'charge.refunded': {
					const charge = event.data.object as Stripe.Charge
					const payment = await strapi.db.query('api::payment-history.payment-history').findOne({
						where: { stripePaymentId: charge.payment_intent as string },
						populate: ['subscription'],
					})

					if (!payment) {
						throw new Error('Payment not found')
					}

					await strapi.db.query('api::payment-history.payment-history').update({
						where: { id: payment.id },
						data: {
							paymentStatus: 'refunded',
						},
					})

					console.log(`Webhook: Updated payment ${payment.id} status to refunded`)
					break
				}

				case 'payment_intent.payment_failed': {
					const paymentIntent = event.data.object as Stripe.PaymentIntent
					const payment = await strapi.db.query('api::payment-history.payment-history').findOne({
						where: { stripePaymentId: paymentIntent.id },
						populate: ['subscription'],
					})

					if (!payment) {
						throw new Error('Payment not found')
					}

					await strapi.db.query('api::payment-history.payment-history').update({
						where: { id: payment.id },
						data: {
							paymentStatus: 'failed',
						},
					})

					console.log(`Webhook: Updated payment ${payment.id} status to failed`)
					break
				}

				case 'checkout.session.expired': {
					const session = event.data.object as Stripe.Checkout.Session
					const payment = await strapi.db.query('api::payment-history.payment-history').findOne({
						where: { stripeSessionId: session.id },
						populate: ['subscription'],
					})

					if (!payment) {
						throw new Error('Payment not found')
					}

					await strapi.db.query('api::payment-history.payment-history').update({
						where: { id: payment.id },
						data: {
							paymentStatus: 'failed',
						},
					})

					console.log(`Webhook: Updated payment ${payment.id} status to failed (session expired)`)
					break
				}
			}

			return { success: true }
		} catch (err) {
			console.error('Webhook error:', err)
			ctx.throw(400, `Webhook Error: ${err.message}`)
		}
	},
}))
