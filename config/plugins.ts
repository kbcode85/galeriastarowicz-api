export default () => ({
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
				secure: true,
			},
			settings: {
				defaultFrom: 'admin@galeriastarowicz.pl',
				defaultReplyTo: 'admin@galeriastarowicz.pl',
			},
		},
	},
})
