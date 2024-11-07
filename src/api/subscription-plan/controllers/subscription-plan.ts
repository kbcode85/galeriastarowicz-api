import { factories } from '@strapi/strapi';
import { Context } from 'koa';

interface QueryParams {
  filters?: Record<string, any>;
  sort?: Record<string, any>;
  populate?: Record<string, any>;
  locale?: string;
}

export default factories.createCoreController('api::subscription-plan.subscription-plan', ({ strapi }) => ({
  async find(ctx: Context) {
    const query = ctx.query as QueryParams;

    const entity = await strapi.service('api::subscription-plan.subscription-plan').find({
      ...query,
      filters: {
        ...(query.filters || {}),
        isActive: true
      },
      sort: { sortOrder: 'asc' }
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },

  async findOne(ctx: Context) {
    const { id } = ctx.params;
    const query = ctx.query as QueryParams;

    const entity = await strapi.service('api::subscription-plan.subscription-plan').findOne(id, {
      ...query,
      filters: {
        ...(query.filters || {}),
        isActive: true
      }
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  }
})); 