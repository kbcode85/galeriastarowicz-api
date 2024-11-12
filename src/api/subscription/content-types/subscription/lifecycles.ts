module.exports = {
  async beforeUpdate(event) {
    const { params } = event
    const { where, data } = params
    const strapi = global.strapi

    try {
      const subscription = await strapi.db
        .query('api::subscription.subscription')
        .findOne({
          where: { id: where.id },
        })

      if (!subscription) {
        return
      }

      // Sprawdź czy data końca subskrypcji minęła
      const now = new Date()
      const endDate = new Date(subscription.endDate)

      if (endDate < now && subscription.subscriptionStatus === 'active') {
        data.subscriptionStatus = 'expired'
        console.log(`Subscription ${subscription.id} expired`)
      }
    } catch (error) {
      console.error('Error in subscription beforeUpdate hook:', error)
    }
  }
} 