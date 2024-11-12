export default {
  'check-expired-subscriptions': {
    task: async ({ strapi }) => {
      const expiredCount = await strapi
        .service('api::subscription.subscription')
        .checkExpiredSubscriptions()
      
      if (expiredCount > 0) {
        console.log(`Marked ${expiredCount} subscriptions as expired`)
      }
    },
    options: {
      rule: '0 0 * * *', // Uruchamia się codziennie o północy
    },
  },
} 