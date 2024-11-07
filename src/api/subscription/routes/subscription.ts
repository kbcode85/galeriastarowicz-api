export default {
  routes: [
    {
      method: 'POST',
      path: '/subscriptions/create-checkout',
      handler: 'subscription.createCheckout',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
}; 