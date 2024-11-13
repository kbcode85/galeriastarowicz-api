import { factories } from '@strapi/strapi'
import { Context } from 'koa'

export default factories.createCoreController('api::payment-history.payment-history', ({ strapi }) => ({
  async findByPaymentId(ctx: Context) {
    try {
      const { paymentId } = ctx.params
      const user = ctx.state.user

      const payment = await strapi.db
        .query('api::payment-history.payment-history')
        .findOne({
          where: { 
            paymentId,
            user: user.id
          },
          populate: ['subscription']
        })

      if (!payment) {
        return ctx.notFound('Payment not found')
      }

      return {
        paymentId: payment.paymentId,
        method: payment.method,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.paymentStatus,
        billingAddress: payment.billingAddress,
        subscription: payment.subscription ? {
          id: payment.subscription.id,
          subscriptionId: payment.subscription.subscriptionId,
          status: payment.subscription.subscriptionStatus
        } : null,
        metadata: payment.metadata,
        dates: {
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          failedAt: payment.failedAt,
          refundedAt: payment.refundedAt
        },
        bankDetails: payment.method === 'bank_transfer' ? payment.bankTransferDetails : null,
        stripeDetails: payment.method === 'stripe' ? {
          sessionId: payment.stripeSessionId,
          paymentId: payment.stripePaymentId
        } : null
      }
    } catch (error) {
      console.error('Error finding payment:', error)
      ctx.throw(500, error.message)
    }
  }
})) 