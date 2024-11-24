export default [
	'strapi::errors',
	'strapi::security',
	'strapi::cors',
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
