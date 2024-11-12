module.exports = {
  async checkExpiredSubscriptions() {
    const strapi = global.strapi
    const now = new Date()

    try {
      // Znajdź wszystkie aktywne subskrypcje, które wygasły
      const expiredSubscriptions = await strapi.db
        .query('api::subscription.subscription')
        .findMany({
          where: {
            subscriptionStatus: 'active',
            endDate: {
              $lt: now
            }
          }
        })

      // Aktualizuj statusy wygasłych subskrypcji
      for (const subscription of expiredSubscriptions) {
        await strapi.db
          .query('api::subscription.subscription')
          .update({
            where: { id: subscription.id },
            data: { subscriptionStatus: 'expired' }
          })
        console.log(`Subscription ${subscription.id} marked as expired`)
      }

      return expiredSubscriptions.length
    } catch (error) {
      console.error('Error checking expired subscriptions:', error)
      return 0
    }
  }
} 