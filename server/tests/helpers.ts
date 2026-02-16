import { prisma } from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../src/config/index.js';

// Test data generators
export const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;

export const createTestUser = async (overrides: Partial<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}> = {}) => {
  const email = overrides.email || generateTestEmail();
  const hashedPassword = await bcrypt.hash(overrides.password || 'TestPassword123', 10);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User',
    },
  });
};

export const createTestTenant = async (overrides: Partial<{
  name: string;
  slug: string;
  tier: 'BASE' | 'MID' | 'PREMIUM';
}> = {}) => {
  const slug = overrides.slug || `test-studio-${Date.now()}`;

  return prisma.tenant.create({
    data: {
      name: overrides.name || 'Test Studio',
      slug,
      tier: overrides.tier || 'BASE',
    },
  });
};

export const createTestMember = async (tenantId: string, userId: string, overrides: Partial<{
  phone: string;
  lifecycleStage: 'LEAD' | 'TRIAL' | 'ACTIVE' | 'AT_RISK' | 'CHURNED' | 'WIN_BACK';
}> = {}) => {
  return prisma.member.create({
    data: {
      tenantId,
      userId,
      phone: overrides.phone,
      lifecycleStage: overrides.lifecycleStage || 'LEAD',
    },
  });
};

export const createTestStaff = async (tenantId: string, userId: string, overrides: Partial<{
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'FRONT_DESK';
  isInstructor: boolean;
}> = {}) => {
  return prisma.staff.create({
    data: {
      tenantId,
      userId,
      role: overrides.role || 'ADMIN',
      isInstructor: overrides.isInstructor || false,
    },
  });
};

export const createTestLocation = async (tenantId: string, overrides: Partial<{
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
}> = {}) => {
  return prisma.location.create({
    data: {
      tenantId,
      name: overrides.name || 'Test Location',
      address: overrides.address || '123 Test St',
      city: overrides.city || 'Test City',
      country: overrides.country || 'US',
      timezone: overrides.timezone || 'America/New_York',
    },
  });
};

export const createTestClassType = async (tenantId: string, overrides: Partial<{
  name: string;
  description: string;
  duration: number;
  color: string;
}> = {}) => {
  return prisma.classType.create({
    data: {
      tenantId,
      name: overrides.name || 'Test Class',
      description: overrides.description || 'A test class',
      duration: overrides.duration || 60,
      color: overrides.color || '#6366f1',
    },
  });
};

export const createTestMembershipType = async (tenantId: string, overrides: Partial<{
  name: string;
  kind: 'RECURRING' | 'CLASS_PACK' | 'DROP_IN';
  price: number;
}> = {}) => {
  return prisma.membershipType.create({
    data: {
      tenantId,
      name: overrides.name || 'Test Membership',
      kind: overrides.kind || 'RECURRING',
      price: overrides.price || 99.00,
      billingPeriod: overrides.kind === 'RECURRING' ? 'MONTHLY' : null,
    },
  });
};

// Generate access token for test user
export const generateAccessToken = (userId: string, tenantId?: string) => {
  return jwt.sign(
    { userId, tenantId },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

// Cleanup helpers
export const cleanupTestData = async (ids: {
  userIds?: string[];
  tenantIds?: string[];
  memberIds?: string[];
  staffIds?: string[];
  locationIds?: string[];
}) => {
  // Delete in order due to foreign keys
  if (ids.memberIds?.length) {
    await prisma.member.deleteMany({ where: { id: { in: ids.memberIds } } });
  }
  if (ids.staffIds?.length) {
    await prisma.staff.deleteMany({ where: { id: { in: ids.staffIds } } });
  }
  if (ids.locationIds?.length) {
    await prisma.location.deleteMany({ where: { id: { in: ids.locationIds } } });
  }
  if (ids.tenantIds?.length) {
    await prisma.tenant.deleteMany({ where: { id: { in: ids.tenantIds } } });
  }
  if (ids.userIds?.length) {
    await prisma.user.deleteMany({ where: { id: { in: ids.userIds } } });
  }
};

// Test context - keeps track of created entities for cleanup
export class TestContext {
  userIds: string[] = [];
  tenantIds: string[] = [];
  memberIds: string[] = [];
  staffIds: string[] = [];
  locationIds: string[] = [];

  async createUser(overrides?: Parameters<typeof createTestUser>[0]) {
    const user = await createTestUser(overrides);
    this.userIds.push(user.id);
    return user;
  }

  async createTenant(overrides?: Parameters<typeof createTestTenant>[0]) {
    const tenant = await createTestTenant(overrides);
    this.tenantIds.push(tenant.id);
    return tenant;
  }

  async createMember(tenantId: string, userId: string, overrides?: Parameters<typeof createTestMember>[2]) {
    const member = await createTestMember(tenantId, userId, overrides);
    this.memberIds.push(member.id);
    return member;
  }

  async createStaff(tenantId: string, userId: string, overrides?: Parameters<typeof createTestStaff>[2]) {
    const staff = await createTestStaff(tenantId, userId, overrides);
    this.staffIds.push(staff.id);
    return staff;
  }

  async createLocation(tenantId: string, overrides?: Parameters<typeof createTestLocation>[1]) {
    const location = await createTestLocation(tenantId, overrides);
    this.locationIds.push(location.id);
    return location;
  }

  async cleanup() {
    await cleanupTestData({
      memberIds: this.memberIds,
      staffIds: this.staffIds,
      locationIds: this.locationIds,
      tenantIds: this.tenantIds,
      userIds: this.userIds,
    });
  }
}
