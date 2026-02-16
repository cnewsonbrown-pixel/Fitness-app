import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/config/database.js';
import { TestContext, generateAccessToken } from './helpers.js';

describe('Booking API', () => {
  const ctx = new TestContext();
  let adminToken: string;
  let memberToken: string;
  let tenantId: string;
  let memberId: string;
  let classSessionId: string;
  let membershipId: string;
  let bookingId: string;

  beforeAll(async () => {
    // Create tenant
    const tenant = await ctx.createTenant();
    tenantId = tenant.id;

    // Create admin
    const adminUser = await ctx.createUser({ email: `admin-${Date.now()}@test.com` });
    await ctx.createStaff(tenantId, adminUser.id, { role: 'ADMIN' });
    adminToken = generateAccessToken(adminUser.id, tenantId);

    // Create member user
    const memberUser = await ctx.createUser({ email: `member-${Date.now()}@test.com` });
    const member = await ctx.createMember(tenantId, memberUser.id, { lifecycleStage: 'ACTIVE' });
    memberId = member.id;
    memberToken = generateAccessToken(memberUser.id, tenantId);

    // Create location
    const location = await ctx.createLocation(tenantId);

    // Create class type
    const classType = await prisma.classType.create({
      data: {
        tenantId,
        name: 'Test Yoga',
        duration: 60,
        color: '#6366f1',
      },
    });

    // Create class session (future date)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const classSession = await prisma.classSession.create({
      data: {
        tenantId,
        classTypeId: classType.id,
        locationId: location.id,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 60 * 60 * 1000),
        capacity: 20,
        status: 'SCHEDULED',
      },
    });
    classSessionId = classSession.id;

    // Create membership type and assign to member
    const membershipType = await prisma.membershipType.create({
      data: {
        tenantId,
        name: 'Unlimited Monthly',
        kind: 'RECURRING',
        price: 149.00,
        billingPeriod: 'MONTHLY',
        classCredits: -1, // Unlimited
      },
    });

    const membership = await prisma.memberMembership.create({
      data: {
        tenantId,
        memberId,
        membershipTypeId: membershipType.id,
        status: 'ACTIVE',
        startDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    membershipId = membership.id;
  });

  afterAll(async () => {
    // Clean up bookings first
    if (bookingId) {
      await prisma.booking.deleteMany({ where: { tenantId } });
    }
    await prisma.memberMembership.deleteMany({ where: { tenantId } });
    await prisma.classSession.deleteMany({ where: { tenantId } });
    await prisma.classType.deleteMany({ where: { tenantId } });
    await prisma.membershipType.deleteMany({ where: { tenantId } });
    await ctx.cleanup();
  });

  describe('POST /api/v1/bookings', () => {
    it('should create a booking for a class', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          classSessionId,
          memberId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.classSessionId).toBe(classSessionId);
      expect(response.body.data.memberId).toBe(memberId);
      expect(response.body.data.status).toBe('CONFIRMED');

      bookingId = response.body.data.id;
    });

    it('should prevent double booking', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          classSessionId,
          memberId,
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({ classSessionId, memberId })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/bookings', () => {
    it('should list bookings for member', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should get booking details', async () => {
      const response = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(bookingId);
    });
  });

  describe('POST /api/v1/bookings/:id/cancel', () => {
    it('should cancel a booking', async () => {
      const response = await request(app)
        .post(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('POST /api/v1/bookings/check-in/qr', () => {
    it('should check in member with QR code (staff only)', async () => {
      // First create a new booking to check in
      const newBooking = await prisma.booking.create({
        data: {
          tenantId,
          classSessionId,
          memberId,
          status: 'CONFIRMED',
        },
      });

      const response = await request(app)
        .post('/api/v1/bookings/check-in/qr')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classSessionId,
          memberId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CHECKED_IN');
    });
  });
});
