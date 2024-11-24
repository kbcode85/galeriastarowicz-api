export default {
  routes: [
    {
      method: 'POST',
      path: '/admin/products',
      handler: 'product.adminCreate',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'PUT',
      path: '/admin/products/:id',
      handler: 'product.adminUpdate',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'DELETE',
      path: '/admin/products/:id',
      handler: 'product.adminDelete',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
} 