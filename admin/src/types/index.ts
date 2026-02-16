// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// Tenant Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
  tier: TenantTier;
  settings: TenantSettings;
  createdAt: string;
}

export type TenantTier = 'BASE' | 'MID' | 'PREMIUM';

export interface TenantSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bookingWindowDays?: number;
  cancellationWindowHours?: number;
  waitlistEnabled?: boolean;
  waiverEnabled?: boolean;
}

export interface TenantStats {
  memberCount: number;
  memberGrowth: number;
  activeClassCount: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  attendanceRate: number;
}

// Staff Types
export interface Staff {
  id: string;
  user: User;
  role: StaffRole;
  isInstructor: boolean;
  isActive: boolean;
  locations: Location[];
  createdAt: string;
}

export type StaffRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'INSTRUCTOR' | 'FRONT_DESK';

export interface InstructorAvailability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface InstructorOverride {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
}

export interface PaySummary {
  totalEarnings: number;
  classCount: number;
  averagePerClass: number;
  breakdown: Array<{
    classTypeName: string;
    count: number;
    rate: number;
    total: number;
  }>;
}

export interface InstructorMetrics {
  totalClasses: number;
  averageAttendance: number;
  cancellationRate: number;
  avgRating?: number;
}

// Member Types
export interface Member {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  lifecycleStage: LifecycleStage;
  tags: string[];
  pointBalance: number;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}

export type LifecycleStage = 'LEAD' | 'TRIAL' | 'ACTIVE' | 'AT_RISK' | 'CHURNED' | 'PAUSED';

// Membership Types
export interface MembershipType {
  id: string;
  name: string;
  type: MembershipTypeKind;
  price: number;
  billingPeriod?: BillingPeriod;
  classCredits?: number;
  description?: string;
  isActive: boolean;
}

export type MembershipTypeKind = 'RECURRING' | 'CLASS_PACK' | 'DROP_IN';
export type BillingPeriod = 'MONTHLY' | 'YEARLY' | 'WEEKLY';

export interface MemberMembership {
  id: string;
  member: Member;
  membershipType: MembershipType;
  status: MembershipStatus;
  startDate: string;
  endDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  creditsRemaining?: number;
  pausedAt?: string;
  pauseEndDate?: string;
}

export type MembershipStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED' | 'EXPIRED' | 'PAST_DUE' | 'PENDING';

// Location Types
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  isActive: boolean;
}

// Class Types
export interface ClassType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  color: string;
  isActive: boolean;
}

export interface ClassSession {
  id: string;
  classType: ClassType;
  location: Location;
  instructor: { id: string; firstName: string; lastName: string; avatarUrl?: string };
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  status: ClassStatus;
  isCancelled: boolean;
}

export type ClassStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Booking Types
export interface Booking {
  id: string;
  member: { id: string; firstName: string; lastName: string; email: string };
  classSession: ClassSession;
  status: BookingStatus;
  checkedInAt?: string;
  isWaitlisted: boolean;
  waitlistPosition?: number;
  createdAt: string;
}

export type BookingStatus = 'CONFIRMED' | 'WAITLISTED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED';

// Billing Types
export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: string;
  description?: string;
  stripePaymentIntentId?: string;
  createdAt: string;
}

export type PaymentStatus = 'SUCCEEDED' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface RevenueReport {
  totalRevenue: number;
  revenueGrowth: number;
  byType: Array<{ type: string; amount: number; count: number }>;
  daily: Array<{ date: string; amount: number }>;
}

// Marketing Types
export interface Campaign {
  id: string;
  name: string;
  subject?: string;
  channel: 'EMAIL' | 'SMS';
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
  segmentId?: string;
  content: string;
  scheduledAt?: string;
  sentAt?: string;
  stats?: { sent: number; opened: number; clicked: number };
  createdAt: string;
}

export interface LeadForm {
  id: string;
  name: string;
  fields: Array<{ name: string; type: string; required: boolean; label: string }>;
  isActive: boolean;
  submissionCount: number;
  createdAt: string;
}

export interface LeadSubmission {
  id: string;
  leadFormId: string;
  data: Record<string, string>;
  isConverted: boolean;
  convertedMemberId?: string;
  createdAt: string;
}

// Analytics Types
export interface DashboardMetrics {
  memberCount: number;
  memberGrowth: number;
  activeMembers: number;
  classAttendanceRate: number;
  totalRevenue: number;
  revenueGrowth: number;
  lifecycleBreakdown: Record<LifecycleStage, number>;
}

export interface PopularTimes {
  data: Array<{ dayOfWeek: number; hour: number; count: number }>;
}

export interface RetentionData {
  overallRate: number;
  monthly: Array<{ month: string; rate: number; cohortSize: number }>;
}

// CRM Types
export interface Journey {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  triggerType: 'LIFECYCLE_CHANGE' | 'EVENT' | 'SEGMENT' | 'MANUAL' | 'SCHEDULED';
  triggerConfig: Record<string, unknown>;
  steps: JourneyStep[];
  enrollmentCount: number;
  createdAt: string;
}

export interface JourneyStep {
  id: string;
  type: 'EMAIL' | 'SMS' | 'WAIT' | 'CONDITION' | 'UPDATE_MEMBER' | 'NOTIFY_STAFF';
  config: Record<string, unknown>;
  order: number;
  delayMinutes: number;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  criteria: Array<{ field: string; operator: string; value: unknown }>;
  memberCount: number;
  lastCalculatedAt: string;
  createdAt: string;
}

export interface LeadScoringRule {
  id: string;
  name: string;
  event: string;
  points: number;
  isActive: boolean;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  channel: 'EMAIL' | 'SMS';
  category: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
}

// Content Types
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category: string;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'CELEBRATION';
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}

// Gamification Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  criteria: Record<string, unknown>;
  earnedCount: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'INDIVIDUAL' | 'TEAM';
  goalType: 'CLASSES_ATTENDED' | 'POINTS_EARNED' | 'STREAK_DAYS' | 'CUSTOM';
  goalValue: number;
  startDate: string;
  endDate: string;
  pointReward: number;
  participantCount: number;
  isActive: boolean;
}

export interface PointTransaction {
  id: string;
  memberId: string;
  memberName: string;
  points: number;
  reason: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  memberName: string;
  avatarUrl?: string;
  value: number;
}

// Video Types
export interface VideoProgram {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  level: VideoLevel;
  isPublished: boolean;
  isPremium: boolean;
  videoCount: number;
  totalDuration: number;
  createdAt: string;
}

export type VideoLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  vimeoId?: string;
  vimeoUrl?: string;
  duration: number;
  level: VideoLevel;
  isPremium: boolean;
  order: number;
  programId?: string;
  isPublished: boolean;
}

export interface VideoAnalytics {
  viewCount: number;
  completionRate: number;
  avgWatchTime: number;
}

// Branding Types
export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  customCss?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: { primary: string; secondary: string; accent: string };
}

// API Key Types
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt?: string;
  requestCount: number;
  isActive: boolean;
  createdAt: string;
}

// Webhook Types
export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  event: string;
  url: string;
  statusCode?: number;
  success: boolean;
  retryCount: number;
  createdAt: string;
}

// Custom Analytics Types
export interface CustomDashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  title: string;
  dataSource: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}
