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
				allowedFields: [
					'username',
					'email',
					'password',
					'firstName',
					'lastName',
					'phone',
				],
			},
		},
	},
	i18n: {
		enabled: true,
		defaultLocale: 'pl',
		locales: ['pl', 'en'],
	},
})
