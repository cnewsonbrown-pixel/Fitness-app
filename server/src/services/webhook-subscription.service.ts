import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

// ============================================
// WEBHOOK EVENTS
// ============================================

export const WEBHOOK_EVENTS = [
  'member.created',
  'member.updated',
  'member.deleted',
  'booking.created',
  'booking.cancelled',
  'booking.checked_in',
  'payment.succeeded',
  'payment.failed',
  'membership.activated',
  'membership.cancelled',
  'membership.expired',
  'class.created',
  'class.cancelled',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

export const createSubscription = async (
  tenantId: string,
  data: {
    url: string;
    events: string[];
    description?: string;
  }
) => {
  // Generate a secure secret for HMAC signing
  const secret = crypto.randomBytes(32).toString('hex');

  return prisma.webhookSubscription.create({
    data: {
      tenantId,
      url: data.url,
      events: data.events,
      description: data.description,
      secret,
    },
  });
};

export const updateSubscription = async (
  tenantId: string,
  id: string,
  data: Partial<{
    url: string;
    events: string[];
    description: string;
    isActive: boolean;
  }>
) => {
  return prisma.webhookSubscription.update({
    where: { id, tenantId },
    data,
  });
};

export const deleteSubscription = async (tenantId: string, id: string) => {
  return prisma.webhookSubscription.delete({ where: { id, tenantId } });
};

export const getSubscription = async (tenantId: string, id: string) => {
  return prisma.webhookSubscription.findFirst({
    where: { id, tenantId },
    include: {
      deliveryLogs: { orderBy: { deliveredAt: 'desc' }, take: 10 },
    },
  });
};

export const listSubscriptions = async (tenantId: string) => {
  return prisma.webhookSubscription.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
};

export const rotateSecret = async (tenantId: string, id: string) => {
  const newSecret = crypto.randomBytes(32).toString('hex');
  return prisma.webhookSubscription.update({
    where: { id, tenantId },
    data: { secret: newSecret },
  });
};

// ============================================
// DELIVERY
// ============================================

export const deliver = async (
  tenantId: string,
  event: string,
  payload: Record<string, any>
) => {
  // Find all active subscriptions for this event
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: {
      tenantId,
      isActive: true,
      events: { has: event },
    },
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => deliverToSubscription(sub, event, payload))
  );

  return results.map((r, i) => ({
    subscriptionId: subscriptions[i].id,
    success: r.status === 'fulfilled' && r.value.success,
  }));
};

const deliverToSubscription = async (
  subscription: { id: string; url: string; secret: string; failureCount: number },
  event: string,
  payload: Record<string, any>
) => {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
  const signature = crypto.createHmac('sha256', subscription.secret).update(body).digest('hex');

  let statusCode: number | undefined;
  let response: string | undefined;
  let success = false;

  try {
    const res = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    statusCode = res.status;
    response = await res.text().catch(() => '');
    success = res.ok;
  } catch (err: any) {
    response = err.message || 'Delivery failed';
  }

  // Log the delivery
  await prisma.webhookDeliveryLog.create({
    data: {
      subscriptionId: subscription.id,
      event,
      payload,
      statusCode,
      response: response?.substring(0, 1000),
      success,
    },
  });

  // Update subscription status
  await prisma.webhookSubscription.update({
    where: { id: subscription.id },
    data: {
      lastDeliveryAt: new Date(),
      lastDeliveryStatus: success ? 'success' : 'failed',
      failureCount: success ? 0 : subscription.failureCount + 1,
    },
  });

  return { success, statusCode, response };
};

// ============================================
// RETRY LOGIC
// ============================================

export const retryFailedDeliveries = async () => {
  // Find recent failed deliveries with low retry count
  const failedLogs = await prisma.webhookDeliveryLog.findMany({
    where: {
      success: false,
      retryCount: { lt: 3 },
      deliveredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24h
    },
    include: { subscription: true },
    take: 100,
  });

  for (const log of failedLogs) {
    if (!log.subscription.isActive) continue;

    const payload = log.payload as Record<string, any>;
    await deliverToSubscription(log.subscription, log.event, payload.data || payload);

    // Update retry count
    await prisma.webhookDeliveryLog.update({
      where: { id: log.id },
      data: { retryCount: log.retryCount + 1 },
    });
  }
};

// ============================================
// DELIVERY LOGS
// ============================================

export const getDeliveryLogs = async (
  tenantId: string,
  subscriptionId?: string,
  limit = 50
) => {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: { tenantId },
    select: { id: true },
  });

  const subscriptionIds = subscriptions.map((s) => s.id);

  return prisma.webhookDeliveryLog.findMany({
    where: {
      subscriptionId: subscriptionId ? subscriptionId : { in: subscriptionIds },
    },
    orderBy: { deliveredAt: 'desc' },
    take: limit,
  });
};

export const webhookSubscriptionService = {
  WEBHOOK_EVENTS,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  rotateSecret,
  deliver,
  retryFailedDeliveries,
  getDeliveryLogs,
};
