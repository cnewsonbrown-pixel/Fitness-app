import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { TestContext, generateAccessToken } from './helpers.js';

describe('Location API', () => {
  const ctx = new TestContext();
  let adminToken: string;
  let tenantId: string;
  let locationId: string;

  beforeAll(async () => {
    const tenant = await ctx.createTenant();
    tenantId = tenant.id;

    const adminUser = await ctx.createUser();
    await ctx.createStaff(tenantId, adminUser.id, { role: 'ADMIN' });
    adminToken = generateAccessToken(adminUser.id, tenantId);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe('POST /api/v1/locations', () => {
    it('should create a new location', async () => {
      const locationData = {
        name: 'Downtown Studio',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        country: 'US',
        postalCode: '10001',
        timezone: 'America/New_York',
        phone: '+1234567890',
        email: 'downtown@studio.com',
      };

      const response = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(locationData.name);
      expect(response.body.data.city).toBe(locationData.city);
      expect(response.body.data.isActive).toBe(true);

      locationId = response.body.data.id;
      ctx.locationIds.push(locationId);
    });

    it('should require name and address', async () => {
      const response = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ city: 'Test City' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/locations', () => {
    it('should list all locations', async () => {
      const response = await request(app)
        .get('/api/v1/locations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter active locations', async () => {
      const response = await request(app)
        .get('/api/v1/locations?activeOnly=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((loc: any) => {
        expect(loc.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/v1/locations/:id', () => {
    it('should get location by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(locationId);
    });
  });

  describe('PUT /api/v1/locations/:id', () => {
    it('should update location', async () => {
      const updates = {
        name: 'Updated Downtown Studio',
        phone: '+0987654321',
      };

      const response = await request(app)
        .put(`/api/v1/locations/${locationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updates.name);
      expect(response.body.data.phone).toBe(updates.phone);
    });
  });

  describe('PUT /api/v1/locations/:id/deactivate', () => {
    it('should deactivate a location', async () => {
      const response = await request(app)
        .put(`/api/v1/locations/${locationId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });
  });
});
