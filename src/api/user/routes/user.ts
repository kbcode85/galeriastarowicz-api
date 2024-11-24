export default {
	routes: [
		{
			method: 'GET',
			path: '/users/verify-token',
			handler: 'user.verifyToken',
			config: {
				auth: {
					required: true,
				},
			},
		},
		{
			method: 'GET',
			path: '/users/profile',
			handler: 'user.getProfile',
			config: {
				auth: {
					required: true,
				},
			},
		},
		{
			method: 'PUT',
			path: '/users/profile',
			handler: 'user.updateProfile',
			config: {
				auth: {
					required: true,
				},
			},
		},
		{
			method: 'GET',
			path: '/users/role',
			handler: 'user.getRole',
			config: {
				auth: {
					required: true,
				},
			},
		},
	],
}
