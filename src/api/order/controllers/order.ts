import { factories } from '@strapi/strapi';
import { paymentService } from '../../../services/payment';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async createCheckout(ctx) {
    try {
      const { priceData, successUrl, cancelUrl, addresses } = ctx.request.body;
      const user = ctx.state.user;

      if (!priceData || !successUrl || !cancelUrl || !addresses) {
        return ctx.badRequest('Missing required fields');
      }

      const session = await paymentService.createCheckoutSession({
        amount: priceData.amount,
        currency: priceData.currency,
        name: priceData.name,
        userId: user.id,
        type: 'order',
        method: 'stripe',
        successUrl,
        cancelUrl,
        metadata: {
          productId: priceData.productId,
          addresses
        }
      });

      return { 
        sessionId: session?.id, 
        url: session?.url
      };
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  }
})); 