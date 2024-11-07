export default [
	'strapi::errors',
	{
		name: 'strapi::security',
		config: {
			contentSecurityPolicy: {
				useDefaults: true,
				directives: {
					'connect-src': ["'self'", 'https:'],
					'img-src': ["'self'", 'data:', 'blob:'],
					'media-src': ["'self'", 'data:', 'blob:'],
				},
			},
		},
	},
	'strapi::cors',
	'strapi::poweredBy',
	'strapi::logger',
	'strapi::query',
	{
		name: 'strapi::body',
		config: {
			jsonLimit: '10mb',
			formLimit: '10mb',
			textLimit: '10mb',
			includeUnparsed: true
		},
	},
	'strapi::session',
	'strapi::favicon',
	'strapi::public',
]
