import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia'
});

type PaymentType = 'order' | 'subscription' | 'auction';
type PaymentMethod = 'stripe' | 'bank_transfer' | 'cash_on_delivery';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'disputed';
type Voivodeship = 
  | 'dolnoslaskie'
  | 'kujawsko_pomorskie'
  | 'lubelskie'
  | 'lubuskie'
  | 'lodzkie'
  | 'malopolskie'
  | 'mazowieckie'
  | 'opolskie'
  | 'podkarpackie'
  | 'podlaskie'
  | 'pomorskie'
  | 'slaskie'
  | 'swietokrzyskie'
  | 'warminsko_mazurskie'
  | 'wielkopolskie'
  | 'zachodniopomorskie';

interface Address {
  street: string;
  buildingNumber: string;
  apartmentNumber?: string;
  city: string;
  postalCode: string;
  voivodeship: Voivodeship;
  country: string;
  additionalInfo?: string;
}

interface CreateCheckoutParams {
  amount: number;
  currency: string;
  name: string;
  userId: number;
  type: PaymentType;
  method: PaymentMethod;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

interface SessionMetadata {
  userId: number;
  type: PaymentType;
  productId?: string;
  planId?: string;
  auctionId?: string;
  bidId?: string;
  addresses?: {
    billing: Address;
    shipping: Address;
  };
}

interface CreatePaymentHistoryParams {
  user: number;
  amount: number;
  currency: string;
  type: PaymentType;
  method: PaymentMethod;
  status: PaymentStatus;
  relatedId: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  metadata?: Record<string, any>;
}

export const paymentService = {
  async createCheckoutSession(params: CreateCheckoutParams) {
    if (params.method === 'stripe') {
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card', 'blik'],
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: params.name,
              },
              unit_amount: params.amount,
              ...(params.type === 'subscription' && {
                recurring: {
                  interval: 'month'
                }
              })
            },
            quantity: 1,
          },
        ],
        mode: params.type === 'subscription' ? 'subscription' : 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          type: params.type,
          userId: params.userId,
          ...params.metadata
        },
        locale: 'pl'
      };

      return stripe.checkout.sessions.create(sessionConfig);
    }
    return null;
  },

  async createPaymentHistory(strapi: any, params: CreatePaymentHistoryParams) {
    return strapi.db.query('api::payment-history.payment-history').create({
      data: params
    });
  },

  async handleOrderPayment(strapi: any, session: Stripe.Checkout.Session) {
    const metadata = session.metadata as unknown as SessionMetadata;
    const { productId, addresses } = metadata;

    const order = await strapi.db.query('api::order.order').create({
      data: {
        user: metadata.userId,
        product: productId,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase(),
        status: 'completed',
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        billingAddress: addresses?.billing,
        shippingAddress: addresses?.shipping
      }
    });

    await this.createPaymentHistory(strapi, {
      user: metadata.userId,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase(),
      type: 'order',
      method: 'stripe',
      status: 'completed',
      relatedId: order.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      billingAddress: addresses?.billing,
      shippingAddress: addresses?.shipping,
      metadata: { productId }
    });

    return order;
  },

  async handleSubscriptionPayment(strapi: any, session: Stripe.Checkout.Session) {
    const metadata = session.metadata as unknown as SessionMetadata;
    const { planId } = metadata;

    const subscription = await strapi.db.query('api::subscription.subscription').create({
      data: {
        user: metadata.userId,
        plan: planId,
        status: 'active',
        stripeSubscriptionId: session.subscription as string,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: true
      }
    });

    await this.createPaymentHistory(strapi, {
      user: metadata.userId,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase(),
      type: 'subscription',
      method: 'stripe',
      status: 'completed',
      relatedId: subscription.id,
      stripeSessionId: session.id,
      stripeSubscriptionId: session.subscription as string,
      metadata: { planId }
    });

    return subscription;
  },

  async handleAuctionPayment(strapi: any, session: Stripe.Checkout.Session) {
    const metadata = session.metadata as unknown as SessionMetadata;
    const { auctionId, bidId, addresses } = metadata;

    const auction = await strapi.db.query('api::auction.auction').findOne({
      where: { id: auctionId }
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    // Aktualizuj status aukcji
    await strapi.db.query('api::auction.auction').update({
      where: { id: auctionId },
      data: {
        status: 'completed',
        winner: metadata.userId
      }
    });

    // Zapisz historię płatności
    await this.createPaymentHistory(strapi, {
      user: metadata.userId,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase(),
      type: 'auction',
      method: 'stripe',
      status: 'completed',
      relatedId: auction.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      billingAddress: addresses?.billing,
      shippingAddress: addresses?.shipping,
      metadata: { auctionId, bidId }
    });

    return auction;
  }
}; 