export default {
  routes: [
    {
      method: 'POST',
      path: '/admin/categories',
      handler: 'category.adminCreate',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'PUT',
      path: '/admin/categories/:id',
      handler: 'category.adminUpdate',
      config: {
        auth: {
          required: true
        }
      }
    },
    {
      method: 'DELETE',
      path: '/admin/categories/:id',
      handler: 'category.adminDelete',
      config: {
        auth: {
          required: true
        }
      }
    }
  ]
} 