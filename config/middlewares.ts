export default [
	'strapi::errors',
	'strapi::security',
	{
		name: 'strapi::cors',
		config: {
			enabled: true,
			origin: ['https://demo.galeriastarowicz.pl'],
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
			headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
			exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'],
			maxAge: 31536000,
		},
	},
	'strapi::poweredBy',
	'strapi::logger',
	'strapi::query',
	{
		name: 'strapi::body',
		config: {
			includeUnparsed: true,
			patchKoa: true,
			multipart: true,
		},
	},
	'strapi::session',
	'strapi::favicon',
	'strapi::public',
]
