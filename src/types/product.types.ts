export interface ProductAttribute {
  namePL: string
  nameEN: string
  type: 'text' | 'number'
  valuePL: string
  valueEN: string
}

export interface ProductPrices {
  pricePLN: number
  priceEUR: number
  priceUSD: number
}

export interface ProductShipping {
  allowCourier: boolean
  allowParcelLocker: boolean
  allowPickup: boolean
  allowOwnerDelivery: boolean
  priceEU: number
  priceNonEU: number
}

export interface Product {
  id: number
  namePL: string
  nameEN: string
  descriptionPL: string
  descriptionEN: string
  slug: string
  thumbnail: any
  gallery: any[]
  categories: number[]
  prices: ProductPrices
  shipping: ProductShipping
  attributes?: ProductAttribute[]
  quantity: number
  isSold: boolean
  isAvailable: boolean
  isAuction: boolean
}

export interface Category {
  id: number
  namePL: string
  nameEN: string
  descriptionPL: string
  descriptionEN: string
  thumbnail: any
  slug: string
} 