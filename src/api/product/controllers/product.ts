import { factories } from '@strapi/strapi'
import { Context } from 'koa'

export default factories.createCoreController('api::product.product', ({ strapi }) => ({
  // Publiczne metody (bez cen i metod dostawy)
  async findPublic(ctx: Context) {
    try {
      const { lang = 'pl', category, available } = ctx.query

      const filters: any = {}
      if (category) {
        filters.categories = { id: category }
      }
      if (available !== undefined) {
        filters.isAvailable = available === 'true'
      }

      const products = await strapi.db
        .query('api::product.product')
        .findMany({
          where: filters,
          populate: {
            thumbnail: true,
            categories: true
          }
        })

      return products.map(product => ({
        id: product.id,
        name: lang === 'pl' ? product.namePL : product.nameEN,
        description: lang === 'pl' ? product.descriptionPL : product.descriptionEN,
        thumbnail: product.thumbnail,
        categories: product.categories?.map(cat => ({
          id: cat.id,
          name: lang === 'pl' ? cat.namePL : cat.nameEN
        })),
        isAvailable: product.isAvailable,
        isSold: product.isSold,
        isAuction: product.isAuction,
        slug: product.slug
      }))
    } catch (error) {
      ctx.throw(500, error.message)
    }
  },

  async findOnePublic(ctx: Context) {
    try {
      const { id } = ctx.params
      const { lang = 'pl' } = ctx.query

      const product = await strapi.db
        .query('api::product.product')
        .findOne({
          where: { id },
          populate: {
            thumbnail: true,
            gallery: true,
            categories: true,
            attributes: true
          }
        })

      if (!product) {
        return ctx.notFound('Product not found')
      }

      return {
        id: product.id,
        name: lang === 'pl' ? product.namePL : product.nameEN,
        description: lang === 'pl' ? product.descriptionPL : product.descriptionEN,
        thumbnail: product.thumbnail,
        gallery: product.gallery,
        categories: product.categories?.map(cat => ({
          id: cat.id,
          name: lang === 'pl' ? cat.namePL : cat.nameEN
        })),
        attributes: product.attributes?.map(attr => ({
          name: lang === 'pl' ? attr.namePL : attr.nameEN,
          value: lang === 'pl' ? attr.valuePL : attr.valueEN,
          type: attr.type
        })),
        isAvailable: product.isAvailable,
        isSold: product.isSold,
        isAuction: product.isAuction,
        slug: product.slug
      }
    } catch (error) {
      ctx.throw(500, error.message)
    }
  },

  // Prywatne metody (pełne dane z cenami i metodami dostawy)
  async find(ctx: Context) {
    try {
      const { lang = 'pl', category, available } = ctx.query

      const filters: any = {}
      if (category) {
        filters.categories = { id: category }
      }
      if (available !== undefined) {
        filters.isAvailable = available === 'true'
      }

      const products = await strapi.db
        .query('api::product.product')
        .findMany({
          where: filters,
          populate: {
            thumbnail: true,
            categories: true,
            prices: true
          }
        })

      return products.map(product => ({
        id: product.id,
        name: lang === 'pl' ? product.namePL : product.nameEN,
        thumbnail: product.thumbnail,
        price: product.prices.pricePLN,
        categories: product.categories?.map(cat => ({
          id: cat.id,
          name: lang === 'pl' ? cat.namePL : cat.nameEN
        })),
        isAvailable: product.isAvailable,
        isSold: product.isSold,
        isAuction: product.isAuction,
        slug: product.slug
      }))
    } catch (error) {
      ctx.throw(500, error.message)
    }
  },

  async findOne(ctx: Context) {
    try {
      const { id } = ctx.params
      const { lang = 'pl' } = ctx.query

      const product = await strapi.db
        .query('api::product.product')
        .findOne({
          where: { id },
          populate: {
            thumbnail: true,
            gallery: true,
            categories: true,
            prices: true,
            shipping: true,
            attributes: true
          }
        })

      if (!product) {
        return ctx.notFound('Product not found')
      }

      return {
        id: product.id,
        name: lang === 'pl' ? product.namePL : product.nameEN,
        description: lang === 'pl' ? product.descriptionPL : product.descriptionEN,
        thumbnail: product.thumbnail,
        gallery: product.gallery,
        categories: product.categories?.map(cat => ({
          id: cat.id,
          name: lang === 'pl' ? cat.namePL : cat.nameEN
        })),
        prices: product.prices,
        shipping: product.shipping,
        attributes: product.attributes?.map(attr => ({
          name: lang === 'pl' ? attr.namePL : attr.nameEN,
          value: lang === 'pl' ? attr.valuePL : attr.valueEN,
          type: attr.type
        })),
        quantity: product.quantity,
        isAvailable: product.isAvailable,
        isSold: product.isSold,
        isAuction: product.isAuction,
        slug: product.slug
      }
    } catch (error) {
      ctx.throw(500, error.message)
    }
  },

  async adminCreate(ctx: Context) {
    try {
      if (ctx.state.user.role.type !== 'administrator') {
        return ctx.forbidden('Only administrators can perform this action')
      }

      const data = ctx.request.body

      // Walidacja wymaganych pól
      const requiredFields = ['namePL', 'nameEN', 'descriptionPL', 'descriptionEN', 'slug', 'prices']
      for (const field of requiredFields) {
        if (!data[field]) {
          return ctx.badRequest(`Field ${field} is required`)
        }
      }

      // Sprawdź unikalność sluga
      const existingProduct = await strapi.db
        .query('api::product.product')
        .findOne({
          where: { slug: data.slug }
        })

      if (existingProduct) {
        return ctx.badRequest('Product with this slug already exists')
      }

      const product = await strapi.db
        .query('api::product.product')
        .create({
          data: {
            ...data,
            createdBy: ctx.state.user.id
          },
          populate: {
            thumbnail: true,
            gallery: true,
            categories: true,
            prices: true,
            shipping: true,
            attributes: true
          }
        })

      return product

    } catch (error) {
      ctx.throw(500, error.message)
    }
  },

  async adminUpdate(ctx: Context) {
    try {
      // Sprawdź czy użytkownik ma rolę administratora
      if (ctx.state.user.role.type !== 'administrator') {
        return ctx.forbidden('Only administrators can perform this action')
      }

      const { id } = ctx.params
      const data = ctx.request.body

      // Sprawdź czy produkt istnieje
      const existingProduct = await strapi.db
        .query('api::product.product')
        .findOne({
          where: { id }
        })

      if (!existingProduct) {
        return ctx.notFound('Product not found')
      }

      // Sprawdź unikalność sluga jeśli jest zmieniany
      if (data.slug && data.slug !== existingProduct.slug) {
        const slugExists = await strapi.db
          .query('api::product.product')
          .findOne({
            where: { slug: data.slug }
          })

        if (slugExists) {
          return ctx.badRequest('Product with this slug already exists')
        }
      }

      const product = await strapi.db
        .query('api::product.product')
        .update({
          where: { id },
          data: {
            ...data,
            updatedBy: ctx.state.user.id
          },
          populate: {
            thumbnail: true,
            gallery: true,
            categories: true,
            prices: true,
            shipping: true,
            attributes: true
          }
        })

      return product

    } catch (error) {
      ctx.throw(500, error.message)
    }
  },

  async adminDelete(ctx: Context) {
    try {
      // Sprawdź czy użytkownik ma rolę administratora
      if (ctx.state.user.role.type !== 'administrator') {
        return ctx.forbidden('Only administrators can perform this action')
      }

      const { id } = ctx.params

      // Sprawdź czy produkt istnieje
      const existingProduct = await strapi.db
        .query('api::product.product')
        .findOne({
          where: { id }
        })

      if (!existingProduct) {
        return ctx.notFound('Product not found')
      }

      await strapi.db
        .query('api::product.product')
        .delete({
          where: { id }
        })

      return { success: true }

    } catch (error) {
      ctx.throw(500, error.message)
    }
  }
})) 