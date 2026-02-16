import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index.js';
import { prisma } from '../../src/config/database.js';

/**
 * E2E Test: Staff Management Flow
 *
 * This test simulates:
 * 1. Owner creates studio
 * 2. Owner adds admin staff
 * 3. Owner adds instructor
 * 4. Instructor sets availability
 * 5. Instructor gets assigned to class
 * 6. Instructor views their schedule
 * 7. Admin views instructor pay report
 */

describe('E2E: Staff Management Flow', () => {
  let ownerToken: string;
  let adminToken: string;
  let instructorToken: string;
  let tenantId: string;
  let locationId: string;
  let classTypeId: string;
  let classSessionId: string;
  let adminStaffId: string;
  let instructorStaffId: string;

  const ownerEmail = `owner-staff-${Date.now()}@test.com`;
  const adminEmail = `admin-staff-${Date.now()}@test.com`;
  const instructorEmail = `instructor-staff-${Date.now()}@test.com`;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.classSession.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.classType.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.staffLocation.deleteMany({ where: { staff: { tenantId } } }).catch(() => {});
    await prisma.location.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.staff.deleteMany({ where: { tenantId } }).catch(() => {});
    await prisma.tenant.deleteMany({ where: { id: tenantId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, adminEmail, instructorEmail] } }
    }).catch(() => {});
    await prisma.$disconnect();
  });

  // ============================================
  // Setup: Owner creates studio
  // ============================================

  it('Setup: Owner registers and creates studio', async () => {
    // Register owner
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: ownerEmail,
        password: 'OwnerPassword123!',
        firstName: 'Studio',
        lastName: 'Owner',
      })
      .expect(201);

    ownerToken = registerResponse.body.data.tokens.accessToken;

    // Create tenant
    const tenantResponse = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Staff Test Studio',
        slug: `staff-test-${Date.now()}`,
        timezone: 'America/New_York',
      })
      .expect(201);

    tenantId = tenantResponse.body.data.id;

    // Re-login to get tenant context
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: ownerEmail, password: 'OwnerPassword123!' })
      .expect(200);

    ownerToken = loginResponse.body.data.tokens.accessToken;
  });

  it('Setup: Create location', async () => {
    const response = await request(app)
      .post('/api/v1/locations')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Downtown Location',
        address: '456 Main St',
        city: 'New York',
        country: 'US',
        timezone: 'America/New_York',
      })
      .expect(201);

    locationId = response.body.data.id;
  });

  it('Setup: Create class type', async () => {
    const response = await request(app)
      .post('/api/v1/class-types')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'HIIT Training',
        duration: 45,
        color: '#ef4444',
      })
      .expect(201);

    classTypeId = response.body.data.id;
  });

  // ============================================
  // Step 1: Owner adds admin staff
  // ============================================

  it('Step 1: Register admin user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: adminEmail,
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'Staff',
      })
      .expect(201);

    adminToken = response.body.data.tokens.accessToken;
  });

  it('Step 1b: Owner adds admin to staff', async () => {
    const response = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: adminEmail,
        role: 'ADMIN',
        locationIds: [locationId],
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.role).toBe('ADMIN');
    adminStaffId = response.body.data.id;

    // Re-login admin to get tenant context
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: 'AdminPassword123!' })
      .expect(200);

    adminToken = loginResponse.body.data.tokens.accessToken;
  });

  // ============================================
  // Step 2: Owner adds instructor
  // ============================================

  it('Step 2: Register instructor user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: instructorEmail,
        password: 'InstructorPassword123!',
        firstName: 'Fitness',
        lastName: 'Instructor',
      })
      .expect(201);

    instructorToken = response.body.data.tokens.accessToken;
  });

  it('Step 2b: Owner adds instructor to staff', async () => {
    const response = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        email: instructorEmail,
        role: 'INSTRUCTOR',
        isInstructor: true,
        locationIds: [locationId],
        payRate: 50.00,
        payType: 'PER_CLASS',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.role).toBe('INSTRUCTOR');
    expect(response.body.data.isInstructor).toBe(true);
    instructorStaffId = response.body.data.id;

    // Re-login instructor to get tenant context
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: instructorEmail, password: 'InstructorPassword123!' })
      .expect(200);

    instructorToken = loginResponse.body.data.tokens.accessToken;
  });

  // ============================================
  // Step 3: Instructor sets availability
  // ============================================

  it('Step 3: Instructor sets weekly availability', async () => {
    // Set availability for Monday, Wednesday, Friday
    for (const dayOfWeek of [1, 3, 5]) {
      const response = await request(app)
        .post(`/api/v1/staff/${instructorStaffId}/availability`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
          locationId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    }
  });

  // ============================================
  // Step 4: Create class with instructor
  // ============================================

  it('Step 4: Admin creates class with instructor', async () => {
    const startTime = new Date();
    // Find next Monday
    startTime.setDate(startTime.getDate() + ((1 + 7 - startTime.getDay()) % 7 || 7));
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 45);

    const response = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classTypeId,
        locationId,
        instructorId: instructorStaffId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: 15,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.instructorId).toBe(instructorStaffId);
    classSessionId = response.body.data.id;
  });

  // ============================================
  // Step 5: Instructor views their schedule
  // ============================================

  it('Step 5: Instructor views their schedule', async () => {
    const response = await request(app)
      .get(`/api/v1/staff/${instructorStaffId}/schedule`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  // ============================================
  // Step 6: Admin views staff list
  // ============================================

  it('Step 6: Admin views all staff', async () => {
    const response = await request(app)
      .get('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2); // Admin + Instructor
  });

  // ============================================
  // Step 7: Admin views instructor pay report
  // ============================================

  it('Step 7: Admin generates instructor pay report', async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const response = await request(app)
      .get(`/api/v1/analytics/reports/instructor-pay?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  // ============================================
  // Verification
  // ============================================

  it('Verification: Staff roles are correct', async () => {
    const admin = await prisma.staff.findUnique({ where: { id: adminStaffId } });
    expect(admin?.role).toBe('ADMIN');
    expect(admin?.isInstructor).toBe(false);

    const instructor = await prisma.staff.findUnique({ where: { id: instructorStaffId } });
    expect(instructor?.role).toBe('INSTRUCTOR');
    expect(instructor?.isInstructor).toBe(true);
  });

  it('Verification: Instructor is assigned to class', async () => {
    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
    });
    expect(classSession?.instructorId).toBe(instructorStaffId);
  });
});
