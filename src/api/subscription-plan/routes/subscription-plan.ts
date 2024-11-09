export default {
	routes: [
		{
			method: 'GET',
			path: '/subscription-plans',
			handler: 'subscription-plan.find',
			config: {
				auth: false,
			},
		},
		{
			method: 'GET',
			path: '/subscription-plans/:id',
			handler: 'subscription-plan.findOne',
			config: {
				auth: false,
			},
		},
	],
}
