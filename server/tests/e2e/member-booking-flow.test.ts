import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { prisma } from '../../src/config/database.js';

/**
 * E2E Test: Complete Member Booking Flow
 *
 * This test simulates the full user journey:
 * 1. Admin creates a studio (tenant)
 * 2. Admin creates a location
 * 3. Admin creates a class type
 * 4. Admin creates a membership type
 * 5. Admin creates a class session
 * 6. New member registers
 * 7. Admin assigns membership to member
 * 8. Member books a class
 * 9. Member checks in to class
 * 10. Admin views analytics
 */

describe('E2E: Member Booking Flow', () => {
  // Test data
  let adminToken: string;
  let memberToken: string;
  let tenantId: string;
  let locationId: string;
  let classTypeId: string;
  let membershipTypeId: string;
  let classSessionId: string;
  let memberId: string;
  let membershipId: string;
  let bookingId: string;

  const adminEmail = `admin-e2e-${Date.now()}@test.com`;
  const memberEmail = `member-e2e-${Date.now()}@test.com`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup in reverse order of creation
    if (bookingId) {
      await prisma.booking.deleteMany({ where: { tenantId } }).catch(() => {});
    }
    if (membershipId) {
      await prisma.memberMembership.deleteMany({ where: { tenantId } }).catch(() => {});
    }
    if (classSessionId) {
      await prisma.classSession.deleteMany({ where: { tenantId } }).catch(() => {});
    }
    if (membershipTypeId) {
      await prisma.membershipType.deleteMany({ where: { tenantId } }).catch(() => {});
    }
    if (classTypeId) {
      await prisma.classType.deleteMany({ where: { tenantId } }).catch(() => {});
    }
    if (locationId) {
      await prisma.location.deleteMany({ where: { tenantId } }).catch(() => {});
    }
    if (memberId) {
      await prisma.member.deleteMany({ where: { tenantId } }).catch(() => {});
    }
    await prisma.staff.deleteMany({ where: { tenantId } }).catch(() => {});
    if (tenantId) {
      await prisma.tenant.deleteMany({ where: { id: tenantId } }).catch(() => {});
    }
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, memberEmail] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  // ============================================
  // Step 1: Admin registers and creates studio
  // ============================================

  it('Step 1: Admin registers', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    adminToken = response.body.data.tokens.accessToken;
  });

  it('Step 1b: Admin creates a studio (tenant)', async () => {
    const response = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'E2E Test Fitness Studio',
        slug: `e2e-studio-${Date.now()}`,
        timezone: 'America/New_York',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    tenantId = response.body.data.id;

    // Update admin token to include tenant
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: adminEmail,
        password: 'AdminPassword123!',
      })
      .expect(200);

    adminToken = loginResponse.body.data.tokens.accessToken;
  });

  // ============================================
  // Step 2: Admin creates a location
  // ============================================

  it('Step 2: Admin creates a location', async () => {
    const response = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Main Studio',
        address: '123 Fitness Ave',
        city: 'New York',
        state: 'NY',
        country: 'US',
        postalCode: '10001',
        timezone: 'America/New_York',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Main Studio');
    locationId = response.body.data.id;
  });

  // ============================================
  // Step 3: Admin creates a class type
  // ============================================

  it('Step 3: Admin creates a class type', async () => {
    const response = await request(app)
      .post('/api/v1/class-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Yoga Flow',
        description: 'A relaxing yoga class for all levels',
        duration: 60,
        color: '#6366f1',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Yoga Flow');
    classTypeId = response.body.data.id;
  });

  // ============================================
  // Step 4: Admin creates a membership type
  // ============================================

  it('Step 4: Admin creates a membership type', async () => {
    const response = await request(app)
      .post('/api/v1/membership-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Unlimited Monthly',
        kind: 'RECURRING',
        price: 149.00,
        billingPeriod: 'MONTHLY',
        classCredits: -1, // Unlimited
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Unlimited Monthly');
    membershipTypeId = response.body.data.id;
  });

  // ============================================
  // Step 5: Admin creates a class session
  // ============================================

  it('Step 5: Admin creates a class session', async () => {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1); // Tomorrow
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60);

    const response = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classTypeId,
        locationId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: 20,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.capacity).toBe(20);
    classSessionId = response.body.data.id;
  });

  // ============================================
  // Step 6: New member registers
  // ============================================

  it('Step 6: New member registers', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: memberEmail,
        password: 'MemberPassword123!',
        firstName: 'Test',
        lastName: 'Member',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    memberToken = response.body.data.tokens.accessToken;
  });

  it('Step 6b: Admin creates member profile', async () => {
    const response = await request(app)
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: memberEmail,
        firstName: 'Test',
        lastName: 'Member',
        phone: '+1234567890',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    memberId = response.body.data.id;

    // Update member token to include tenant context
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: memberEmail,
        password: 'MemberPassword123!',
      })
      .expect(200);

    memberToken = loginResponse.body.data.tokens.accessToken;
  });

  // ============================================
  // Step 7: Admin assigns membership to member
  // ============================================

  it('Step 7: Admin assigns membership to member', async () => {
    const response = await request(app)
      .post('/api/v1/memberships')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        memberId,
        membershipTypeId,
        startDate: new Date().toISOString(),
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ACTIVE');
    membershipId = response.body.data.id;
  });

  // ============================================
  // Step 8: Member books a class
  // ============================================

  it('Step 8: Member books a class', async () => {
    const response = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        classSessionId,
        memberId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('CONFIRMED');
    bookingId = response.body.data.id;
  });

  it('Step 8b: Member views their bookings', async () => {
    const response = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.some((b: any) => b.id === bookingId)).toBe(true);
  });

  // ============================================
  // Step 9: Member checks in to class
  // ============================================

  it('Step 9: Staff checks in member via QR', async () => {
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

  // ============================================
  // Step 10: Admin views analytics
  // ============================================

  it('Step 10: Admin views dashboard analytics', async () => {
    const response = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('memberCount');
    expect(response.body.data.memberCount).toBeGreaterThanOrEqual(1);
  });

  it('Step 10b: Admin views attendance report', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const response = await request(app)
      .get(`/api/v1/analytics/reports/attendance?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  // ============================================
  // Verification: Complete flow succeeded
  // ============================================

  it('Verification: All entities created correctly', async () => {
    // Verify tenant
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    expect(tenant).not.toBeNull();
    expect(tenant?.name).toBe('E2E Test Fitness Studio');

    // Verify location
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    expect(location).not.toBeNull();
    expect(location?.name).toBe('Main Studio');

    // Verify class type
    const classType = await prisma.classType.findUnique({ where: { id: classTypeId } });
    expect(classType).not.toBeNull();
    expect(classType?.name).toBe('Yoga Flow');

    // Verify booking is checked in
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking).not.toBeNull();
    expect(booking?.status).toBe('CHECKED_IN');

    // Verify member has active membership
    const membership = await prisma.memberMembership.findUnique({ where: { id: membershipId } });
    expect(membership).not.toBeNull();
    expect(membership?.status).toBe('ACTIVE');
  });
});
