export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/create-checkout',
      handler: 'order.createCheckout',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
}; 