import Stripe from 'stripe';
import { config } from './index.js';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
