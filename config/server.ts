import cronTasks from './cron'

export default ({ env }) => ({
	host: env('HOST', '0.0.0.0'),
	port: env.int('PORT', 1337),
	url: env('PUBLIC_URL', 'http://localhost:1337'),
	proxy: true,
	app: {
		keys: env.array('APP_KEYS'),
	},
	cron: {
		enabled: true,
		tasks: cronTasks,
	},
})
