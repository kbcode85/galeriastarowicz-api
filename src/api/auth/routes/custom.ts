export default {
  routes: [
    {
      method: 'POST',
      path: '/auth/custom-register',
      handler: 'custom.register',
      config: {
        auth: {
          required: false
        }
      }
    }
  ]
}; 