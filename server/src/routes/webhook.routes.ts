import { Router } from 'express';
import express from 'express';
import * as billingController from '../controllers/billing.controller.js';

const router = Router();

// Stripe webhook needs raw body for signature verification
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  billingController.handleWebhook
);

export default router;
