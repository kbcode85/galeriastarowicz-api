import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia'
});

export const createCheckoutSession = async ({
  priceData,
  customerEmail,
  successUrl,
  cancelUrl,
  isSubscription = false
}: {
  priceData: {
    amount: number;
    currency: string;
    name: string;
  };
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  isSubscription?: boolean;
}) => {
  try {
    const baseConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: isSubscription ? ['card'] : ['card', 'blik'],
      line_items: [
        {
          price_data: {
            currency: priceData.currency,
            product_data: {
              name: priceData.name,
            },
            unit_amount: priceData.amount,
            ...(isSubscription && {
              recurring: {
                interval: 'month',
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      locale: 'pl'
    };

    // Dla płatności jednorazowych dodajemy dodatkowe opcje
    const sessionConfig: Stripe.Checkout.SessionCreateParams = isSubscription 
      ? baseConfig 
      : {
          ...baseConfig,
          payment_method_options: {
            card: {
              setup_future_usage: 'off_session' as Stripe.Checkout.SessionCreateParams.PaymentMethodOptions.Card.SetupFutureUsage
            }
          }
        };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return session;
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
};

export const createPortalSession = async (customerId: string) => {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: process.env.STRIPE_PORTAL_RETURN_URL,
  });
};

export const handleWebhook = async (
  requestBody: string,
  signature: string
) => {
  try {
    const event = stripe.webhooks.constructEvent(
      requestBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        // Tutaj dodamy logikę aktualizacji subskrypcji użytkownika
        break;
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        // Aktualizacja statusu subskrypcji
        break;
      case 'customer.subscription.deleted':
        // Obsługa anulowania subskrypcji
        break;
    }

    return event;
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
}; 