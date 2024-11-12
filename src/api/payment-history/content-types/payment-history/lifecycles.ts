module.exports = {
  async afterUpdate(event) {
    const { result, params } = event
    const { data } = params
    const strapi = global.strapi

    if (!data.paymentStatus || !result) {
      return
    }

    try {
      interface PaymentUpdateData {
        completedAt?: Date;
        failedAt?: Date;
        refundedAt?: Date;
      }

      const updateData: PaymentUpdateData = {}
      const now = new Date()

      switch (data.paymentStatus) {
        case 'completed':
          updateData.completedAt = now
          break
        case 'failed':
          updateData.failedAt = now
          break
        case 'refunded':
          updateData.refundedAt = now
          break
      }

      if (Object.keys(updateData).length > 0) {
        await strapi.db
          .query('api::payment-history.payment-history')
          .update({
            where: { id: result.id },
            data: updateData
          })
      }

      const payment = await strapi.db
        .query('api::payment-history.payment-history')
        .findOne({
          where: { id: result.id },
          populate: ['subscription']
        })

      if (!payment?.subscription?.id) {
        return
      }

      let subscriptionStatus
      let subscriptionData = {}

      switch (data.paymentStatus) {
        case 'pending':
          subscriptionStatus = 'pending_payment'
          break
        case 'completed':
          subscriptionStatus = 'active'
          const startDate = now
          const endDate = new Date(now)
          
          const subscription = await strapi.db
            .query('api::subscription.subscription')
            .findOne({
              where: { id: payment.subscription.id }
            })

          if (subscription.subscriptionDuration === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1)
          } else {
            endDate.setMonth(endDate.getMonth() + 1)
          }

          subscriptionData = {
            startDate,
            endDate
          }
          break
        case 'failed':
          subscriptionStatus = 'cancelled'
          break
        case 'refunded':
          subscriptionStatus = 'cancelled'
          break
        default:
          return
      }

      await strapi.db
        .query('api::subscription.subscription')
        .update({
          where: { id: payment.subscription.id },
          data: { 
            subscriptionStatus,
            ...subscriptionData
          }
        })

      console.log(`Payment lifecycle: Updated payment dates and subscription ${payment.subscription.id}`, {
        paymentStatus: data.paymentStatus,
        paymentDates: updateData,
        subscriptionStatus,
        subscriptionData
      })
    } catch (error) {
      console.error('Error in payment lifecycle hook:', error)
    }
  }
} 