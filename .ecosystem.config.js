module.exports = {
	apps: [
		{
			name: 'strapi-prod',
			script: 'npm',
			args: 'start',
			env: {
				NODE_ENV: 'production',
				ENV_PATH: '.env.production',
			},
		},
		{
			name: 'strapi-dev',
			script: 'npm',
			args: 'develop',
			env: {
				NODE_ENV: 'development',
				ENV_PATH: '.env.development',
			},
		},
	],
}
