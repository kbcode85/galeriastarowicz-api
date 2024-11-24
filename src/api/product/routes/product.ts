export default {
  routes: [
    // Publiczne endpointy
    {
      method: 'GET',
      path: '/products/public',
      handler: 'product.findPublic',
      config: {
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/products/public/:id',
      handler: 'product.findOnePublic',
      config: {
        auth: false
      }
    },
    // Prywatne endpointy (wymagają autoryzacji)
    {
      method: 'GET',
      path: '/products',
      handler: 'product.find',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'GET',
      path: '/products/:id',
      handler: 'product.findOne',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
} 