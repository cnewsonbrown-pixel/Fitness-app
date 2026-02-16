import { apiGet, apiPut } from './client';

export interface TenantSettings {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  website?: string;
  timezone: string;
  currency: string;
  locale: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  businessHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  features: {
    classes: boolean;
    bookings: boolean;
    billing: boolean;
    marketing: boolean;
    crm: boolean;
    gamification: boolean;
    video: boolean;
    customAnalytics: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  billing: {
    taxRate?: number;
    taxId?: string;
    invoicePrefix?: string;
    paymentTerms?: number;
  };
  integrations: {
    stripeConnected: boolean;
    twilioConnected: boolean;
    sendgridConnected: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  timezone?: string;
  currency?: string;
  locale?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  businessHours?: TenantSettings['businessHours'];
  notifications?: Partial<TenantSettings['notifications']>;
  billing?: Partial<TenantSettings['billing']>;
}

export const settingsApi = {
  get: () => apiGet<TenantSettings>('/settings'),

  update: (data: UpdateSettingsData) => apiPut<TenantSettings>('/settings', data),

  getTimezones: () =>
    apiGet<{ value: string; label: string }[]>('/settings/timezones'),

  getCurrencies: () =>
    apiGet<{ code: string; name: string; symbol: string }[]>('/settings/currencies'),

  getLocales: () =>
    apiGet<{ code: string; name: string }[]>('/settings/locales'),
};
