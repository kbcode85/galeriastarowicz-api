import Stripe from 'stripe';
import { paymentService } from '../../../services/payment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia'
});

export default {
  async handle(ctx) {
    try {
      const signature = ctx.request.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      if (!signature || !webhookSecret) {
        return ctx.badRequest('Missing signature or webhook secret');
      }

      const rawBody = ctx.request.body[Symbol.for('unparsedBody')];
      if (!rawBody) {
        return ctx.badRequest('No raw body provided');
      }

      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentType = session.metadata?.type as 'order' | 'subscription' | 'auction';

        switch (paymentType) {
          case 'order':
            await paymentService.handleOrderPayment(ctx.strapi, session);
            break;
          case 'subscription':
            await paymentService.handleSubscriptionPayment(ctx.strapi, session);
            break;
          case 'auction':
            await paymentService.handleAuctionPayment(ctx.strapi, session);
            break;
        }
      }

      return ctx.send({ received: true });
    } catch (error) {
      return ctx.badRequest(error.message);
    }
  }
}; 