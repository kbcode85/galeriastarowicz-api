export default {
	async beforeCreate(event) {
		const { data } = event.params
		if (data.names && data.names.pl) {
			data.displayName = data.names.pl
		}
	},

	async beforeUpdate(event) {
		const { data } = event.params
		if (data.names && data.names.pl) {
			data.displayName = data.names.pl
		}
	},
}
