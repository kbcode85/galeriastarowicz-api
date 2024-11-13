export interface UserAddress {
	id?: number
	__component?: string
	street: string
	buildingNumber: string
	apartmentNumber?: string
	city: string
	postalCode: string
	voivodeship: string
	country?: string
	additionalInfo?: string
}

export interface UserCompany {
	id?: number
	__component?: string
	name: string
	nip: string
	regon?: string
}

export interface UserPersonalData {
	firstName?: string
	lastName?: string
	phone?: string
}

export interface ExtendedUser extends UserPersonalData {
	id: number
	username: string
	email: string
	provider?: string
	confirmed?: boolean
	blocked?: boolean
	createdAt?: Date
	updatedAt?: Date
	
	// Komponenty
	company?: UserCompany | null
	billingAddress?: UserAddress | null
	shippingAddress?: UserAddress | null
}

export interface UserProfile extends UserPersonalData {
	company?: UserCompany | null
	billingAddress?: UserAddress | null
	shippingAddress?: UserAddress | null
}

export interface UpdateUserProfileBody extends Partial<UserPersonalData> {
	company?: UserCompany | null
	billingAddress?: UserAddress | null
	shippingAddress?: UserAddress | null
}
