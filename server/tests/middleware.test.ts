import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { TestContext, generateAccessToken } from './helpers.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  const ctx = new TestContext();
  let validToken: string;
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await ctx.createTenant();
    tenantId = tenant.id;

    const user = await ctx.createUser();
    await ctx.createStaff(tenantId, user.id, { role: 'ADMIN' });
    validToken = generateAccessToken(user.id, tenantId);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe('authenticate middleware', () => {
    it('should pass with valid Bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'test-user', tenantId },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Already expired
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid signature', async () => {
      const invalidToken = jwt.sign(
        { userId: 'test-user', tenantId },
        'wrong-secret'
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('requireTenant middleware', () => {
    it('should pass when tenant is set in token', async () => {
      const response = await request(app)
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject when no tenant in token', async () => {
      const user = await ctx.createUser({ email: `notenantuser-${Date.now()}@test.com` });
      const noTenantToken = generateAccessToken(user.id); // No tenantId

      const response = await request(app)
        .get('/api/v1/members')
        .set('Authorization', `Bearer ${noTenantToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('requireStaff middleware', () => {
    it('should pass for authorized role', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject for unauthorized role', async () => {
      // Create a front desk user (not manager level)
      const frontDeskUser = await ctx.createUser({ email: `frontdesk-${Date.now()}@test.com` });
      await ctx.createStaff(tenantId, frontDeskUser.id, { role: 'FRONT_DESK' });
      const frontDeskToken = generateAccessToken(frontDeskUser.id, tenantId);

      const response = await request(app)
        .get('/api/v1/analytics/dashboard') // Requires MANAGER+
        .set('Authorization', `Bearer ${frontDeskToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-staff members', async () => {
      // Create a member (not staff)
      const memberUser = await ctx.createUser({ email: `member-${Date.now()}@test.com` });
      await ctx.createMember(tenantId, memberUser.id);
      const memberToken = generateAccessToken(memberUser.id, tenantId);

      const response = await request(app)
        .get('/api/v1/analytics/dashboard')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Rate Limiting', () => {
  it('should allow requests under limit', async () => {
    // Single request should always pass
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  // Note: Rate limit testing typically requires many rapid requests
  // which can be slow in tests. This is a simplified example.
});

describe('Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/v1/nonexistent')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('should return 400 for validation errors', async () => {
    const ctx = new TestContext();
    const user = await ctx.createUser();
    const token = generateAccessToken(user.id);

    // Invalid data for tenant creation
    const response = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({}) // Missing required fields
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');

    await ctx.cleanup();
  });

  it('should handle JSON parse errors', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('invalid json{')
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});

describe('CORS', () => {
  it('should include CORS headers', async () => {
    const response = await request(app)
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBeDefined();
  });
});

describe('Security Headers', () => {
  it('should include security headers via helmet', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .expect(200);

    // Helmet adds various security headers
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });
});
