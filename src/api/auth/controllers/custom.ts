export default {
	async register(ctx) {
		const { email, password, username, firstName, lastName, phone, company, billingAddress, shippingAddress } =
			ctx.request.body

		try {
			// Walidacja wymaganych pól
			if (!email || !password || !username) {
				return ctx.badRequest('Email, password and username are required')
			}

			// Sprawdzenie czy email już istnieje
			const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
				where: { email },
			})

			if (existingUser) {
				return ctx.badRequest('Email already exists')
			}

			// Pobranie roli "authenticated"
			const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
				where: { type: 'authenticated' },
			})

			// Utworzenie użytkownika
			const user = await strapi.plugins['users-permissions'].services.user.add({
				email,
				username,
				password,
				role: authenticatedRole.id,
				firstName,
				lastName,
				phone,
				company,
				billingAddress,
				shippingAddress,
				confirmed: true,
				provider: 'local',
			})

			// Generowanie JWT
			const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
				id: user.id,
			})

			// Wysłanie emaila powitalnego
			try {
				await strapi.plugins['email'].services.email.send({
					to: user.email,
					subject: 'Welcome to Galeria Starowicz',
					text: `Welcome ${user.firstName}! Your account has been created successfully.`,
					html: `
            <h1>Welcome to Galeria Starowicz!</h1>
            <p>Dear ${user.firstName},</p>
            <p>Your account has been created successfully.</p>
          `,
				})
			} catch (emailError) {
				console.error('Failed to send welcome email:', emailError)
			}

			return {
				user: {
					id: user.id,
					username: user.username,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
				},
				jwt,
			}
		} catch (error) {
			console.error('Registration error:', error)
			return ctx.badRequest('Registration failed')
		}
	},
}
