import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { TestContext, generateAccessToken } from './helpers.js';

describe('Tenant API', () => {
  const ctx = new TestContext();
  let accessToken: string;
  let tenantId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await ctx.createUser();
    accessToken = generateAccessToken(user.id);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe('POST /api/v1/tenants', () => {
    it('should create a new tenant (studio)', async () => {
      const tenantData = {
        name: 'My Fitness Studio',
        slug: `test-studio-${Date.now()}`,
        timezone: 'America/New_York',
      };

      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(tenantData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(tenantData.name);
      expect(response.body.data.slug).toBe(tenantData.slug);
      expect(response.body.data.tier).toBe('BASE'); // Default tier

      tenantId = response.body.data.id;
      ctx.tenantIds.push(tenantId);
    });

    it('should reject duplicate slug', async () => {
      const existingTenant = await ctx.createTenant({ slug: `unique-slug-${Date.now()}` });

      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Another Studio',
          slug: existingTenant.slug, // Duplicate
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/tenants')
        .send({ name: 'Test', slug: 'test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/tenants/:id', () => {
    it('should get tenant details', async () => {
      const response = await request(app)
        .get(`/api/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(tenantId);
    });

    it('should return 404 for non-existent tenant', async () => {
      const response = await request(app)
        .get('/api/v1/tenants/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/tenants/:id', () => {
    it('should update tenant settings', async () => {
      const updates = {
        name: 'Updated Studio Name',
        timezone: 'America/Los_Angeles',
        bookingWindowDays: 21,
      };

      const response = await request(app)
        .put(`/api/v1/tenants/${tenantId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
      expect(response.body.data.timezone).toBe(updates.timezone);
      expect(response.body.data.bookingWindowDays).toBe(updates.bookingWindowDays);
    });
  });
});
