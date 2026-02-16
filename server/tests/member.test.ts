import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { TestContext, generateAccessToken } from './helpers.js';

describe('Member API', () => {
  const ctx = new TestContext();
  let adminToken: string;
  let tenantId: string;
  let memberId: string;

  beforeAll(async () => {
    // Create tenant and admin user
    const tenant = await ctx.createTenant();
    tenantId = tenant.id;

    const adminUser = await ctx.createUser({ email: `admin-${Date.now()}@test.com` });
    await ctx.createStaff(tenantId, adminUser.id, { role: 'ADMIN' });
    adminToken = generateAccessToken(adminUser.id, tenantId);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe('POST /api/v1/members', () => {
    it('should create a new member', async () => {
      const memberData = {
        email: `member-${Date.now()}@test.com`,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/v1/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(memberData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(memberData.email);
      expect(response.body.data.user.firstName).toBe(memberData.firstName);
      expect(response.body.data.lifecycleStage).toBe('LEAD');

      memberId = response.body.data.id;
      ctx.memberIds.push(memberId);
      ctx.userIds.push(response.body.data.userId);
    });

    it('should reject duplicate email within tenant', async () => {
      const existingUser = await ctx.createUser();
      await ctx.createMember(tenantId, existingUser.id);

      const response = await request(app)
        .post('/api/v1/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: existingUser.email,
          firstName: 'Duplicate',
          lastName: 'User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/members')
        .send({ email: 'test@test.com', firstName: 'Test', lastName: 'User' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/members', () => {
    it('should list all members', async () => {
      const response = await request(app)
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter by lifecycle stage', async () => {
      const response = await request(app)
        .get('/api/v1/members?lifecycleStage=LEAD')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((member: any) => {
        expect(member.lifecycleStage).toBe('LEAD');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/members?limit=1&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/members/:id', () => {
    it('should get member by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(memberId);
    });

    it('should return 404 for non-existent member', async () => {
      const response = await request(app)
        .get('/api/v1/members/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/members/:id', () => {
    it('should update member details', async () => {
      const updates = {
        phone: '+0987654321',
        lifecycleStage: 'ACTIVE',
        tags: ['vip', 'early-adopter'],
      };

      const response = await request(app)
        .put(`/api/v1/members/${memberId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBe(updates.phone);
      expect(response.body.data.lifecycleStage).toBe(updates.lifecycleStage);
      expect(response.body.data.tags).toEqual(updates.tags);
    });
  });

  describe('POST /api/v1/members/:id/tags', () => {
    it('should add tags to member', async () => {
      const response = await request(app)
        .post(`/api/v1/members/${memberId}/tags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tags: ['premium', 'newsletter'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toContain('premium');
      expect(response.body.data.tags).toContain('newsletter');
    });
  });
});
