export default {
  routes: [
    {
      method: 'POST',
      path: '/auctions/create-checkout',
      handler: 'auction.createCheckout',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
}; 