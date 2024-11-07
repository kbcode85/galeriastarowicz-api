export default {
  routes: [
    {
      method: 'POST',
      path: '/subscription-plans/create-defaults',
      handler: 'subscription-plan.createDefaultPlans',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
}; 