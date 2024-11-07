import type { Schema, Struct } from '@strapi/strapi';

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
      'user.address': UserAddress;
      'user.company': UserCompany;
    }
  }
}
