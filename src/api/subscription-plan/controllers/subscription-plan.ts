export default {
  async createDefaultPlans(ctx) {
    try {
      const plans = [
        {
          name: "Plan Podstawowy",
          description: "Dostęp do cen i możliwość zakupów",
          level: "basic",
          isActive: true,
          sortOrder: 1,
          prices: [
            {
              name: "Miesięczny dostęp",
              type: "subscription",
              duration: "monthly",
              price: 29.99,
              currency: "PLN",
              isActive: true
            },
            {
              name: "Roczny dostęp",
              type: "subscription",
              duration: "yearly",
              price: 299.99,
              currency: "PLN",
              isActive: true
            }
          ],
          features: [
            {
              name: "Wyświetlanie cen",
              description: "Dostęp do cen wszystkich produktów",
              type: "view_prices",
              isEnabled: true
            },
            {
              name: "Zakupy",
              description: "Możliwość zakupu produktów",
              type: "buy_products",
              isEnabled: true
            }
          ]
        },
        {
          name: "Plan Premium",
          description: "Dostęp do cen, zakupów i licytacji",
          level: "premium",
          isActive: true,
          sortOrder: 2,
          prices: [
            {
              name: "Miesięczny dostęp premium",
              type: "subscription",
              duration: "monthly",
              price: 49.99,
              currency: "PLN",
              isActive: true
            },
            {
              name: "Roczny dostęp premium",
              type: "subscription",
              duration: "yearly",
              price: 499.99,
              currency: "PLN",
              isActive: true
            }
          ],
          features: [
            {
              name: "Wyświetlanie cen",
              description: "Dostęp do cen wszystkich produktów",
              type: "view_prices",
              isEnabled: true
            },
            {
              name: "Zakupy",
              description: "Możliwość zakupu produktów",
              type: "buy_products",
              isEnabled: true
            },
            {
              name: "Licytacje",
              description: "Udział w licytacjach",
              type: "participate_auctions",
              isEnabled: true
            }
          ]
        },
        {
          name: "Plan Premium+",
          description: "Pełen dostęp z auto-biddingiem",
          level: "premium_plus",
          isActive: true,
          sortOrder: 3,
          prices: [
            {
              name: "Miesięczny dostęp premium+",
              type: "subscription",
              duration: "monthly",
              price: 79.99,
              currency: "PLN",
              isActive: true
            },
            {
              name: "Roczny dostęp premium+",
              type: "subscription",
              duration: "yearly",
              price: 799.99,
              currency: "PLN",
              isActive: true
            }
          ],
          features: [
            {
              name: "Wyświetlanie cen",
              description: "Dostęp do cen wszystkich produktów",
              type: "view_prices",
              isEnabled: true
            },
            {
              name: "Zakupy",
              description: "Możliwość zakupu produktów",
              type: "buy_products",
              isEnabled: true
            },
            {
              name: "Licytacje",
              description: "Udział w licytacjach",
              type: "participate_auctions",
              isEnabled: true
            },
            {
              name: "Auto-bidding",
              description: "Automatyczne podbijanie ofert",
              type: "auto_bidding",
              isEnabled: true
            }
          ]
        }
      ];

      for (const plan of plans) {
        await strapi.db.query('api::subscription-plan.subscription-plan').create({
          data: {
            ...plan,
            locale: 'pl'
          }
        });
      }

      return { message: 'Default plans created successfully' };
    } catch (error) {
      console.error('Error creating default plans:', error);
      return ctx.badRequest('Failed to create default plans');
    }
  }
}; 