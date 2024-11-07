import { factories } from '@strapi/strapi';
import { paymentService } from '../../../services/payment';

export default factories.createCoreController('api::subscription.subscription', ({ strapi }) => ({
  async createCheckout(ctx) {
    try {
      const { priceData, successUrl, cancelUrl } = ctx.request.body;
      const user = ctx.state.user;

      if (!priceData || !successUrl || !cancelUrl) {
        return ctx.badRequest('Missing required fields');
      }

      const session = await paymentService.createCheckoutSession({
        amount: priceData.amount,
        currency: priceData.currency,
        name: priceData.name,
        userId: user.id,
        type: 'subscription',
        method: 'stripe',
        successUrl,
        cancelUrl,
        metadata: {
          planId: priceData.planId
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