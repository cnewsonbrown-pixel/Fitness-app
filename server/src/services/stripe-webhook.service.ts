import Stripe from 'stripe';
import { stripe } from '../config/stripe.js';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { MembershipStatus, PaymentStatus, PaymentType } from '@prisma/client';

export class StripeWebhookService {
  /**
   * Verify and construct a Stripe event from the raw body
   */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhookSecret
    );
  }

  /**
   * Handle a Stripe webhook event
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        // Unhandled event type - log but don't error
        console.log(`Unhandled Stripe event: ${event.type}`);
    }
  }

  /**
   * Invoice paid - renew membership
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const membership = await prisma.memberMembership.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    });

    if (!membership) return;

    // Update membership period
    const now = new Date();
    const periodEnd = new Date(now);

    // Determine billing period from the invoice
    if (invoice.lines.data.length > 0) {
      const line = invoice.lines.data[0];
      if (line.period) {
        periodEnd.setTime(line.period.end * 1000);
      }
    }

    await prisma.memberMembership.update({
      where: { id: membership.id },
      data: {
        status: MembershipStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Record payment
    await prisma.payment.create({
      data: {
        tenantId: invoice.metadata?.tenantId || '',
        memberId: membership.memberId,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_paid || 0) / 100,
        status: PaymentStatus.SUCCEEDED,
        type: PaymentType.SUBSCRIPTION,
        description: `Subscription renewal`,
        paidAt: new Date(),
      },
    });
  }

  /**
   * Invoice payment failed - mark membership at risk
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const membership = await prisma.memberMembership.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      include: { member: true },
    });

    if (!membership) return;

    // Record the failed payment
    await prisma.payment.create({
      data: {
        tenantId: membership.member.tenantId,
        memberId: membership.memberId,
        stripeInvoiceId: invoice.id,
        amount: (invoice.amount_due || 0) / 100,
        status: PaymentStatus.FAILED,
        type: PaymentType.SUBSCRIPTION,
        description: 'Subscription payment failed',
        failedAt: new Date(),
      },
    });

    // Update member lifecycle stage to AT_RISK
    await prisma.member.update({
      where: { id: membership.memberId },
      data: { lifecycleStage: 'AT_RISK' },
    });
  }

  /**
   * Subscription updated (e.g., plan change, pause)
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const membership = await prisma.memberMembership.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!membership) return;

    let status = membership.status;

    if (subscription.status === 'active') {
      status = MembershipStatus.ACTIVE;
    } else if (subscription.status === 'paused') {
      status = MembershipStatus.PAUSED;
    } else if (subscription.status === 'canceled') {
      status = MembershipStatus.CANCELLED;
    }

    await prisma.memberMembership.update({
      where: { id: membership.id },
      data: {
        status,
        pausedAt: subscription.status === 'paused' ? new Date() : membership.pausedAt,
        cancelledAt: subscription.cancel_at_period_end ? new Date() : membership.cancelledAt,
      },
    });
  }

  /**
   * Subscription deleted - cancel membership
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const membership = await prisma.memberMembership.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!membership) return;

    await prisma.memberMembership.update({
      where: { id: membership.id },
      data: {
        status: MembershipStatus.CANCELLED,
        cancelledAt: new Date(),
        endDate: new Date(),
      },
    });

    // Update member lifecycle
    await prisma.member.update({
      where: { id: membership.memberId },
      data: { lifecycleStage: 'CHURNED' },
    });
  }

  /**
   * One-time payment succeeded
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        paidAt: new Date(),
      },
    });
  }

  /**
   * One-time payment failed
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
      },
    });
  }
}

export const stripeWebhookService = new StripeWebhookService();
