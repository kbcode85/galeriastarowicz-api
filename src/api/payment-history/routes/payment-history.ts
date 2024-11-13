export default {
	routes: [
		{
			method: 'GET',
			path: '/payment-history/:paymentId',
			handler: 'payment-history.findByPaymentId',
			config: {
				auth: {
					required: true,
				},
			},
		},
	],
}
