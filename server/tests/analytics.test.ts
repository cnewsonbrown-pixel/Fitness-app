import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { TestContext, generateAccessToken } from './helpers.js';

describe('Analytics API', () => {
  const ctx = new TestContext();
  let managerToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await ctx.createTenant();
    tenantId = tenant.id;

    const managerUser = await ctx.createUser();
    await ctx.createStaff(tenantId, managerUser.id, { role: 'MANAGER' });
    managerToken = generateAccessToken(managerUser.id, tenantId);

    // Create some test data for analytics
    const memberUser = await ctx.createUser({ email: `member-${Date.now()}@test.com` });
    await ctx.createMember(tenantId, memberUser.id, { lifecycleStage: 'ACTIVE' });
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe('GET /api/v1/analytics/dashboard', () => {
    it('should return dashboard metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('memberCount');
      expect(response.body.data).toHaveProperty('memberGrowth');
      expect(response.body.data).toHaveProperty('lifecycleBreakdown');
    });

    it('should require manager role', async () => {
      // Create a front desk user (not manager level)
      const frontDeskUser = await ctx.createUser({ email: `frontdesk-${Date.now()}@test.com` });
      await ctx.createStaff(tenantId, frontDeskUser.id, { role: 'FRONT_DESK' });
      const frontDeskToken = generateAccessToken(frontDeskUser.id, tenantId);

      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${frontDeskToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/analytics/popular-times', () => {
    it('should return popular times data', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/popular-times')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should accept days parameter', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/popular-times?days=90')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/analytics/retention', () => {
    it('should return retention metrics', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/retention')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('retentionRate');
    });
  });

  describe('Reports', () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();

    it('should generate member activity report', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/reports/member-activity?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should generate revenue report', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/reports/revenue?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should generate attendance report', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/reports/attendance?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should generate instructor pay report', async () => {
      const response = await request(app)
        .get(`/api/v1/analytics/reports/instructor-pay?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
