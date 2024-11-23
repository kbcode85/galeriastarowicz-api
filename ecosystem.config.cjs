module.exports = {
	apps: [
		{
			name: 'strapi',
			script: 'npm',
			args: 'start',
			node_args: '--enable-source-maps',
			env: {
				NODE_ENV: 'production',
			},
		},
	],
}
