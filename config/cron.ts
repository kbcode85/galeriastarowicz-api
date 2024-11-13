export default {
  'check-expired-subscriptions': {
    task: async ({ strapi }) => {
      try {
        const expiredCount = await strapi
          .service('api::subscription.subscription')
          .checkExpiredSubscriptions()
        
        if (expiredCount > 0) {
          console.log(`[Cron ${new Date().toISOString()}] Marked ${expiredCount} subscriptions as expired`)
        }
      } catch (error) {
        console.error('[Cron] Error checking expired subscriptions:', error)
      }
    },
    options: {
      rule: '* * * * *', // Co minutę
      tz: 'Europe/Warsaw' // Dodajemy strefę czasową
    },
  },
} 