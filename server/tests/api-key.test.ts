import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/config/database.js';
import { TestContext, generateAccessToken } from './helpers.js';

describe('API Key Management', () => {
  const ctx = new TestContext();
  let adminToken: string;
  let tenantId: string;
  let apiKeyId: string;
  let rawApiKey: string;

  beforeAll(async () => {
    const tenant = await ctx.createTenant({ tier: 'PREMIUM' });
    tenantId = tenant.id;

    const adminUser = await ctx.createUser();
    await ctx.createStaff(tenantId, adminUser.id, { role: 'ADMIN' });
    adminToken = generateAccessToken(adminUser.id, tenantId);
  });

  afterAll(async () => {
    await prisma.apiKey.deleteMany({ where: { tenantId } });
    await ctx.cleanup();
  });

  describe('POST /api/v1/api-keys', () => {
    it('should create a new API key', async () => {
      const response = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Integration API Key',
          scopes: ['read:members', 'write:bookings'],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Integration API Key');
      expect(response.body.data.key).toBeDefined(); // Raw key shown only once
      expect(response.body.data.key).toMatch(/^fsk_/); // Prefix check
      expect(response.body.data.prefix).toBeDefined();

      apiKeyId = response.body.data.id;
      rawApiKey = response.body.data.key;
    });

    it('should require admin role', async () => {
      const managerUser = await ctx.createUser({ email: `manager-${Date.now()}@test.com` });
      await ctx.createStaff(tenantId, managerUser.id, { role: 'MANAGER' });
      const managerToken = generateAccessToken(managerUser.id, tenantId);

      const response = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Test Key' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/api-keys', () => {
    it('should list API keys without revealing full key', async () => {
      const response = await request(app)
        .get('/api/v1/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Should not expose full key
      const key = response.body.data.find((k: any) => k.id === apiKeyId);
      expect(key.key).toBeUndefined();
      expect(key.keyHash).toBeUndefined();
      expect(key.prefix).toBeDefined();
    });
  });

  describe('POST /api/v1/api-keys/:id/rotate', () => {
    it('should rotate an API key', async () => {
      const response = await request(app)
        .post(`/api/v1/api-keys/${apiKeyId}/rotate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key).toBeDefined();
      expect(response.body.data.key).not.toBe(rawApiKey); // New key
      expect(response.body.data.key).toMatch(/^fsk_/);

      rawApiKey = response.body.data.key; // Update for subsequent tests
    });
  });

  describe('POST /api/v1/api-keys/:id/revoke', () => {
    it('should revoke an API key', async () => {
      // First create a key to revoke
      const createResponse = await request(app)
        .post('/api/v1/api-keys')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Key to Revoke' })
        .expect(201);

      const keyToRevokeId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/v1/api-keys/${keyToRevokeId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.revokedAt).toBeDefined();
    });
  });
});

describe('Webhook Subscriptions', () => {
  const ctx = new TestContext();
  let adminToken: string;
  let tenantId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const tenant = await ctx.createTenant({ tier: 'PREMIUM' });
    tenantId = tenant.id;

    const adminUser = await ctx.createUser();
    await ctx.createStaff(tenantId, adminUser.id, { role: 'ADMIN' });
    adminToken = generateAccessToken(adminUser.id, tenantId);
  });

  afterAll(async () => {
    await prisma.webhookDeliveryLog.deleteMany({
      where: { subscription: { tenantId } },
    });
    await prisma.webhookSubscription.deleteMany({ where: { tenantId } });
    await ctx.cleanup();
  });

  describe('GET /api/v1/webhook-subscriptions/events', () => {
    it('should list available webhook events', async () => {
      const response = await request(app)
        .get('/api/v1/webhook-subscriptions/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toContain('member.created');
      expect(response.body.data).toContain('booking.created');
    });
  });

  describe('POST /api/v1/webhook-subscriptions', () => {
    it('should create a webhook subscription', async () => {
      const response = await request(app)
        .post('/api/v1/webhook-subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          url: 'https://example.com/webhooks',
          events: ['member.created', 'booking.created'],
          description: 'Test webhook',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe('https://example.com/webhooks');
      expect(response.body.data.events).toContain('member.created');
      expect(response.body.data.secret).toBeDefined(); // Secret for HMAC

      subscriptionId = response.body.data.id;
    });
  });

  describe('GET /api/v1/webhook-subscriptions', () => {
    it('should list webhook subscriptions', async () => {
      const response = await request(app)
        .get('/api/v1/webhook-subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/webhook-subscriptions/:id', () => {
    it('should get subscription with delivery logs', async () => {
      const response = await request(app)
        .get(`/api/v1/webhook-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(subscriptionId);
      expect(response.body.data.deliveryLogs).toBeDefined();
    });
  });

  describe('PUT /api/v1/webhook-subscriptions/:id', () => {
    it('should update subscription', async () => {
      const response = await request(app)
        .put(`/api/v1/webhook-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          events: ['member.created', 'member.updated', 'booking.created'],
          isActive: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toContain('member.updated');
    });
  });

  describe('POST /api/v1/webhook-subscriptions/:id/rotate-secret', () => {
    it('should rotate webhook secret', async () => {
      // Get original secret
      const originalResponse = await request(app)
        .get(`/api/v1/webhook-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const originalSecret = originalResponse.body.data.secret;

      const response = await request(app)
        .post(`/api/v1/webhook-subscriptions/${subscriptionId}/rotate-secret`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.secret).not.toBe(originalSecret);
    });
  });

  describe('POST /api/v1/webhook-subscriptions/:id/test', () => {
    it('should send test webhook', async () => {
      const response = await request(app)
        .post(`/api/v1/webhook-subscriptions/${subscriptionId}/test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('DELETE /api/v1/webhook-subscriptions/:id', () => {
    it('should delete subscription', async () => {
      const response = await request(app)
        .delete(`/api/v1/webhook-subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
