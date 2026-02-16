import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as billingController from '../controllers/billing.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const adminRoles = [StaffRole.OWNER, StaffRole.ADMIN];
const managerRoles = [StaffRole.OWNER, StaffRole.ADMIN, StaffRole.MANAGER];

// ===== PAYMENT METHODS =====

router.post('/setup-intent', authenticate, requireTenant, billingController.createSetupIntent);
router.get('/members/:memberId/payment-methods', authenticate, requireTenant, billingController.listPaymentMethods);
router.delete('/payment-methods/:paymentMethodId', authenticate, requireTenant, billingController.detachPaymentMethod);

// ===== SUBSCRIPTIONS =====

router.post('/subscriptions', authenticate, requireTenant, billingController.createSubscription);
router.post('/subscriptions/:memberMembershipId/cancel', authenticate, requireTenant, billingController.cancelSubscription);
router.post('/subscriptions/:memberMembershipId/pause', authenticate, requireTenant, requireStaff(managerRoles), billingController.pauseSubscription);
router.post('/subscriptions/:memberMembershipId/resume', authenticate, requireTenant, requireStaff(managerRoles), billingController.resumeSubscription);

// ===== ONE-TIME PAYMENTS =====

router.post('/payments', authenticate, requireTenant, billingController.createOneTimePayment);

// ===== PAYMENT HISTORY =====

router.get('/members/:memberId/payments', authenticate, requireTenant, billingController.getPaymentHistory);
router.get('/revenue', authenticate, requireTenant, requireStaff(managerRoles), billingController.getRevenueReport);

// ===== REFUNDS =====

router.post('/payments/:paymentId/refund', authenticate, requireTenant, requireStaff(adminRoles), billingController.refund);

export default router;
