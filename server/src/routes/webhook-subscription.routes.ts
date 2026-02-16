import { Router } from 'express';
import { StaffRole } from '@prisma/client';
import * as controller from '../controllers/webhook-subscription.controller.js';
import { authenticate, requireTenant, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

const adminRoles = [StaffRole.OWNER, StaffRole.ADMIN];

router.use(authenticate);
router.use(requireTenant);
router.use(requireStaff(adminRoles));

// Available events
router.get('/events', controller.getEvents);

// Subscriptions CRUD
router.get('/', controller.listSubscriptions);
router.post('/', controller.createSubscription);
router.get('/:id', controller.getSubscription);
router.put('/:id', controller.updateSubscription);
router.delete('/:id', controller.deleteSubscription);

// Secret rotation
router.post('/:id/rotate-secret', controller.rotateSecret);

// Testing
router.post('/:id/test', controller.testWebhook);

// Delivery logs
router.get('/:id/logs', controller.getDeliveryLogs);
router.get('/logs', controller.getDeliveryLogs); // All logs for tenant

export default router;
