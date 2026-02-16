import { Request, Response, NextFunction } from 'express';
import { billingService } from '../services/billing.service.js';
import { stripeWebhookService } from '../services/stripe-webhook.service.js';

// ===== PAYMENT METHODS =====

export const createSetupIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setupIntent = await billingService.createSetupIntent(req.body.memberId);
    res.json({ success: true, data: { clientSecret: setupIntent.client_secret } });
  } catch (error) {
    next(error);
  }
};

export const listPaymentMethods = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const methods = await billingService.listPaymentMethods(req.params.memberId);
    res.json({
      success: true,
      data: methods.map((m) => ({
        id: m.id,
        brand: m.card?.brand,
        last4: m.card?.last4,
        expMonth: m.card?.exp_month,
        expYear: m.card?.exp_year,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const detachPaymentMethod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await billingService.detachPaymentMethod(req.params.paymentMethodId);
    res.json({ success: true, message: 'Payment method removed' });
  } catch (error) {
    next(error);
  }
};

// ===== SUBSCRIPTIONS =====

export const createSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, memberMembershipId, paymentMethodId } = req.body;
    const subscription = await billingService.createSubscription({
      memberId,
      memberMembershipId,
      paymentMethodId,
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent as any;

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        clientSecret: paymentIntent?.client_secret,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { cancelAtPeriodEnd } = req.body;
    await billingService.cancelSubscription(req.params.memberMembershipId, cancelAtPeriodEnd !== false);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    next(error);
  }
};

export const pauseSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await billingService.pauseSubscription(req.params.memberMembershipId);
    res.json({ success: true, message: 'Subscription paused' });
  } catch (error) {
    next(error);
  }
};

export const resumeSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await billingService.resumeSubscription(req.params.memberMembershipId);
    res.json({ success: true, message: 'Subscription resumed' });
  } catch (error) {
    next(error);
  }
};

// ===== ONE-TIME PAYMENTS =====

export const createOneTimePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, membershipTypeId, paymentMethodId } = req.body;
    const paymentIntent = await billingService.createOneTimePayment({
      memberId,
      tenantId: req.tenantId!,
      membershipTypeId,
      paymentMethodId,
    });

    res.json({
      success: true,
      data: {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===== PAYMENT HISTORY =====

export const getPaymentHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await billingService.getPaymentHistory(memberId, req.tenantId!, limit, offset);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await billingService.getRevenueReport(
      req.tenantId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// ===== REFUNDS =====

export const refund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;
    const refundResult = await billingService.refund(req.params.paymentId, req.tenantId!, amount);
    res.json({
      success: true,
      data: {
        refundId: refundResult.id,
        status: refundResult.status,
        amount: (refundResult.amount || 0) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===== STRIPE WEBHOOK =====

export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ success: false, error: 'Missing stripe-signature header' });
    }

    const event = stripeWebhookService.constructEvent(req.body, signature);
    await stripeWebhookService.handleEvent(event);

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ success: false, error: `Webhook Error: ${error.message}` });
  }
};
