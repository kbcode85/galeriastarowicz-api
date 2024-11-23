export default [
	'strapi::errors',
	'strapi::security',
	{
		name: 'strapi::cors',
		config: {
			enabled: false,
			origin: ['https://demo.galeriastarowicz.pl'],
			credentials: true,
			methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
			headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
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
