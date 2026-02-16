import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tenantRoutes from './tenant.routes.js';
import memberRoutes from './member.routes.js';
import membershipTypeRoutes from './membership.routes.js';
import memberMembershipRoutes from './member-membership.routes.js';
import locationRoutes from './location.routes.js';
import classTypeRoutes from './class-type.routes.js';
import classRoutes from './class.routes.js';
import bookingRoutes from './booking.routes.js';
import staffRoutes from './staff.routes.js';
import billingRoutes from './billing.routes.js';
import webhookRoutes from './webhook.routes.js';
import marketingRoutes from './marketing.routes.js';
import analyticsRoutes from './analytics.routes.js';
import crmRoutes from './crm.routes.js';
import contentRoutes from './content.routes.js';
import gamificationRoutes from './gamification.routes.js';
import apiKeyRoutes from './api-key.routes.js';
import videoRoutes from './video.routes.js';
import customAnalyticsRoutes from './custom-analytics.routes.js';
import brandingRoutes from './branding.routes.js';
import webhookSubscriptionRoutes from './webhook-subscription.routes.js';
import developerRoutes from './developer.routes.js';
import sandboxRoutes from './sandbox.routes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    },
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/members', memberRoutes);
router.use('/membership-types', membershipTypeRoutes);
router.use('/memberships', memberMembershipRoutes);
router.use('/locations', locationRoutes);
router.use('/class-types', classTypeRoutes);
router.use('/classes', classRoutes);
router.use('/bookings', bookingRoutes);
router.use('/staff', staffRoutes);
router.use('/billing', billingRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/marketing', marketingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/crm', crmRoutes);
router.use('/content', contentRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/api-keys', apiKeyRoutes);
router.use('/video', videoRoutes);
router.use('/custom-analytics', customAnalyticsRoutes);
router.use('/branding', brandingRoutes);
router.use('/webhook-subscriptions', webhookSubscriptionRoutes);
router.use('/developer', developerRoutes);
router.use('/sandbox', sandboxRoutes);

export default router;
