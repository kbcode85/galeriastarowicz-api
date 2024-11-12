import type { Schema, Struct } from '@strapi/strapi';

export interface SubscriptionPrice extends Struct.ComponentSchema {
  collectionName: 'components_subscription_price';
  info: {
    description: '';
    displayName: 'Price';
  };
  attributes: {
    amount: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    currency: Schema.Attribute.Enumeration<['PLN', 'EUR', 'USD']> &
      Schema.Attribute.Required;
    duration: Schema.Attribute.Enumeration<['monthly', 'yearly']> &
      Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
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
    description: 'User address component';
    displayName: 'Address';
  };
  attributes: {
    additionalInfo: Schema.Attribute.Text;
    apartmentNumber: Schema.Attribute.String;
    buildingNumber: Schema.Attribute.String & Schema.Attribute.Required;
    city: Schema.Attribute.String & Schema.Attribute.Required;
    country: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Polska'>;
    postalCode: Schema.Attribute.String & Schema.Attribute.Required;
    street: Schema.Attribute.String & Schema.Attribute.Required;
    voivodeship: Schema.Attribute.Enumeration<
      [
        'dolnoslaskie',
        'kujawsko_pomorskie',
        'lubelskie',
        'lubuskie',
        'lodzkie',
        'malopolskie',
        'mazowieckie',
        'opolskie',
        'podkarpackie',
        'podlaskie',
        'pomorskie',
        'slaskie',
        'swietokrzyskie',
        'warminsko_mazurskie',
        'wielkopolskie',
        'zachodniopomorskie',
      ]
    > &
      Schema.Attribute.Required;
  };
}

export interface UserCompany extends Struct.ComponentSchema {
  collectionName: 'components_user_companies';
  info: {
    description: 'Company information';
    displayName: 'Company';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nip: Schema.Attribute.String & Schema.Attribute.Required;
    regon: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'subscription.price': SubscriptionPrice;
      'subscription.user-subscription': SubscriptionUserSubscription;
      'user.address': UserAddress;
      'user.company': UserCompany;
    }
  }
}
