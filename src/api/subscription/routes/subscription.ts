export default {
	routes: [
		{
			method: 'POST',
			path: '/subscriptions/checkout',
			handler: 'subscription.createCheckout',
			config: {
				auth: {
					required: true,
				},
			},
		},
		{
			method: 'GET',
			path: '/subscriptions/status',
			handler: 'subscription.getStatus',
			config: {
				auth: {
					required: true,
				},
			},
		},
		{
			method: 'POST',
			path: '/subscriptions/check-expired',
			handler: 'subscription.checkExpired',
			config: {
				auth: {
					required: true
				}
			}
		}
	],
}
