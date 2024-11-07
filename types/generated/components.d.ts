import type { Schema, Struct } from '@strapi/strapi';

export interface SubscriptionFeatures extends Struct.ComponentSchema {
  collectionName: 'components_subscription_features';
  info: {
    description: 'Funkcje dost\u0119pne w planie subskrypcji';
    displayName: 'Plan Features';
  };
  attributes: {
    description: Schema.Attribute.Text;
    isEnabled: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['view_prices', 'buy_products', 'participate_auctions', 'auto_bidding']
    > &
      Schema.Attribute.Required;
  };
}

export interface SubscriptionPriceOptions extends Struct.ComponentSchema {
  collectionName: 'components_subscription_price_options';
  info: {
    description: 'Opcje cenowe dla r\u00F3\u017Cnych typ\u00F3w subskrypcji';
    displayName: 'Price Options';
  };
  attributes: {
    duration: Schema.Attribute.Enumeration<['monthly', 'yearly']> &
      Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    price: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    promotionalPrice: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    promotionValidUntil: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['one_time', 'subscription']> &
      Schema.Attribute.Required;
  };
}

export interface SubscriptionUserSubscription extends Struct.ComponentSchema {
  collectionName: 'components_subscription_user_subscriptions';
  info: {
    description: 'Aktywna subskrypcja u\u017Cytkownika';
    displayName: 'User Subscription';
  };
  attributes: {
    activePlan: Schema.Attribute.Relation<
      'oneToOne',
      'api::subscription-plan.subscription-plan'
    >;
    autoRenew: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    endDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    startDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
  };
}

export interface UserAddress extends Struct.ComponentSchema {
  collectionName: 'components_user_addresses';
  info: {
    description: 'Adres u\u017Cytkownika';
    displayName: 'Address';
  };
  attributes: {
    city: Schema.Attribute.String & Schema.Attribute.Required;
    country: Schema.Attribute.String & Schema.Attribute.Required;
    postalCode: Schema.Attribute.String & Schema.Attribute.Required;
    street: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface UserCompany extends Struct.ComponentSchema {
  collectionName: 'components_user_companies';
  info: {
    description: 'Informacje o firmie u\u017Cytkownika';
    displayName: 'Company';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nip: Schema.Attribute.String;
    regon: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'subscription.features': SubscriptionFeatures;
      'subscription.price-options': SubscriptionPriceOptions;
      'subscription.user-subscription': SubscriptionUserSubscription;
      'user.address': UserAddress;
      'user.company': UserCompany;
    }
  }
}
