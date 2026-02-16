import { z } from 'zod';

// Password must be at least 8 chars, contain uppercase, lowercase, and number
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  tenantSlug: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Studio name is required').max(200),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

// ============================================
// MEMBER SCHEMAS
// ============================================

export const updateMemberSchema = z.object({
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().datetime().optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  emergencyContactRelation: z.string().max(50).optional(),
  marketingConsent: z.boolean().optional(),
  smsConsent: z.boolean().optional(),
  preferredLocationId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const addTagsSchema = z.object({
  tags: z.array(z.string().min(1).max(50)).min(1, 'At least one tag is required'),
});

export const updateLifecycleStageSchema = z.object({
  stage: z.enum(['LEAD', 'TRIAL', 'ACTIVE', 'AT_RISK', 'CHURNED', 'WIN_BACK']),
});

// ============================================
// MEMBERSHIP TYPE SCHEMAS
// ============================================

export const createMembershipTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['RECURRING', 'CLASS_PACK', 'DROP_IN']),
  price: z.number().min(0, 'Price must be non-negative'),
  billingInterval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  classCredits: z.number().int().min(1).optional(),
  unlimitedClasses: z.boolean().optional(),
  validLocationIds: z.array(z.string().uuid()).optional(),
  validClassTypeIds: z.array(z.string().uuid()).optional(),
  bookingWindowDays: z.number().int().min(1).max(365).optional(),
  isPublic: z.boolean().optional(),
});

export const updateMembershipTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
  billingInterval: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  classCredits: z.number().int().min(1).optional(),
  unlimitedClasses: z.boolean().optional(),
  validLocationIds: z.array(z.string().uuid()).optional(),
  validClassTypeIds: z.array(z.string().uuid()).optional(),
  bookingWindowDays: z.number().int().min(1).max(365).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

// ============================================
// MEMBER MEMBERSHIP SCHEMAS
// ============================================

export const createMemberMembershipSchema = z.object({
  memberId: z.string().uuid().optional(), // Optional for self-purchase
  membershipTypeId: z.string().uuid('Valid membership type ID is required'),
  startDate: z.string().datetime().optional(),
});

export const cancelMembershipSchema = z.object({
  reason: z.string().max(500).optional(),
});

// ============================================
// LOCATION SCHEMAS
// ============================================

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(1, 'Country is required').max(100),
  postalCode: z.string().max(20).optional(),
  timezone: z.string().min(1, 'Timezone is required').max(50),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
});

export const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  postalCode: z.string().max(20).optional(),
  timezone: z.string().min(1).max(50).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// CLASS TYPE SCHEMAS
// ============================================

export const createClassTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(5, 'Duration must be at least 5 minutes').max(480),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code').optional(),
  defaultCapacity: z.number().int().min(1).max(500).optional(),
  requiresMembership: z.boolean().optional(),
});

export const updateClassTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  defaultCapacity: z.number().int().min(1).max(500).optional(),
  requiresMembership: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// CLASS SESSION SCHEMAS
// ============================================

export const createClassSessionSchema = z.object({
  locationId: z.string().uuid('Valid location ID is required'),
  classTypeId: z.string().uuid('Valid class type ID is required'),
  instructorId: z.string().uuid('Valid instructor ID is required'),
  startTime: z.string().datetime('Valid start time is required'),
  endTime: z.string().datetime('Valid end time is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(500),
});

export const updateClassSessionSchema = z.object({
  instructorId: z.string().uuid().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  capacity: z.number().int().min(1).max(500).optional(),
});

// ============================================
// BOOKING SCHEMAS
// ============================================

export const createBookingSchema = z.object({
  classSessionId: z.string().uuid('Valid class session ID is required'),
  memberId: z.string().uuid().optional(), // Optional - staff can book for members
});

export const checkInByQRSchema = z.object({
  memberId: z.string().uuid('Valid member ID is required'),
  classSessionId: z.string().uuid('Valid class session ID is required'),
});

// ============================================
// STAFF SCHEMAS
// ============================================

export const createStaffSchema = z.object({
  userId: z.string().uuid('Valid user ID is required'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'FRONT_DESK']),
  displayName: z.string().min(1, 'Display name is required').max(100),
  bio: z.string().max(500).optional(),
  isInstructor: z.boolean().optional(),
  payRate: z.number().min(0).optional(),
  payType: z.enum(['PER_CLASS', 'HOURLY']).optional(),
  locationIds: z.array(z.string().uuid()).optional(),
});

export const updateStaffSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'INSTRUCTOR', 'FRONT_DESK']).optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  isInstructor: z.boolean().optional(),
  payRate: z.number().min(0).optional(),
  payType: z.enum(['PER_CLASS', 'HOURLY']).optional(),
  isActive: z.boolean().optional(),
  locationIds: z.array(z.string().uuid()).optional(),
});

export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  locationId: z.string().uuid().optional(),
});

export const createOverrideSchema = z.object({
  date: z.string().datetime('Valid date is required'),
  isAvailable: z.boolean(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().max(200).optional(),
});

export const createCertificationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  issuingBody: z.string().min(1, 'Issuing body is required').max(100),
  issueDate: z.string().datetime('Valid issue date is required'),
  expiryDate: z.string().datetime().optional(),
  documentUrl: z.string().url().optional(),
});

export const updateCertificationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  issuingBody: z.string().min(1).max(100).optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  documentUrl: z.string().url().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type AddTagsInput = z.infer<typeof addTagsSchema>;
export type UpdateLifecycleStageInput = z.infer<typeof updateLifecycleStageSchema>;
export type CreateMembershipTypeInput = z.infer<typeof createMembershipTypeSchema>;
export type UpdateMembershipTypeInput = z.infer<typeof updateMembershipTypeSchema>;
export type CreateMemberMembershipInput = z.infer<typeof createMemberMembershipSchema>;
export type CancelMembershipInput = z.infer<typeof cancelMembershipSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type CreateClassTypeInput = z.infer<typeof createClassTypeSchema>;
export type UpdateClassTypeInput = z.infer<typeof updateClassTypeSchema>;
export type CreateClassSessionInput = z.infer<typeof createClassSessionSchema>;
export type UpdateClassSessionInput = z.infer<typeof updateClassSessionSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CheckInByQRInput = z.infer<typeof checkInByQRSchema>;
