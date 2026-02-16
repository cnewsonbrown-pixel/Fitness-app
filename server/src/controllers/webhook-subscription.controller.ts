import { Request, Response, NextFunction } from 'express';
import { webhookSubscriptionService } from '../services/webhook-subscription.service.js';

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: webhookSubscriptionService.WEBHOOK_EVENTS });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await webhookSubscriptionService.createSubscription(req.tenantId!, req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await webhookSubscriptionService.updateSubscription(
      req.tenantId!,
      req.params.id,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await webhookSubscriptionService.deleteSubscription(req.tenantId!, req.params.id);
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error) {
    next(error);
  }
};

export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await webhookSubscriptionService.getSubscription(req.tenantId!, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const listSubscriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await webhookSubscriptionService.listSubscriptions(req.tenantId!);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const rotateSecret = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await webhookSubscriptionService.rotateSecret(req.tenantId!, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const testWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscription = await webhookSubscriptionService.getSubscription(
      req.tenantId!,
      req.params.id
    );
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    const results = await webhookSubscriptionService.deliver(req.tenantId!, 'test.ping', {
      message: 'Test webhook delivery',
      subscriptionId: subscription.id,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const data = await webhookSubscriptionService.getDeliveryLogs(
      req.tenantId!,
      req.params.id,
      limit
    );
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
