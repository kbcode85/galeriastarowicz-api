module.exports = {
	apps: [
		{
			name: 'strapi-prod',
			script: 'npm',
			args: 'start',
		},
		{
			name: 'strapi-dev',
			script: 'npm',
			args: 'develop',
		},
	],
}
