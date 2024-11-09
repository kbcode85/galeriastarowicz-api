export const generateId = (prefix: string = 'ID'): string => {
	const timestamp = Date.now().toString(36)
	const random = Math.random().toString(36).substring(2, 7).toUpperCase()
	return `${prefix}-${timestamp}-${random}`
}
