export default {
  routes: [
    {
      method: 'POST',
      path: '/payments/create-checkout',
      handler: 'payment.createCheckout',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'POST',
      path: '/payments/webhook',
      handler: 'payment.webhook',
      config: {
        auth: {
          required: false
        }
      }
    }
  ]
}; 