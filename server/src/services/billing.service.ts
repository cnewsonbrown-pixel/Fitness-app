import Stripe from 'stripe';
import { stripe } from '../config/stripe.js';
import { prisma } from '../config/database.js';
import { PaymentStatus, PaymentType, MembershipStatus, MembershipKind } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export class BillingService {
  // ===== CUSTOMER MANAGEMENT =====

  /**
   * Get or create a Stripe customer for a member
   */
  async getOrCreateCustomer(memberId: string): Promise<string> {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
        tenant: true,
      },
    });

    if (!member) throw new NotFoundError('Member not found');

    // Check if tenant already has a Stripe customer ID
    if (member.tenant.stripeCustomerId) {
      // Check if member has metadata on the customer
      // For multi-tenant, we create per-member customers
    }

    // Search for existing customer by email + metadata
    const existing = await stripe.customers.list({
      email: member.user.email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      const customer = existing.data[0];
      if (customer.metadata?.memberId === memberId) {
        return customer.id;
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: member.user.email,
      name: `${member.user.firstName} ${member.user.lastName}`,
      metadata: {
        memberId,
        tenantId: member.tenantId,
      },
    });

    return customer.id;
  }

  /**
   * Create a setup intent for saving payment methods
   */
  async createSetupIntent(memberId: string): Promise<Stripe.SetupIntent> {
    const customerId = await this.getOrCreateCustomer(memberId);

    return stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
  }

  /**
   * List payment methods for a member
   */
  async listPaymentMethods(memberId: string): Promise<Stripe.PaymentMethod[]> {
    const customerId = await this.getOrCreateCustomer(memberId);

    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return methods.data;
  }

  /**
   * Detach a payment method
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    await stripe.paymentMethods.detach(paymentMethodId);
  }

  // ===== SUBSCRIPTION BILLING =====

  /**
   * Create a subscription for a recurring membership
   */
  async createSubscription(input: {
    memberId: string;
    memberMembershipId: string;
    paymentMethodId: string;
  }): Promise<Stripe.Subscription> {
    const { memberId, memberMembershipId, paymentMethodId } = input;

    const membership = await prisma.memberMembership.findUnique({
      where: { id: memberMembershipId },
      include: { membershipType: true },
    });

    if (!membership) throw new NotFoundError('Membership not found');
    if (membership.membershipType.type !== MembershipKind.RECURRING) {
      throw new BadRequestError('Only recurring memberships can have subscriptions');
    }

    const customerId = await this.getOrCreateCustomer(memberId);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Determine billing interval
    const interval = membership.membershipType.billingInterval;
    let stripeInterval: Stripe.PriceCreateParams.Recurring.Interval = 'month';
    if (interval === 'WEEKLY') stripeInterval = 'week';
    else if (interval === 'YEARLY') stripeInterval = 'year';

    // Create a price for this membership
    const price = await stripe.prices.create({
      unit_amount: Math.round(Number(membership.membershipType.price) * 100),
      currency: 'usd',
      recurring: { interval: stripeInterval },
      product_data: {
        name: membership.membershipType.name,
        metadata: {
          membershipTypeId: membership.membershipType.id,
          tenantId: membership.membershipType.tenantId,
        },
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        memberMembershipId,
        memberId,
        tenantId: membership.membershipType.tenantId,
      },
    });

    // Update membership with Stripe subscription ID
    await prisma.memberMembership.update({
      where: { id: memberMembershipId },
      data: { stripeSubscriptionId: subscription.id },
    });

    return subscription;
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(memberMembershipId: string, cancelAtPeriodEnd = true): Promise<void> {
    const membership = await prisma.memberMembership.findUnique({
      where: { id: memberMembershipId },
    });

    if (!membership?.stripeSubscriptionId) {
      throw new BadRequestError('No active subscription found');
    }

    if (cancelAtPeriodEnd) {
      await stripe.subscriptions.update(membership.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      await stripe.subscriptions.cancel(membership.stripeSubscriptionId);
    }
  }

  /**
   * Pause a subscription (by pausing payment collection)
   */
  async pauseSubscription(memberMembershipId: string): Promise<void> {
    const membership = await prisma.memberMembership.findUnique({
      where: { id: memberMembershipId },
    });

    if (!membership?.stripeSubscriptionId) {
      throw new BadRequestError('No active subscription found');
    }

    await stripe.subscriptions.update(membership.stripeSubscriptionId, {
      pause_collection: { behavior: 'void' },
    });
  }

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(memberMembershipId: string): Promise<void> {
    const membership = await prisma.memberMembership.findUnique({
      where: { id: memberMembershipId },
    });

    if (!membership?.stripeSubscriptionId) {
      throw new BadRequestError('No active subscription found');
    }

    await stripe.subscriptions.update(membership.stripeSubscriptionId, {
      pause_collection: '',
    } as any);
  }

  // ===== ONE-TIME PAYMENTS =====

  /**
   * Create a one-time payment for class pack or drop-in
   */
  async createOneTimePayment(input: {
    memberId: string;
    tenantId: string;
    membershipTypeId: string;
    paymentMethodId: string;
  }): Promise<Stripe.PaymentIntent> {
    const { memberId, tenantId, membershipTypeId, paymentMethodId } = input;

    const membershipType = await prisma.membershipType.findFirst({
      where: { id: membershipTypeId, tenantId },
    });

    if (!membershipType) throw new NotFoundError('Membership type not found');
    if (membershipType.type === MembershipKind.RECURRING) {
      throw new BadRequestError('Use subscription billing for recurring memberships');
    }

    const customerId = await this.getOrCreateCustomer(memberId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(membershipType.price) * 100),
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        memberId,
        tenantId,
        membershipTypeId,
        type: membershipType.type,
      },
    });

    // Record the payment
    await prisma.payment.create({
      data: {
        tenantId,
        memberId,
        stripePaymentIntentId: paymentIntent.id,
        amount: membershipType.price,
        status: paymentIntent.status === 'succeeded' ? PaymentStatus.SUCCEEDED : PaymentStatus.PENDING,
        type: membershipType.type === MembershipKind.CLASS_PACK ? PaymentType.CLASS_PACK : PaymentType.DROP_IN,
        description: `${membershipType.name} purchase`,
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
      },
    });

    // If succeeded, create the membership
    if (paymentIntent.status === 'succeeded') {
      await this.activateMembershipFromPayment(memberId, membershipType);
    }

    return paymentIntent;
  }

  /**
   * Activate membership after successful payment
   */
  private async activateMembershipFromPayment(memberId: string, membershipType: any) {
    const now = new Date();
    let periodEnd = new Date();

    if (membershipType.type === MembershipKind.CLASS_PACK) {
      // Class packs last 90 days by default
      periodEnd.setDate(periodEnd.getDate() + 90);
    } else {
      // Drop-ins last 1 day
      periodEnd.setDate(periodEnd.getDate() + 1);
    }

    await prisma.memberMembership.create({
      data: {
        memberId,
        membershipTypeId: membershipType.id,
        status: MembershipStatus.ACTIVE,
        startDate: now,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        creditsRemaining: membershipType.classCredits,
      },
    });
  }

  // ===== PAYMENT HISTORY =====

  /**
   * Get payment history for a member
   */
  async getPaymentHistory(memberId: string, tenantId: string, limit = 20, offset = 0) {
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { memberId, tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where: { memberId, tenantId } }),
    ]);

    return { payments, total, limit, offset };
  }

  /**
   * Get revenue report for a tenant
   */
  async getRevenueReport(tenantId: string, startDate: Date, endDate: Date) {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: PaymentStatus.SUCCEEDED,
        paidAt: { gte: startDate, lte: endDate },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const byType = payments.reduce(
      (acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + Number(p.amount);
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      period: { startDate, endDate },
      totalRevenue,
      paymentCount: payments.length,
      byType,
    };
  }

  // ===== REFUNDS =====

  /**
   * Issue a refund
   */
  async refund(paymentId: string, tenantId: string, amount?: number): Promise<Stripe.Refund> {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId, status: PaymentStatus.SUCCEEDED },
    });

    if (!payment) throw new NotFoundError('Payment not found or not eligible for refund');
    if (!payment.stripePaymentIntentId) throw new BadRequestError('No Stripe payment to refund');

    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Full refund if no amount
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: amount ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    return refund;
  }
}

export const billingService = new BillingService();
