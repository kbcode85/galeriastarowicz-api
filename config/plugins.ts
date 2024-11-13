export default ({ env }) => ({
	email: {
		config: {
			provider: 'nodemailer',
			providerOptions: {
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT,
				auth: {
					user: process.env.SMTP_USERNAME,
					pass: process.env.SMTP_PASSWORD,
				},
			},
			settings: {
				defaultFrom: 'admin@galeriastarowicz.pl',
				defaultReplyTo: 'admin@galeriastarowicz.pl',
			},
		},
	},
	'users-permissions': {
		config: {
			jwt: {
				expiresIn: '7d',
			},
			register: {
				allowedFields: ['username', 'email', 'password', 'firstName', 'lastName', 'phone'],
			},
		},
	},
	i18n: {
		enabled: true,
		defaultLocale: 'pl',
		locales: ['pl', 'en'],
	},
	documentation: {
		enabled: true,
		config: {
			openapi: '3.0.0',
			info: {
				version: '1.0.0',
				title: 'Subscription API Documentation',
				description: 'API dokumentacja dla systemu subskrypcji',
				contact: {
					name: 'Support Team',
					email: 'support@example.com',
					url: 'https://example.com',
				},
				license: {
					name: 'MIT',
					url: 'https://opensource.org/licenses/MIT',
				},
			},
			'x-strapi-config': {
				plugins: ['users-permissions'],
				path: '/documentation',
			},
			servers: [
				{
					url: 'http://localhost:1337/api',
					description: 'Development server',
				},
			],
		},
	},
})
