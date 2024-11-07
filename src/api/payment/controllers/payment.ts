import { factories } from '@strapi/strapi';
import { createCheckoutSession, handleWebhook } from '../../../services/stripe';

interface PaymentData {
  user: number;
  amount: number;
  currency: string;
  status: string;
  stripeSessionId: string;
  paymentType: string;
  subscriptionPlan?: number;
}

export default factories.createCoreController('api::payment.payment', ({ strapi }) => ({
  async createCheckout(ctx) {
    try {
      const { priceData, successUrl, cancelUrl } = ctx.request.body;
      const user = ctx.state.user;

      // Sprawdź czy plan subskrypcji istnieje
      if (priceData.planId) {
        const plan = await strapi.db.query('api::subscription-plan.subscription-plan').findOne({
          where: { id: priceData.planId }
        });

        if (!plan) {
          return ctx.badRequest('Subscription plan not found');
        }
      }

      const session = await createCheckoutSession({
        priceData,
        customerEmail: user.email,
        successUrl,
        cancelUrl,
        isSubscription: priceData.type === 'subscription'
      });

      // Zapisz informacje o płatności
      const paymentData: PaymentData = {
        user: user.id,
        amount: priceData.amount / 100,
        currency: priceData.currency.toUpperCase(),
        status: 'pending',
        stripeSessionId: session.id,
        paymentType: priceData.type
      };

      // Dodaj referencję do planu subskrypcji tylko jeśli istnieje
      if (priceData.planId) {
        paymentData.subscriptionPlan = priceData.planId;
      }

      await strapi.db.query('api::payment.payment').create({
        data: paymentData
      });

      return { sessionId: session.id, url: session.url };
    } catch (error) {
      console.error('Payment error:', error);
      return ctx.badRequest('Could not create checkout session');
    }
  },

  async webhook(ctx) {
    try {
      const signature = ctx.request.headers['stripe-signature'];
      
      if (typeof signature !== 'string') {
        return ctx.badRequest('Invalid signature');
      }

      const event = await handleWebhook(
        ctx.request.body,
        signature
      );

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Znajdź płatność po stripeSessionId
        const payment = await strapi.db.query('api::payment.payment').findOne({
          where: { stripeSessionId: session.id }
        });

        if (payment) {
          // Aktualizuj znalezioną płatność
          await strapi.db.query('api::payment.payment').update({
            where: { id: payment.id },
            data: {
              status: 'completed',
              stripePaymentIntentId: session.payment_intent as string
            }
          });
        }
      }

      return { received: true, type: event.type };
    } catch (error) {
      console.error('Webhook error:', error);
      return ctx.badRequest('Webhook error');
    }
  }
})); 